"use client"

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
import { UserCheck, UserX } from "lucide-react"
import type { PendenteEntrada } from "@/types"

interface PendingApprovalAlertProps {
  isOpen: boolean
  pendingUser: PendenteEntrada | null
  pendingCount: number
  onApprove: () => void
  onReject: () => void
}

export function PendingApprovalAlert({
  isOpen,
  pendingUser,
  pendingCount,
  onApprove,
  onReject,
}: PendingApprovalAlertProps) {
  const nomeUsuario = pendingUser?.nomeUsuario ?? ""
  const restante = Math.max(0, pendingCount - 1)

  const open = isOpen && !!pendingUser

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Nova Solicitação de Entrada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            <span className="font-semibold text-foreground">{nomeUsuario}</span> está solicitando entrada
            na sua sessão de transferência.
            {restante > 0 && (
              <span className="block text-sm text-muted-foreground mt-2">
                Outras solicitações pendentes: {restante}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onReject}
            className="cursor-pointer flex items-center gap-2 m-0"
          >
            <UserX className="h-4 w-4" />
            Rejeitar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onApprove}
            className="cursor-pointer flex items-center gap-2 m-0 bg-primary"
          >
            <UserCheck className="h-4 w-4" />
            Aprovar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
