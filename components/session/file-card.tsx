"use client"

import { useState } from "react"
import type { Arquivo, FormatoConversao, NivelOtimizacao } from "@/types"
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
  Sparkles,
} from "lucide-react"
import { formatBytes, formatRelativeTime, cn, getFileExtensionLabel } from "@/lib/utils"
import { ConversionModal } from "./conversion-modal"
import { ApiError, getFormatosDisponiveis, converterArquivo, getNiveisOtimizacao, otimizarArquivo } from "@/lib/api"
import { OptimizationModal } from "./optimization-modal"
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

function getFileIconElement(mime: string) {
  if (mime.startsWith("image/")) return <FileImage className="h-5 w-5 text-muted-foreground" />
  if (mime.startsWith("video/")) return <FileVideo className="h-5 w-5 text-muted-foreground" />
  if (mime.startsWith("audio/")) return <FileAudio className="h-5 w-5 text-muted-foreground" />
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text"))
    return <FileText className="h-5 w-5 text-muted-foreground" />
  return <File className="h-5 w-5 text-muted-foreground" />
}

export function FileCard({ arquivo, isOwner, onDownload, onDelete, onCancel, canDelete, currentUserName, espacoDisponivel }: FileCardProps) {
  const [showDelete, setShowDelete] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showConversionPanel, setShowConversionPanel] = useState(false)
  const [formatosDisponiveis, setFormatosDisponiveis] = useState<FormatoConversao[]>([])
  const [loadingFormatos, setLoadingFormatos] = useState(false)
  const [selectedFormato, setSelectedFormato] = useState<FormatoConversao | null>(null)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [hasConversionOptions, setHasConversionOptions] = useState(true)
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [niveisDisponiveis, setNiveisDisponiveis] = useState<NivelOtimizacao[]>([])
  const [loadingNiveis, setLoadingNiveis] = useState(false)
  const [selectedNivel, setSelectedNivel] = useState<NivelOtimizacao | null>(null)
  const [showOptimizationModal, setShowOptimizationModal] = useState(false)
  const [hasOptimizationOptions, setHasOptimizationOptions] = useState(true)
  const [showAllAudioFormats, setShowAllAudioFormats] = useState(false)
  
  const iconElement = getFileIconElement(arquivo.tipoMime)
  const senderName = arquivo.nomeRemetente || (isOwner ? "Você" : "Outro usuário")
  const timeAgo = formatRelativeTime(arquivo.criadoEm)

  const isOptimized = arquivo.tag === "OTIMIZADO"
  const isConverted = Boolean(arquivo.arquivoOriginalId) && !isOptimized
  const extensionLabel = getFileExtensionLabel({
    nomeOriginal: arquivo.nomeOriginal,
    tipoMime: arquivo.tipoMime,
    formatoConvertido: arquivo.formatoConvertido,
    isConverted,
  })

  const podeConverter = arquivo.conversivel && arquivo.status === "COMPLETO" && espacoDisponivel > 0 && hasConversionOptions
  const podeOtimizar = arquivo.conversivel && arquivo.status === "COMPLETO" && espacoDisponivel > 0 && hasOptimizationOptions && !isOptimized

  const reduction = isOptimized && arquivo.tamanhoOriginalBytes && arquivo.tamanhoOriginalBytes > arquivo.tamanhoBytes
    ? {
        diffBytes: arquivo.tamanhoOriginalBytes - arquivo.tamanhoBytes,
        percent: Math.round(((arquivo.tamanhoOriginalBytes - arquivo.tamanhoBytes) / arquivo.tamanhoOriginalBytes) * 100),
      }
    : null

  const handleToggleConversionPanel = () => {
    const next = !showConversionPanel

    if (!next) {
      setShowConversionPanel(false)
      return
    }

    setShowConversionPanel(true)

    if (loadingFormatos) return

    setLoadingFormatos(true)
    getFormatosDisponiveis(arquivo.id)
      .then((formatos) => {
        setFormatosDisponiveis(formatos)
        const temFormatos = formatos.length > 0
        setHasConversionOptions(temFormatos)
        if (!temFormatos) {
          setShowConversionPanel(false)
        }
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 404) toast.error("Arquivo não encontrado")
          else if (err.status === 410) toast.warning("Sessão expirada")
          else toast.error(err.message)
        } else {
          toast.error("Erro ao carregar formatos disponíveis")
        }
        console.error(err)
      })
      .finally(() => setLoadingFormatos(false))
  }

  const handleFormatoClick = (formato: FormatoConversao) => {
    setSelectedFormato(formato)
    setShowConversionModal(true)
  }

  const handleToggleOptimizationPanel = () => {
    const next = !showOptimizationPanel

    if (!next) {
      setShowOptimizationPanel(false)
      return
    }

    setShowOptimizationPanel(true)

    if (loadingNiveis) return

    setLoadingNiveis(true)
    getNiveisOtimizacao(arquivo.id)
      .then((niveis) => {
        setNiveisDisponiveis(niveis)
        const temNiveis = niveis.length > 0
        setHasOptimizationOptions(temNiveis)
        if (!temNiveis) {
          setShowOptimizationPanel(false)
        }
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          if (err.status === 404) toast.error("Arquivo não encontrado")
          else if (err.status === 410) toast.warning("Sessão expirada")
          else toast.error(err.message)
        } else {
          toast.error("Erro ao carregar níveis de otimização")
        }
        console.error(err)
      })
      .finally(() => setLoadingNiveis(false))
  }

  const handleNivelClick = (nivel: NivelOtimizacao) => {
    setSelectedNivel(nivel)
    setShowOptimizationModal(true)
  }

  const handleConfirmConversion = async () => {
    if (!selectedFormato) return

    try {
      await converterArquivo(arquivo.id, selectedFormato)
      toast.success(`Conversão para ${selectedFormato} iniciada`)
      setShowConversionPanel(false)
      setSelectedFormato(null)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) toast.error("Arquivo não encontrado")
        else if (err.status === 410) toast.warning("Sessão expirada")
        else toast.error(err.message)
      } else {
        toast.error("Erro ao solicitar conversão")
      }
      console.error(err)
    }
  }

  const handleConfirmOptimization = async () => {
    if (!selectedNivel) return

    try {
      await otimizarArquivo(arquivo.id, selectedNivel)
      toast.success(`Otimização ${selectedNivel}% iniciada`)
      setShowOptimizationPanel(false)
      setSelectedNivel(null)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) toast.error("Arquivo não encontrado")
        else if (err.status === 410) toast.warning("Sessão expirada")
        else toast.error(err.message)
      } else {
        toast.error("Erro ao solicitar otimização")
      }
      console.error(err)
    }
  }

  const formatNivelLabel = (nivel: NivelOtimizacao) => {
    if (nivel === 25) return "Leve 25%"
    if (nivel === 50) return "Média 50%"
    return "Pesada 75%"
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
      case "BLOQUEADO":
        return (
          <div className="space-y-1 w-full">
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              Arquivo bloqueado
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

  const hasActions =
    podeConverter ||
    podeOtimizar ||
    arquivo.status === "COMPLETO" ||
    (onCancel && isOwner && (arquivo.status === "ENVIANDO" || arquivo.status === "PENDENTE")) ||
    canDelete

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-3 sm:p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              {iconElement}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <p className="min-w-0 text-sm font-medium leading-snug line-clamp-2 wrap-break-word sm:truncate sm:line-clamp-none">
                  {arquivo.nomeOriginal}
                </p>
                <div className="shrink-0 flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">
                    {extensionLabel}
                  </Badge>
                  {isConverted && (
                    <Badge variant="outline" className="text-xs">
                      CONVERTIDO
                    </Badge>
                  )}
                  {isOptimized && (
                    <Badge variant="outline" className="text-xs">
                      OTIMIZADO
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="truncate">{formatBytes(arquivo.tamanhoBytes)}</span>
                <span className="truncate text-right">{timeAgo}</span>
                <span className="truncate col-span-2">{senderName}</span>
                {reduction && (
                  <span className="truncate col-span-2 text-emerald-400">
                    -{reduction.percent}% ({formatBytes(reduction.diffBytes)})
                  </span>
                )}
              </div>

              <div className="mt-2">{statusElement}</div>
            </div>
          </div>

          {hasActions && (
            <div className="mt-3 flex items-center justify-end gap-1">
              {podeConverter && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Converter arquivo"
                  className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-primary hover:text-primary touch-manipulation"
                  onClick={handleToggleConversionPanel}
                >
                  <Repeat className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              )}

              {podeOtimizar && (
                <Button
                  variant="ghost"
                  aria-label="Otimizar arquivo"
                  className="h-10 px-2 md:h-8 cursor-pointer text-primary hover:text-primary touch-manipulation"
                  onClick={handleToggleOptimizationPanel}
                >
                  <Sparkles className="h-5 w-5 md:h-4 md:w-4 mr-1" />
                  <span className="text-xs font-medium">Otimizar</span>
                </Button>
              )}

              {arquivo.status === "COMPLETO" && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Baixar arquivo"
                  className="h-10 w-10 md:h-8 md:w-8 cursor-pointer text-primary hover:text-primary touch-manipulation"
                  onClick={() => onDownload(arquivo.id)}
                >
                  <Download className="h-5 w-5 md:h-4 md:w-4" />
                </Button>
              )}

              {onCancel && isOwner && (arquivo.status === "ENVIANDO" || arquivo.status === "PENDENTE") && (
                <Dialog open={showCancel} onOpenChange={setShowCancel}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Cancelar upload"
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

              {canDelete && (
                <Dialog open={showDelete} onOpenChange={setShowDelete}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir arquivo"
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
          )}
        </div>

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
            ) : (() => {
              const isAudio = arquivo.tipoMime.startsWith("audio/")
              const primaryAudioFormats: FormatoConversao[] = ['MP3', 'WAV', 'AAC', 'M4A', 'OGG', 'FLAC', 'OPUS', 'WEBM']
              
              if (isAudio && formatosDisponiveis.length > 8) {
                const primary = formatosDisponiveis.filter(f => primaryAudioFormats.includes(f))
                const additional = formatosDisponiveis.filter(f => !primaryAudioFormats.includes(f))
                const visibleFormats = showAllAudioFormats ? formatosDisponiveis : primary
                
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {visibleFormats.map((formato) => (
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
                    {additional.length > 0 && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllAudioFormats(!showAllAudioFormats)}
                          className="h-8 text-xs cursor-pointer"
                        >
                          {showAllAudioFormats ? 'Mostrar menos' : `Mostrar mais (${additional.length})`}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
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
              )
            })()}
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out border-t",
            showOptimizationPanel ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="p-4 bg-secondary/30 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Otimizar em:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOptimizationPanel(false)}
                className="h-8 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            </div>

            {loadingNiveis ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : niveisDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum nível disponível
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {niveisDisponiveis.map((nivel) => (
                  <Badge
                    key={nivel}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors justify-center py-2 text-sm"
                    onClick={() => handleNivelClick(nivel)}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {formatNivelLabel(nivel)}
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

      <OptimizationModal
        isOpen={showOptimizationModal}
        onClose={() => {
          setShowOptimizationModal(false)
          setSelectedNivel(null)
        }}
        onConfirm={handleConfirmOptimization}
        nivel={selectedNivel}
        nomeArquivo={arquivo.nomeOriginal}
      />
    </Card>
  )
}
