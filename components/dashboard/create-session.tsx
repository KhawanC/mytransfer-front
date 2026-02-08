"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Sessao } from "@/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, Copy, QrCode } from "lucide-react"
import { toast } from "sonner"
import { formatHash } from "@/lib/utils"
import { QRCodeSVG } from "qrcode.react"

interface CreateSessionProps {
  onCreated: (sessao: Sessao) => void
  disabled: boolean
}

export function CreateSession({ onCreated, disabled }: CreateSessionProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createdSession, setCreatedSession] = useState<Sessao | null>(null)
  const router = useRouter()

  async function handleCreate() {
    setIsCreating(true)
    try {
      const sessao = await api<Sessao>("/api/transferencia/sessao", { method: "POST" })
      setCreatedSession(sessao)
      onCreated(sessao)
      toast.success("Sessão criada!")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar sessão"
      toast.error(msg.includes("409") || msg.includes("400") ? "Você já possui uma sessão ativa" : msg)
      setOpen(false)
    } finally {
      setIsCreating(false)
    }
  }

  function handleCopyHash() {
    if (createdSession) {
      navigator.clipboard.writeText(createdSession.hashConexao)
      toast.success("Hash copiado!")
    }
  }

  function handleGoToSession() {
    if (createdSession) {
      router.push(`/sessao/${createdSession.id}`)
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value)
    if (!value) {
      setCreatedSession(null)
    }
  }

  const shareUrl = createdSession
    ? `${window.location.origin}/transfer/${createdSession.hashConexao}`
    : ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="h-12 cursor-pointer gap-2"
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Criar Sessão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        {!createdSession ? (
          <>
            <DialogHeader>
              <DialogTitle>Nova Sessão</DialogTitle>
              <DialogDescription>
                Crie uma sessão para compartilhar arquivos com alguém. Compartilhe o código ou QR
                Code gerado.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating} className="w-full cursor-pointer">
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Sessão Criada!</DialogTitle>
              <DialogDescription>
                Compartilhe o código ou QR Code abaixo para que alguém entre na sessão.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-xl bg-white p-3">
                <QRCodeSVG value={shareUrl} size={160} level="M" />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2.5">
                <span className="font-mono text-lg font-bold tracking-widest">
                  {formatHash(createdSession.hashConexao)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={handleCopyHash}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleGoToSession} className="w-full cursor-pointer">
              Ir para sessão
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
