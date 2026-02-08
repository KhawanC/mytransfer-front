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

interface PendingApprovalAlertProps {
  isOpen: boolean
  userName: string
  onApprove: () => void
  onReject: () => void
}

export function PendingApprovalAlert({
  isOpen,
  userName,
  onApprove,
  onReject,
}: PendingApprovalAlertProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Nova Solicitação de Entrada
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base pt-2">
            <span className="font-semibold text-foreground">{userName}</span> está solicitando entrada
            na sua sessão de transferência.
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
