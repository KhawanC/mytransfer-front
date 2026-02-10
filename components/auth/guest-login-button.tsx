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
        const body = await res.json().catch(() => null)
        const message = body && typeof body === "object" && "message" in body
          ? String((body as { message: unknown }).message)
          : "Erro ao entrar como convidado"

        if (res.status === 429) throw new Error("Muitas tentativas, tente novamente")
        throw new Error(message)
      }

      const data = await res.json()
      loginWithTokens(data.accessToken, data.refreshToken)
      toast.success(`Bem-vindo, ${data.user.name}!`)
      router.push("/dashboard")
    } catch (error) {
      console.error("Guest login error:", error)
      const message = error instanceof Error ? error.message : "Erro ao entrar como convidado"
      toast.error(message)
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
