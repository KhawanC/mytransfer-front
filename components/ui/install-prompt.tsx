"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const INSTALL_PROMPT_DISMISSED_KEY = "pwa-install-dismissed"
const INSTALL_PROMPT_DISMISSED_COUNT_KEY = "pwa-install-dismissed-count"
const MAX_DISMISSALS = 3

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const isDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY)
    const dismissCount = parseInt(localStorage.getItem(INSTALL_PROMPT_DISMISSED_COUNT_KEY) || "0", 10)

    if (isDismissed === "true" && dismissCount >= MAX_DISMISSALS) {
      return
    }

    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isInStandaloneMode = (window.navigator as any).standalone === true || isStandalone

    if (isInStandaloneMode) {
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("PWA instalado com sucesso")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    const currentCount = parseInt(localStorage.getItem(INSTALL_PROMPT_DISMISSED_COUNT_KEY) || "0", 10)
    const newCount = currentCount + 1

    localStorage.setItem(INSTALL_PROMPT_DISMISSED_COUNT_KEY, newCount.toString())

    if (newCount >= MAX_DISMISSALS) {
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true")
    }

    setShowPrompt(false)
  }

  if (!showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4">
      <Card className="p-4 shadow-lg border-2">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Instalar MePassa</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Instale o app para acesso rápido e melhor experiência
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleInstall} className="flex-1">
                Instalar
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
