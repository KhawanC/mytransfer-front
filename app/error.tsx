"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <ArrowLeftRight className="h-10 w-10 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente.
      </p>
      <Button onClick={reset} className="cursor-pointer">
        Tentar novamente
      </Button>
    </div>
  )
}
