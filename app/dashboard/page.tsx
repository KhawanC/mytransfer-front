"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import type { Sessao } from "@/types"
import { CreateSession } from "@/components/dashboard/create-session"
import { JoinSession } from "@/components/dashboard/join-session"
import { SessionList } from "@/components/dashboard/session-list"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Sessao[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const handleSessionCreated = useCallback(async (sessao: Sessao) => {
    setSessions((prev) => [sessao, ...prev])
  }, [])

  const handleJoined = useCallback((sessao: Sessao) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === sessao.id)
      if (exists) return prev.map((s) => (s.id === sessao.id ? sessao : s))
      return [sessao, ...prev]
    })
  }, [])

  const hasActivePending = sessions.some(
    (s) => s.status === "AGUARDANDO" || s.status === "ATIVA",
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <CreateSession
          onCreated={handleSessionCreated}
          disabled={hasActivePending}
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
