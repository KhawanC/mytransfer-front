"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { cancelSubscription, deleteAccount, getSubscriptionStatus } from "@/lib/api"
import type { AssinaturaStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface AccountSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountSettings({ open, onOpenChange }: AccountSettingsProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<AssinaturaStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    getSubscriptionStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setIsLoading(false))
  }, [open])

  const canCancel = status?.status === "ATIVA" && !status?.cancelarAoFinalPeriodo

  async function handleCancel() {
    setIsCanceling(true)
    try {
      const data = await cancelSubscription()
      setStatus(data)
      toast.success("Cancelamento solicitado")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao cancelar assinatura"
      toast.error(message)
    } finally {
      setIsCanceling(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      await deleteAccount()
      logout()
      router.replace("/login")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir conta"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuracoes da conta</DialogTitle>
          <DialogDescription>
            Gerencie sua assinatura e dados pessoais.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Assinatura</span>
              {status?.status && (
                <Badge variant="outline" className="text-[11px]">
                  {status.status}
                </Badge>
              )}
            </div>
            {status?.planoNome && (
              <p className="text-sm text-muted-foreground">Plano: {status.planoNome}</p>
            )}
            {status?.periodoFim && (
              <p className="text-xs text-muted-foreground">
                Vencimento: {new Date(status.periodoFim).toLocaleDateString("pt-BR")}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleCancel}
              disabled={!canCancel || isCanceling || isLoading}
            >
              {isCanceling ? "Cancelando..." : "Cancelar assinatura"}
            </Button>
          </div>

          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 space-y-3">
            <div className="text-sm font-medium text-destructive">Excluir conta</div>
            <p className="text-xs text-muted-foreground">
              Esta acao remove seus dados e sessoes criadas. Nao pode ser desfeita.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full cursor-pointer">
                  Excluir conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusao?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sua conta sera removida permanentemente, incluindo sessoes e arquivos associados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full cursor-pointer" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
