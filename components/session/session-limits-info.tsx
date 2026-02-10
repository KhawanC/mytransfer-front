"use client"

import { useEffect, useState } from "react"
import { fetchSessionLimits } from "@/lib/api"
import type { SessaoLimites } from "@/types"
import { UserTypeBadge } from "@/components/ui/user-type-badge"
import { FileText, HardDrive, Clock } from "lucide-react"

interface SessionLimitsInfoProps {
  sessaoId: string
  totalArquivos: number
}

export function SessionLimitsInfo({ sessaoId, totalArquivos }: SessionLimitsInfoProps) {
  const [limites, setLimites] = useState<SessaoLimites | null>(null)

  useEffect(() => {
    fetchSessionLimits(sessaoId)
      .then(setLimites)
      .catch(() => setLimites(null))
  }, [sessaoId])

  if (!limites) return null

  const formatSize = (mb: number) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`)

  return (
    <div className="mx-auto max-w-2xl px-4 pb-3">
      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span>Criada por</span>
          <UserTypeBadge userType={limites.userType} />
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>
            {limites.arquivosIlimitados 
              ? `${totalArquivos} arquivos` 
              : `${totalArquivos}/${limites.maxArquivos} arquivos`}
          </span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <HardDrive className="h-3 w-3" />
          <span>Máx {formatSize(limites.maxTamanhoMb)}</span>
        </div>
        <span className="text-border">•</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{limites.duracaoMinutos}min</span>
        </div>
      </div>
    </div>
  )
}
