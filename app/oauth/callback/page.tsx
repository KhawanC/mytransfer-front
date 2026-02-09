"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { Suspense } from "react"
import { getAccessToken } from "@/lib/auth"

const OAUTH_PROCESSING_KEY = "mt_oauth_processing"
const OAUTH_PROCESSED_KEY = "mt_oauth_processed"

function OAuthCallbackContent() {
  const { loginWithTokens, isAuthenticated } = useAuth()
  const router = useRouter()
  const hasProcessed = useRef(false)
  const isRedirecting = useRef(false)

  useEffect(() => {
    // Se já está redirecionando, não faz nada
    if (isRedirecting.current) return

    // Prevenir múltiplas execuções
    const isProcessing = sessionStorage.getItem(OAUTH_PROCESSING_KEY)
    const wasProcessed = sessionStorage.getItem(OAUTH_PROCESSED_KEY)
    
    if (hasProcessed.current || isProcessing === "true" || wasProcessed === "true") {
      return
    }
    
    // Verificar se já tem tokens salvos (já foi processado)
    const existingToken = getAccessToken()
    if (existingToken) {
      hasProcessed.current = true
      isRedirecting.current = true
      sessionStorage.removeItem(OAUTH_PROCESSING_KEY)
      sessionStorage.setItem(OAUTH_PROCESSED_KEY, "true")
      router.replace("/dashboard")
      return
    }

    // Marcar como processando
    hasProcessed.current = true
    sessionStorage.setItem(OAUTH_PROCESSING_KEY, "true")

    // Ler os parâmetros diretamente da URL
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get("access_token")
    const refreshToken = urlParams.get("refresh_token")

    if (accessToken && refreshToken) {
      console.log("[OAuth] Processing tokens...")
      
      loginWithTokens(accessToken, refreshToken)
      
      // Aguardar um pouco para os tokens serem salvos e então redirecionar
      const redirectTimer = setTimeout(() => {
        isRedirecting.current = true
        sessionStorage.removeItem(OAUTH_PROCESSING_KEY)
        sessionStorage.setItem(OAUTH_PROCESSED_KEY, "true")
        console.log("[OAuth] Redirecting to dashboard...")
        router.replace("/dashboard")
        
        // Limpar as flags após o redirect
        setTimeout(() => {
          sessionStorage.removeItem(OAUTH_PROCESSED_KEY)
        }, 2000)
      }, 200)

      return () => {
        clearTimeout(redirectTimer)
      }
    } else {
      console.log("[OAuth] No tokens found, redirecting to login...")
      sessionStorage.removeItem(OAUTH_PROCESSING_KEY)
      router.replace("/login")
    }
  }, [loginWithTokens, router])

  // Se já está autenticado, redireciona imediatamente
  useEffect(() => {
    if (isAuthenticated && !isRedirecting.current) {
      isRedirecting.current = true
      sessionStorage.setItem(OAUTH_PROCESSED_KEY, "true")
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

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
