"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserRound } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/providers/auth-provider"

export function GuestLoginButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { loginWithTokens } = useAuth()

  const handleGuestLogin = async () => {
    setIsLoading(true)
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
      const res = await fetch(`${API_URL}/api/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        throw new Error("Failed to create guest user")
      }

      const data = await res.json()
      loginWithTokens(data.accessToken, data.refreshToken)
      toast.success(`Bem-vindo, ${data.user.name}!`)
      router.push("/dashboard")
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
