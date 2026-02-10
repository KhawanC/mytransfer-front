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
import type { NivelOtimizacao } from "@/types"

interface OptimizationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  nivel: NivelOtimizacao | null
  nomeArquivo: string
}

export function OptimizationModal({
  isOpen,
  onClose,
  onConfirm,
  nivel,
  nomeArquivo,
}: OptimizationModalProps) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const nivelTexto = nivel ? `${nivel}%` : "--"

  const handleConfirm = async () => {
    setIsOptimizing(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Otimizar arquivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja otimizar <strong>{nomeArquivo}</strong> em <strong>{nivelTexto}</strong>?
            <br />
            <br />
            Isso criará um novo arquivo na sessão.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isOptimizing}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isOptimizing}
            className="cursor-pointer"
          >
            {isOptimizing ? "Otimizando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
