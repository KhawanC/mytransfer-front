"use client"

import { WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Você está offline</CardTitle>
          <CardDescription>
            Não foi possível conectar à internet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
          <p>
            O MePassa requer conexão com a internet para funcionar. Verifique sua conexão e tente novamente.
          </p>
          <div className="bg-muted rounded-lg p-4">
            <p className="font-medium text-foreground mb-2">Funcionalidades indisponíveis:</p>
            <ul className="text-left space-y-1">
              <li>• Criar novas sessões</li>
              <li>• Transferir arquivos</li>
              <li>• Entrar em sessões</li>
              <li>• Receber notificações em tempo real</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleReload} className="w-full">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
