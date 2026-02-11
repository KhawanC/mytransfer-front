"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Crown, AlertCircle, LogOut, UserPlus } from "lucide-react"

interface GuestUpgradePromptProps {
  onClose: () => void
}

export function GuestUpgradePrompt({ onClose }: GuestUpgradePromptProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleCreateAccount = useCallback(() => {
    setIsLoggingOut(true)
    logout()
    router.push("/")
  }, [logout, router])

  return (
    <div className="space-y-6 py-4">
      <Alert className="border-amber-500/30 bg-amber-500/5">
        <AlertCircle className="h-5 w-5 text-amber-500" />
        <AlertTitle className="text-lg font-semibold text-amber-600 dark:text-amber-400 mb-2">
          Crie uma Conta para Desbloquear Planos Premium
        </AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground space-y-3">
          <p>
            Como usuário convidado, você tem acesso limitado ao MyTransfer. Para desbloquear todos os recursos e planos premium, você precisa criar uma conta.
          </p>
          <div className="space-y-2 pt-2">
            <p className="font-medium text-foreground/90">Benefícios de criar uma conta:</p>
            <ul className="space-y-1.5 pl-4">
              <li className="flex items-start gap-2">
                <Crown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span>Acesso aos planos Premium com limites maiores</span>
              </li>
              <li className="flex items-start gap-2">
                <UserPlus className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span>Conta permanente que não expira após 1 hora</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Mantenha suas sessões e arquivos salvos</span>
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoggingOut}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreateAccount}
          disabled={isLoggingOut}
          className="w-full sm:w-auto gap-2 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Saindo..." : "Criar Conta"}
        </Button>
      </div>
    </div>
  )
}
