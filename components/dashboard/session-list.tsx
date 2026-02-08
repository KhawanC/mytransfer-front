"use client"

import type { Sessao } from "@/types"
import { SessionCard } from "./session-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock } from "lucide-react"

interface SessionListProps {
  sessions: Sessao[]
  isLoading: boolean
  currentUserId: string
  onDeleted?: () => void
}

export function SessionList({ sessions, isLoading, currentUserId, onDeleted }: SessionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Sessões</span>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma sessão encontrada. Crie uma nova sessão para começar!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Sessões ({sessions.length})</span>
      </div>
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} currentUserId={currentUserId} onDeleted={onDeleted} />
      ))}
    </div>
  )
}
