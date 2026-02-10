"use client"

import { useState } from "react"
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
import type { FormatoImagem } from "@/types"

interface ConversionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  formato: FormatoImagem | null
  nomeArquivo: string
}

export function ConversionModal({
  isOpen,
  onClose,
  onConfirm,
  formato,
  nomeArquivo,
}: ConversionModalProps) {
  const [isConverting, setIsConverting] = useState(false)

  const handleConfirm = async () => {
    setIsConverting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Converter arquivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja converter <strong>{nomeArquivo}</strong> para o formato{" "}
            <strong>{formato}</strong>?
            <br />
            <br />
            Isso criará um novo arquivo na sessão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConverting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConverting}
            className="cursor-pointer"
          >
            {isConverting ? "Convertendo..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
