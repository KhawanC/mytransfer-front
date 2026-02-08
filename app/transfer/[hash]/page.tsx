"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import type { Sessao } from "@/types"
import { ArrowLeftRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function TransferPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params)
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      const redirectUrl = `/transfer/${hash}`
      router.replace(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
      return
    }

    async function joinSession() {
      setIsJoining(true)
      try {
        const sessao = await api<Sessao>("/api/transferencia/sessao/entrar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash }),
        })
        router.replace(`/sessao/${sessao.id}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Não foi possível entrar na sessão"
        toast.error(message)
        router.replace("/dashboard")
      }
    }

    joinSession()
  }, [authLoading, isAuthenticated, hash, router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <ArrowLeftRight className="h-8 w-8 text-primary" />
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {authLoading ? "Verificando autenticação..." : isJoining ? "Entrando na sessão..." : "Redirecionando..."}
        </p>
      </div>
    </div>
  )
}
