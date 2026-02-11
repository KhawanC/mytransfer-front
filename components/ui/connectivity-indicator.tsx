"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Badge } from "@/components/ui/badge"
import { WifiOff, Wifi } from "lucide-react"

export function ConnectivityIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus()

  if (isOnline && !wasOffline) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center gap-2 px-4 py-2 text-sm shadow-lg"
      >
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            Conectado novamente
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            Você está offline
          </>
        )}
      </Badge>
    </div>
  )
}
