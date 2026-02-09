"use client"

import { useState } from "react"
import type { Sessao } from "@/types"
import { useCountdown } from "@/hooks/use-countdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatHash } from "@/lib/utils"
import { ArrowLeftRight, ArrowLeft, Clock, Copy, Power, QrCode, Wifi, WifiOff, LogOut } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SessionHeaderProps {
  session: Sessao
  isCreator: boolean
  onEndSession: () => void
  onLeaveSession?: () => void
  isConnected: boolean
}

export function SessionHeader({ session, isCreator, onEndSession, onLeaveSession, isConnected }: SessionHeaderProps) {
  const router = useRouter()
  const { formatted, isExpired } = useCountdown(session.expiraEm)
  const [showQr, setShowQr] = useState(false)
  const isActive = session.estaAtiva ?? false

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/transfer/${session.hashConexao}`
      : ""

  function handleCopyHash() {
    navigator.clipboard.writeText(session.hashConexao)
    toast.success("Hash copiado!")
  }

  const statusColor =
    session.status === "ATIVA"
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : session.status === "AGUARDANDO"
        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
        : session.status === "AGUARDANDO_APROVACAO"
          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
          : session.status === "EXPIRADA"
            ? "bg-red-500/20 text-red-400 border-red-500/30"
            : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  
  const statusLabel =
    session.status === "AGUARDANDO"
      ? "Aguardando"
      : session.status === "AGUARDANDO_APROVACAO"
        ? "Pendente"
        : session.status === "ATIVA"
          ? "Ativa"
          : session.status === "EXPIRADA"
            ? "Expirada"
            : "Encerrada"

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 cursor-pointer" 
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            <span className="font-semibold tracking-tight">MePassa</span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}

            {isCreator && isActive && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive">
                    <Power className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Encerrar sessão?</DialogTitle>
                    <DialogDescription>
                      Todos os participantes serão desconectados. Os arquivos permanecerão disponíveis
                      temporariamente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="destructive" onClick={onEndSession} className="w-full cursor-pointer">
                      Encerrar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              

            {onLeaveSession && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-orange-400">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Sair da sessão?</DialogTitle>
                    <DialogDescription>
                      Você será desconectado da sessão. O criador poderá convidar outro usuário.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="destructive" onClick={onLeaveSession} className="w-full cursor-pointer">
                      Sair
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}</Dialog>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHash}
              className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 cursor-pointer hover:bg-secondary/80 transition-colors"
            >
              <span className="font-mono text-xs font-medium tracking-wider">
                {formatHash(session.hashConexao)}
              </span>
              <Copy className="h-3 w-3 text-muted-foreground" />
            </button>

            {isActive && (
              <Dialog open={showQr} onOpenChange={setShowQr}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                    <QrCode className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader>
                    <DialogTitle>QR Code</DialogTitle>
                    <DialogDescription>
                      Escaneie para entrar na sessão
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <div className="rounded-xl bg-white p-3">
                      <QRCodeSVG value={shareUrl} size={180} level="M" />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Clock className={`h-3.5 w-3.5 ${isExpired ? "text-red-400" : "text-muted-foreground"}`} />
            <span className={`font-mono ${isExpired ? "text-red-400" : "text-muted-foreground"}`}>
              {formatted}
            </span>
          </div>
        </div>

        {session.status === "AGUARDANDO_APROVACAO" && !isCreator && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-400">
            ⏳ Aguardando aprovação do criador da sessão...
          </div>
        )}

        {session.status === "AGUARDANDO_APROVACAO" && isCreator && session.nomeUsuarioConvidadoPendente && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-xs text-blue-400">
            👤 <span className="font-semibold">{session.nomeUsuarioConvidadoPendente}</span> está aguardando sua aprovação
          </div>
        )}
      </div>
    </header>
  )
}
