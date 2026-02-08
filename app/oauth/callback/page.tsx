"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Suspense } from "react"

function OAuthCallbackContent() {
  const { loginWithTokens } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    if (accessToken && refreshToken) {
      loginWithTokens(accessToken, refreshToken)
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [searchParams, loginWithTokens, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Autenticando...</p>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  )
}
