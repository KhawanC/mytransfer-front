"use client"

import { useCallback, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants"
import { formatBytes } from "@/lib/utils"
import { toast } from "sonner"

interface UploadZoneProps {
  onUpload: (files: File[]) => void
  isUploading: boolean
}

export function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndUpload = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return

      const validFiles: File[] = []
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`${file.name} excede o limite de ${formatBytes(MAX_FILE_SIZE_BYTES)}`)
          continue
        }
        if (file.size === 0) {
          toast.error(`${file.name} está vazio`)
          continue
        }
        validFiles.push(file)
      }

      if (validFiles.length > 0) {
        onUpload(validFiles)
      }
    },
    [onUpload],
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    validateAndUpload(e.dataTransfer.files)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    validateAndUpload(e.target.files)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6
        transition-colors cursor-pointer min-h-[120px]
        ${isDragOver ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40 hover:bg-secondary/30"}
        ${isUploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-muted-foreground" />
      )}

      <div className="text-center">
        <p className="text-sm font-medium">
          {isUploading ? "Enviando..." : "Arraste arquivos aqui"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          ou toque para selecionar
        </p>
      </div>
    </div>
  )
}
