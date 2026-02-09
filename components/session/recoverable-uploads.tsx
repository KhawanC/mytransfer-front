"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, X, Upload, FileIcon } from "lucide-react"
import type { RecoverableUpload } from "@/hooks/use-upload-recovery"
import type { PersistedUploadSession } from "@/lib/upload-storage"

interface RecoverableUploadsProps {
  uploads: RecoverableUpload[]
  onResume: (file: File, session: PersistedUploadSession) => void
  onDiscard: (fingerprint: string) => void
  onDiscardAll: () => void
  isResuming: boolean
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function RecoverableUploads({
  uploads,
  onResume,
  onDiscard,
  onDiscardAll,
  isResuming,
}: RecoverableUploadsProps) {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())

  if (uploads.length === 0) {
    return null
  }

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    session: PersistedUploadSession
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      onResume(file, session)
    }
    event.target.value = ""
  }

  const triggerFileSelect = (fingerprint: string) => {
    const input = fileInputRefs.current.get(fingerprint)
    if (input) {
      input.click()
    }
  }

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-yellow-500" />
              Uploads Interrompidos
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {uploads.length === 1
                ? "1 upload pode ser retomado"
                : `${uploads.length} uploads podem ser retomados`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscardAll}
            className="text-muted-foreground hover:text-destructive"
          >
            Descartar todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {uploads.map((upload) => {
          const { localSession, progressoPorcentagem, chunksFaltantes, serverData } = upload

          return (
            <div
              key={localSession.fingerprint}
              className="flex items-center gap-3 p-3 rounded-md bg-background/50 border"
            >
              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {localSession.fileName}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(localSession.fileSize)}</span>
                  <span>•</span>
                  <span>{Math.round(progressoPorcentagem)}% enviado</span>
                  {chunksFaltantes > 0 && (
                    <>
                      <span>•</span>
                      <span>{chunksFaltantes} partes restantes</span>
                    </>
                  )}
                </div>
                <Progress value={progressoPorcentagem} className="h-1 mt-2" />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Input hidden para selecionar arquivo */}
                <input
                  type="file"
                  className="hidden"
                  ref={(el) => {
                    if (el) {
                      fileInputRefs.current.set(localSession.fingerprint, el)
                    }
                  }}
                  onChange={(e) => handleFileSelect(e, localSession)}
                  accept={serverData?.tipoMime || "*/*"}
                />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => triggerFileSelect(localSession.fingerprint)}
                  disabled={isResuming}
                  className="gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Retomar
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDiscard(localSession.fingerprint)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Selecione o mesmo arquivo original para continuar o envio de onde parou
        </p>
      </CardContent>
    </Card>
  )
}
