"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { useWebSocket } from "@/hooks/use-websocket"
import { api, createSubscriptionCheckout, getSubscriptionStatus, markSubscriptionCelebration } from "@/lib/api"
import type { CheckoutResponse, Sessao, NotificacaoResponse } from "@/types"
import { CreateSession } from "@/components/dashboard/create-session"
import { JoinSession } from "@/components/dashboard/join-session"
import { SessionList } from "@/components/dashboard/session-list"
import { UpgradeLimits } from "@/components/dashboard/upgrade-limits"
import { SubscriptionQrModal } from "@/components/dashboard/subscription-qr-modal"
import { Confetti } from "@/components/ui/confetti"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<Sessao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [qrData, setQrData] = useState<CheckoutResponse | null>(null)
  const [showQr, setShowQr] = useState(false)
  const { isConnected, subscribe } = useWebSocket()

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api<Sessao[]>("/api/transferencia/sessoes")
      setSessions(data)
    } catch {
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useEffect(() => {
    if (!user) return

    getSubscriptionStatus()
      .then((status) => {
        if (status.status === "ATIVA" && !status.celebracaoExibida) {
          setShowSuccess(true)
          setShowConfetti(true)
          markSubscriptionCelebration()
          refreshUser()
          setTimeout(() => setShowConfetti(false), 5200)
        }

        const hasQrInfo = !!status.brCode || !!status.qrCodeImageUrl
        if (status.status === "PENDENTE" && hasQrInfo && status.pagamentoExpiraEm && status.planoId) {
          const expiraEm = new Date(status.pagamentoExpiraEm).getTime()
          if (expiraEm > Date.now()) {
            setQrData({
              assinaturaId: status.assinaturaId ?? "",
              planoId: status.planoId,
              brCode: status.brCode ?? "",
              qrCodeImageUrl: status.qrCodeImageUrl ?? "",
              paymentLinkUrl: status.paymentLinkUrl,
              expiraEm: status.pagamentoExpiraEm,
            })
            setShowQr(true)
          }
        }
      })
      .catch(() => {
        setShowQr(false)
      })
  }, [user])
  
  useEffect(() => {
    if (!isConnected || !user) return

    const unsubNotif = subscribe("/user/queue/notificacoes", (data) => {
      const notif = data as NotificacaoResponse
      if (notif.tipo === "SOLICITACAO_ENTRADA_CRIADOR") {
        const sessaoId = notif.dados as string
        toast.info(notif.mensagem)
        // Redireciona o criador para a página da sessão automaticamente
        router.push(`/sessao/${sessaoId}`)
      }
      if (notif.tipo === "ASSINATURA_PAGA") {
        setShowQr(false)
        setShowSuccess(true)
        setShowConfetti(true)
        markSubscriptionCelebration()
        refreshUser()
        setTimeout(() => setShowConfetti(false), 5200)
      }
    })

    return () => {
      unsubNotif()
    }
  }, [isConnected, user, subscribe, router, refreshUser])

  const handleSessionCreated = useCallback(async (sessao: Sessao) => {
    setSessions((prev) => [sessao, ...prev])
  }, [])

  const handleCheckoutCreated = useCallback((data: CheckoutResponse) => {
    setQrData(data)
    setShowQr(true)
  }, [])

  const handleQrRefresh = useCallback(async (planoId: string) => {
    const data = await createSubscriptionCheckout(planoId)
    setQrData(data)
    setShowQr(true)
  }, [])

  const handleJoined = useCallback((sessao: Sessao) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === sessao.id)
      if (exists) return prev.map((s) => (s.id === sessao.id ? sessao : s))
      return [sessao, ...prev]
    })
  }, [])

  const hasActivePending = user?.userType !== "PREMIUM" && sessions.some((s) => s.estaAtiva)

  return (
    <div className="space-y-6">
      <Confetti active={showConfetti} />
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assinatura ativada</DialogTitle>
            <DialogDescription>
              Seu plano premium ja esta disponivel. Aproveite os novos limites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full cursor-pointer" onClick={() => setShowSuccess(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SubscriptionQrModal
        open={showQr}
        onOpenChange={setShowQr}
        data={qrData}
        onRefresh={handleQrRefresh}
      />
      <UpgradeLimits onCheckoutCreated={handleCheckoutCreated} />
      <div className="grid grid-cols-2 gap-3">
        <CreateSession
          onCreated={handleSessionCreated}
          disabled={hasActivePending}
          userType={user?.userType}
        />
        <JoinSession onJoined={handleJoined} />
      </div>

      {hasActivePending && (
        <p className="text-xs text-muted-foreground text-center">
          Você já possui uma sessão ativa ou pendente
        </p>
      )}

      <SessionList
        sessions={sessions}
        isLoading={isLoading}
        currentUserId={user?.id ?? ""}
        onDeleted={fetchSessions}
      />
    </div>
  )
}
