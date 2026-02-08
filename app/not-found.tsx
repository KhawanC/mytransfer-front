import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-4 text-center">
      <ArrowLeftRight className="h-10 w-10 text-primary" />
      <h1 className="text-2xl font-bold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">Página não encontrada</p>
      <Button asChild>
        <Link href="/dashboard">Voltar ao início</Link>
      </Button>
    </div>
  )
}
