"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { getChatHistory, markChatAsRead } from "@/lib/api"
import type { ChatDigitandoEvent, ChatMensagem } from "@/types"
import { MessageCircle, Minus, Send } from "lucide-react"

interface ChatPanelProps {
  sessaoId: string
  currentUserId: string
  currentUserName?: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isConnected: boolean
  canChat: boolean
  subscribe: (destination: string, callback: (body: unknown) => void) => () => void
  send: (destination: string, body: unknown) => void
}

export function ChatPanel({
  sessaoId,
  currentUserId,
  currentUserName,
  isOpen,
  onOpenChange,
  isConnected,
  canChat,
  subscribe,
  send,
}: ChatPanelProps) {
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([])
  const [mensagem, setMensagem] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const isOpenRef = useRef(isOpen)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingIndicatorRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const readInFlightRef = useRef(false)

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  const displayUnread = useMemo(() => {
    const capped = Math.min(9, unreadCount)
    return capped > 0 ? `+${capped}` : null
  }, [unreadCount])

  const carregarHistorico = useCallback(async () => {
    const historico = await getChatHistory(sessaoId)
    setMensagens(historico.mensagens)
    setUnreadCount(historico.naoLidas)
  }, [sessaoId])

  const marcarComoLido = useCallback(async () => {
    if (readInFlightRef.current) return
    readInFlightRef.current = true
    try {
      await markChatAsRead(sessaoId)
      setUnreadCount(0)
    } finally {
      readInFlightRef.current = false
    }
  }, [sessaoId])

  useEffect(() => {
    carregarHistorico()
  }, [carregarHistorico])

  useEffect(() => {
    if (!isConnected) return

    const unsubChat = subscribe(`/topic/sessao/${sessaoId}/chat`, (data) => {
      const nova = data as ChatMensagem
      setMensagens((prev) => [...prev, nova])

      if (nova.remetenteId !== currentUserId) {
        if (isOpenRef.current) {
          marcarComoLido()
        } else {
          setUnreadCount((prev) => Math.min(9, prev + 1))
        }
      }
    })

    const unsubTyping = subscribe(`/topic/sessao/${sessaoId}/chat/digitando`, (data) => {
      const evento = data as ChatDigitandoEvent
      if (evento.usuarioId === currentUserId) return

      if (evento.digitando) {
        setTypingUser(evento.usuarioNome)
        if (typingIndicatorRef.current) clearTimeout(typingIndicatorRef.current)
        typingIndicatorRef.current = setTimeout(() => setTypingUser(null), 2000)
      } else {
        setTypingUser(null)
      }
    })

    return () => {
      unsubChat()
      unsubTyping()
    }
  }, [subscribe, sessaoId, isConnected, currentUserId, marcarComoLido])

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      marcarComoLido()
    }
  }, [isOpen, unreadCount, marcarComoLido])

  useEffect(() => {
    if (!isOpen) return
    const list = listRef.current
    if (!list) return
    list.scrollTop = list.scrollHeight
  }, [mensagens, isOpen])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (typingIndicatorRef.current) clearTimeout(typingIndicatorRef.current)
    }
  }, [])

  const enviarDigitando = useCallback(
    (digitando: boolean) => {
      send("/app/chat/digitando", { sessaoId, digitando })
    },
    [send, sessaoId],
  )

  const handleMensagemChange = useCallback(
    (value: string) => {
      setMensagem(value)

      if (!canChat) return

      enviarDigitando(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => enviarDigitando(false), 1200)
    },
    [canChat, enviarDigitando],
  )

  const handleSend = useCallback(() => {
    const trimmed = mensagem.trim()
    if (!trimmed || !canChat) return

    send("/app/chat/enviar", { sessaoId, conteudo: trimmed })
    setMensagem("")
    enviarDigitando(false)
  }, [mensagem, canChat, send, sessaoId, enviarDigitando])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const renderMensagem = useCallback((texto: string) => {
    const regex = /(https?:\/\/[^\s]+)/g
    const parts = texto.split(regex)

    return parts.map((part, index) => {
      if (/^https?:\/\//.test(part)) {
        return (
          <a
            key={`link-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline decoration-primary/60 underline-offset-4 hover:decoration-primary"
          >
            {part}
          </a>
        )
      }

      return <span key={`text-${index}`}>{part}</span>
    })
  }, [])

  const chatHeader = (
    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Chat da sessão</p>
          <p className="text-xs text-muted-foreground">
            {typingUser ? `${typingUser} digitando...` : "Mensagens em tempo real"}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 cursor-pointer"
        onClick={() => onOpenChange(false)}
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
  )

  const chatBody = (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {mensagens.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Inicie a conversa enviando uma mensagem
          </div>
        ) : (
          mensagens.map((msg) => {
            const isSelf = msg.remetenteId === currentUserId
            const horario = new Date(msg.criadoEm).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-1 ${
                    isSelf
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-foreground"
                  }`}
                >
                  <div className="text-xs font-semibold opacity-80">
                    {isSelf ? currentUserName ?? "Você" : msg.remetenteNome}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap wrap-break-word">
                    {renderMensagem(msg.conteudo)}
                  </div>
                  <div className="mt-2 text-[10px] opacity-70">{horario}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="border-t border-border/50 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={mensagem}
            onChange={(event) => handleMensagemChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canChat ? "Escreva sua mensagem..." : "Chat disponível apenas em sessões ativas"}
            rows={1}
            disabled={!canChat}
            className="min-h-11 max-h-32 flex-1 resize-none rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={handleSend}
            disabled={!mensagem.trim() || !canChat}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:-translate-y-1"
          aria-label="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
          {displayUnread && (
            <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              {displayUnread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 backdrop-blur-sm lg:hidden">
          <div className="flex h-[85vh] w-full flex-col rounded-t-2xl border border-border/50 bg-background shadow-2xl">
            {chatHeader}
            {chatBody}
          </div>
        </div>
      )}

      {isOpen && (
        <aside className="hidden h-[calc(100dvh-220px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-xl backdrop-blur lg:flex">
          {chatHeader}
          {chatBody}
        </aside>
      )}
    </>
  )
}
