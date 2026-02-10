"use client"

import type { Arquivo, StatusSessao } from "@/types"
import { FileCard } from "./file-card"

interface FileListProps {
  arquivos: Arquivo[]
  currentUserId: string
  currentUserName?: string
  onDownload: (arquivoId: string) => void
  onDelete: (arquivoId: string) => void
  onCancel?: (arquivoId: string) => void
  sessionStatus: StatusSessao
  espacoDisponivel: number
}

export function FileList({ arquivos, currentUserId, currentUserName, onDownload, onDelete, onCancel, sessionStatus, espacoDisponivel }: FileListProps) {
  if (arquivos.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum arquivo enviado ainda
        </p>
      </div>
    )
  }

  const sorted = [...arquivos].sort((a, b) => {
    const order = { ENVIANDO: 0, PROCESSANDO: 1, PENDENTE: 2, COMPLETO: 3, ERRO: 4 }
    return (order[a.status] ?? 5) - (order[b.status] ?? 5)
  })

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Arquivos ({arquivos.length})
      </p>
      {sorted.map((arq) => (
        <FileCard
          key={arq.id}
          arquivo={arq}
          isOwner={arq.remetenteId === currentUserId}
          currentUserName={currentUserName}
          onDownload={onDownload}
          onDelete={onDelete}
          onCancel={onCancel}
          canDelete={arq.remetenteId === currentUserId}
          espacoDisponivel={espacoDisponivel}
        />
      ))}
    </div>
  )
}
