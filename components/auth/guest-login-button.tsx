"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserRound } from "lucide-react"
import { loginAsGuest } from "@/lib/auth"
import { toast } from "sonner"

export function GuestLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGuestLogin = async () => {
    setIsLoading(true)
    try {
      const user = await loginAsGuest()
      if (user) {
        toast.success(`Bem-vindo, ${user.name}!`)
        router.push("/dashboard")
        router.refresh()
      } else {
        toast.error("Falha ao entrar como convidado")
      }
    } catch (error) {
      console.error("Guest login error:", error)
      toast.error("Erro ao entrar como convidado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      onClick={handleGuestLogin}
      disabled={isLoading}
    >
      <UserRound className="mr-2 h-4 w-4" />
      {isLoading ? "Entrando..." : "Continuar como Convidado"}
    </Button>
  )
}
