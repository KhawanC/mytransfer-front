"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import type { Sessao } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Loader2, Keyboard, Camera } from "lucide-react"
import { QrScanner } from "./qr-scanner"
import { toast } from "sonner"

interface JoinSessionProps {
  onJoined: (sessao: Sessao) => void
}

export function JoinSession({ onJoined }: JoinSessionProps) {
  const [open, setOpen] = useState(false)
  const [hash, setHash] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const joinSession = useCallback(
    async (hashConexao: string) => {
      setIsJoining(true)
      try {
        const sessao = await api<Sessao>("/api/transferencia/sessao/entrar", {
          method: "POST",
          body: JSON.stringify({ hashConexao: hashConexao.replace(/\D/g, "") }),
        })
        onJoined(sessao)
        toast.success("Conectado à sessão!")
        setOpen(false)
        router.push(`/sessao/${sessao.id}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erro ao entrar na sessão"
        if (msg.includes("404")) toast.error("Sessão não encontrada")
        else if (msg.includes("400")) toast.error("Sessão indisponível ou você é o criador")
        else toast.error(msg)
      } finally {
        setIsJoining(false)
      }
    },
    [onJoined, router],
  )

  function handleSubmitHash(e: React.FormEvent) {
    e.preventDefault()
    if (hash.trim().length === 0) return
    joinSession(hash.trim())
  }

  function handleQrResult(data: string) {
    // Remove espaços em branco e quebras de linha
    const cleanData = data.trim()
    
    console.log("QR Code escaneado:", cleanData)
    
    // Tenta extrair o hash da URL completa
    const urlMatch = cleanData.match(/\/transfer\/(\d{8})/)
    if (urlMatch) {
      console.log("Hash extraído da URL:", urlMatch[1])
      joinSession(urlMatch[1])
      return
    }
    
    // Se for apenas o hash (8 dígitos)
    if (/^\d{8}$/.test(cleanData)) {
      console.log("Hash direto:", cleanData)
      joinSession(cleanData)
      return
    }
    
    // Fallback: tenta extrair qualquer sequência de 8 dígitos consecutivos
    const numericMatch = cleanData.match(/(\d{8})/)
    if (numericMatch) {
      console.log("Hash extraído por fallback:", numericMatch[1])
      joinSession(numericMatch[1])
      return
    }
    
    console.error("QR Code inválido:", cleanData)
    toast.error("Código QR inválido. Formato esperado: 8 dígitos")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 cursor-pointer gap-2">
          <UserPlus className="h-4 w-4" />
          Entrar em Sessão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Entrar em Sessão</DialogTitle>
          <DialogDescription>
            Digite o código da sessão ou escaneie o QR Code para entrar.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="hash" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hash" className="gap-1.5">
              <Keyboard className="h-3.5 w-3.5" />
              Código
            </TabsTrigger>
            <TabsTrigger value="qr" className="gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hash" className="mt-4">
            <form onSubmit={handleSubmitHash} className="space-y-3">
              <Input
                placeholder="Ex: 12345678"
                value={hash}
                onChange={(e) => setHash(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                className="font-mono text-center tracking-widest text-lg"
              />
              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isJoining || hash.trim().length === 0}
              >
                {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="qr" className="mt-4">
            <QrScanner onResult={handleQrResult} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
