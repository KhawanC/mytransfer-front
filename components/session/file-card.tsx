"use client"

import { useState } from "react"
import type { Arquivo } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Download,
  Trash2,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react"
import { formatBytes, formatRelativeTime } from "@/lib/utils"

interface FileCardProps {
  arquivo: Arquivo
  isOwner: boolean
  onDownload: (id: string) => void
  onDelete: (id: string) => void
  onCancel?: (id: string) => void
  canDelete: boolean
  currentUserName?: string
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage
  if (mime.startsWith("video/")) return FileVideo
  if (mime.startsWith("audio/")) return FileAudio
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text"))
    return FileText
  return File
}

export function FileCard({ arquivo, isOwner, onDownload, onDelete, onCancel, canDelete, currentUserName }: FileCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const Icon = getFileIcon(arquivo.tipoMime)

  const senderName = arquivo.nomeRemetente || (isOwner ? "Você" : "Outro usuário")
  const timeAgo = formatRelativeTime(arquivo.criadoEm)

  const statusElement = (() => {
    switch (arquivo.status) {
      case "ENVIANDO":
        return (
          <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400">Enviando...</span>
              <span className="text-muted-foreground">
                {Math.round(arquivo.progressoUpload)}%
              </span>
            </div>
            <Progress value={arquivo.progressoUpload} className="h-1.5" />
          </div>
        )
      case "PROCESSANDO":
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando...
          </div>
        )
      case "COMPLETO":
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Completo
          </div>
        )
      case "ERRO":
        return (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            Erro no upload
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3" />
            Pendente
          </div>
        )
    }
  })()

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 py-3 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium truncate">{arquivo.nomeOriginal}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {formatBytes(arquivo.tamanhoBytes)}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {senderName}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {statusElement}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Download - disponível para todos da sessão quando o arquivo estiver completo */}
          {arquivo.status === "COMPLETO" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-primary hover:text-primary"
              onClick={() => onDownload(arquivo.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}

          {/* Botão de cancelar - aparece apenas para uploads em andamento pelo dono do arquivo */}
          {onCancel && isOwner && (arquivo.status === "ENVIANDO" || arquivo.status === "PENDENTE") && (
            <Dialog open={showCancel} onOpenChange={setShowCancel}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Cancelar upload?</DialogTitle>
                  <DialogDescription>
                    O envio de {arquivo.nomeOriginal} será interrompido.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    onClick={() => setShowCancel(false)}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full cursor-pointer"
                    onClick={() => {
                      onCancel(arquivo.id)
                      setShowCancel(false)
                    }}
                  >
                    Cancelar Upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Botão de excluir - aparece apenas para o dono do arquivo */}
          {canDelete && (
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>Excluir arquivo?</DialogTitle>
                  <DialogDescription>
                    {arquivo.nomeOriginal} será removido permanentemente.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="destructive"
                    className="w-full cursor-pointer"
                    onClick={() => {
                      onDelete(arquivo.id)
                      setShowDelete(false)
                    }}
                  >
                    Excluir
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
