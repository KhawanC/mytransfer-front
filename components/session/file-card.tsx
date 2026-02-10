"use client"

import { useState, useEffect } from "react"
import type { Arquivo, FormatoImagem } from "@/types"
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
  Repeat,
  ChevronLeft,
  FileType,
} from "lucide-react"
import { formatBytes, formatRelativeTime, cn } from "@/lib/utils"
import { ConversionModal } from "./conversion-modal"
import { getFormatosDisponiveis, converterArquivo } from "@/lib/api"
import { toast } from "sonner"

interface FileCardProps {
  arquivo: Arquivo
  isOwner: boolean
  onDownload: (id: string) => void
  onDelete: (id: string) => void
  onCancel?: (id: string) => void
  canDelete: boolean
  currentUserName?: string
  espacoDisponivel: number
}

function getFileIcon(mime: string) {
  if (mime.startsWith("image/")) return FileImage
  if (mime.startsWith("video/")) return FileVideo
  if (mime.startsWith("audio/")) return FileAudio
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text"))
    return FileText
  return File
}

export function FileCard({ arquivo, isOwner, onDownload, onDelete, onCancel, canDelete, currentUserName, espacoDisponivel }: FileCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showConversionPanel, setShowConversionPanel] = useState(false)
  const [formatosDisponiveis, setFormatosDisponiveis] = useState<FormatoImagem[]>([])
  const [loadingFormatos, setLoadingFormatos] = useState(false)
  const [selectedFormato, setSelectedFormato] = useState<FormatoImagem | null>(null)
  const [showConversionModal, setShowConversionModal] = useState(false)
  
  const Icon = getFileIcon(arquivo.tipoMime)
  const senderName = arquivo.nomeRemetente || (isOwner ? "Você" : "Outro usuário")
  const timeAgo = formatRelativeTime(arquivo.criadoEm)

  const podeConverter = arquivo.conversivel && arquivo.status === "COMPLETO" && espacoDisponivel > 0

  useEffect(() => {
    if (showConversionPanel && formatosDisponiveis.length === 0 && !loadingFormatos) {
      setLoadingFormatos(true)
      getFormatosDisponiveis(arquivo.id)
        .then(setFormatosDisponiveis)
        .catch((err) => {
          toast.error("Erro ao carregar formatos disponíveis")
          console.error(err)
        })
        .finally(() => setLoadingFormatos(false))
    }
  }, [showConversionPanel, arquivo.id, formatosDisponiveis.length, loadingFormatos])

  const handleFormatoClick = (formato: FormatoImagem) => {
    setSelectedFormato(formato)
    setShowConversionModal(true)
  }

  const handleConfirmConversion = async () => {
    if (!selectedFormato) return

    try {
      await converterArquivo(arquivo.id, selectedFormato)
      toast.success(`Conversão para ${selectedFormato} iniciada`)
      setShowConversionPanel(false)
      setSelectedFormato(null)
    } catch (err) {
      toast.error("Erro ao solicitar conversão")
      console.error(err)
    }
  }

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
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Erro no upload
            </div>
            {arquivo.mensagemErro && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {arquivo.mensagemErro}
              </p>
            )}
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
      <CardContent className="p-0">
        {/* Main file info */}
        <div className="flex items-center gap-3 py-3 px-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{arquivo.nomeOriginal}</p>
              {arquivo.arquivoOriginalId && (
                <Badge variant="secondary" className="text-xs">
                  {arquivo.formatoConvertido}
                </Badge>
              )}
            </div>
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
            {/* Conversion button */}
            {podeConverter && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-primary hover:text-primary touch-manipulation"
                onClick={() => setShowConversionPanel(!showConversionPanel)}
              >
                <Repeat className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}

            {/* Download */}
            {arquivo.status === "COMPLETO" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-primary hover:text-primary touch-manipulation"
                onClick={() => onDownload(arquivo.id)}
              >
                <Download className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            )}

            {/* Cancel button */}
            {onCancel && isOwner && (arquivo.status === "ENVIANDO" || arquivo.status === "PENDENTE") && (
              <Dialog open={showCancel} onOpenChange={setShowCancel}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-muted-foreground hover:text-destructive touch-manipulation"
                  >
                    <X className="h-5 w-5 md:h-4 md:w-4" />
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

            {/*Delete button */}
            {canDelete && (
              <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-muted-foreground hover:text-destructive touch-manipulation"
                  >
                    <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
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
        </div>

        {/* Conversion panel */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out border-t",
            showConversionPanel ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4 bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Converter para:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConversionPanel(false)}
                className="h-8 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </div>

            {loadingFormatos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : formatosDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum formato disponível
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {formatosDisponiveis.map((formato) => (
                  <Badge
                    key={formato}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors justify-center py-2 text-sm"
                    onClick={() => handleFormatoClick(formato)}
                  >
                    <FileType className="h-3 w-3 mr-1" />
                    {formato}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <ConversionModal
        isOpen={showConversionModal}
        onClose={() => {
          setShowConversionModal(false)
          setSelectedFormato(null)
        }}
        onConfirm={handleConfirmConversion}
        formato={selectedFormato}
        nomeArquivo={arquivo.nomeOriginal}
      />
    </Card>
  )
}
