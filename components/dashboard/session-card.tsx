"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Sessao, StatusSessao } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatHash } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowRight, FileStack, Users, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { ApiError, deleteSession } from "@/lib/api"

interface SessionCardProps {
  session: Sessao
  currentUserId: string
  onDeleted?: () => void
}

const statusConfig: Record<StatusSessao, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  AGUARDANDO: { label: "Aguardando", variant: "outline" },
  AGUARDANDO_APROVACAO: { label: "Aguardando Aprovação", variant: "outline" },
  ATIVA: { label: "Ativa", variant: "default" },
  EXPIRADA: { label: "Expirada", variant: "destructive" },
  ENCERRADA: { label: "Encerrada", variant: "secondary" },
}

export function SessionCard({ session, currentUserId, onDeleted }: SessionCardProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const config = statusConfig[session.status] || { label: "Desconhecido", variant: "secondary" as const }
  const isActive = session.estaAtiva ?? false
  const isCreator = session.usuarioCriadorId === currentUserId
  const canDelete = session.podeEncerrar ?? false

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteSession(session.id)
      toast.success("Sessão encerrada com sucesso")
      onDeleted?.()
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 410) toast.warning("Sessão expirada")
        else toast.error(error.message)
      } else {
        toast.error("Erro ao encerrar sessão")
      }
      console.error(error)
    } finally {
      setIsDeleting(false)
      setShowDelete(false)
    }
  }

  const handleCardClick = () => {
    if (isActive) {
      router.push(`/sessao/${session.id}`)
    }
  }

  return (
    <>
    <Card
      className={`transition-colors ${isActive ? "cursor-pointer hover:bg-secondary/50" : "opacity-60"}`}
      onClick={handleCardClick}
    >
      <CardContent className="flex items-center justify-between py-3 px-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium tracking-wider truncate">
              {formatHash(session.hashConexao)}
            </span>
            <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isCreator ? "Criador" : "Convidado"}
            </span>
            <span className="flex items-center gap-1">
              <FileStack className="h-3 w-3" />
              {session.totalArquivosTransferidos} arquivo(s)
            </span>
            <span>
              {formatDistanceToNow(new Date(session.criadaEm), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>

        {isActive && (
          <div className="flex items-center gap-1 shrink-0">
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDelete(true)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A sessão será encerrada e não será mais possível enviar ou receber arquivos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Encerrando..." : "Encerrar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
