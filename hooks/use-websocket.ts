"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Client } from "@stomp/stompjs"
import { clearTokens, getAccessToken, isTokenExpired } from "@/lib/auth"
import { refreshAccessToken } from "@/lib/api"
import { WS_URL } from "@/lib/constants"

interface UseWebSocketReturn {
  isConnected: boolean
  subscribe: (destination: string, callback: (body: unknown) => void) => () => void
  send: (destination: string, body: unknown) => void
  disconnect: () => void
}

export function useWebSocket(autoConnect = true): UseWebSocketReturn {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map())

  const connect = useCallback(() => {
    if (clientRef.current?.connected) return

    const dispatchLogout = () => {
      if (typeof window === "undefined") return
      window.dispatchEvent(new Event("mt:logout"))
    }

    const client = new Client({
      beforeConnect: async () => {
        let token = getAccessToken()
        if (!token) {
          clearTokens()
          dispatchLogout()
          throw new Error("Sessão expirada")
        }

        if (isTokenExpired(token)) {
          token = await refreshAccessToken()
          if (!token) {
            clearTokens()
            dispatchLogout()
            throw new Error("Sessão expirada")
          }
        }

        client.connectHeaders = {
          Authorization: `Bearer ${token}`,
        }
      },
      webSocketFactory: () => {
        const token = getAccessToken()
        if (!token) throw new Error("Sessão expirada")
        return new WebSocket(WS_URL.replace(/^http/, "ws"))
      },
      connectHeaders: {},
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true)
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"])
        setIsConnected(false)
      },
      onWebSocketClose: () => {
        setIsConnected(false)
        const token = getAccessToken()
        if (!token || isTokenExpired(token)) {
          clearTokens()
          dispatchLogout()
        }
      },
    })

    clientRef.current = client
    client.activate()
  }, [])

  useEffect(() => {
    if (autoConnect) connect()
    return () => {
      subscriptionsRef.current.forEach((unsub) => unsub())
      subscriptionsRef.current.clear()
      clientRef.current?.deactivate()
    }
  }, [autoConnect, connect])

  const subscribe = useCallback(
    (destination: string, callback: (body: unknown) => void) => {
      const doSubscribe = () => {
        if (!clientRef.current?.connected) return () => {}

        const sub = clientRef.current.subscribe(destination, (message) => {
          try {
            callback(JSON.parse(message.body))
          } catch {
            callback(message.body)
          }
        })

        const unsub = () => sub.unsubscribe()
        subscriptionsRef.current.set(destination, unsub)
        return unsub
      }

      if (clientRef.current?.connected) {
        return doSubscribe()
      }

      const original = clientRef.current?.onConnect
      if (clientRef.current) {
        clientRef.current.onConnect = (frame) => {
          original?.(frame)
          doSubscribe()
        }
      }

      return () => {
        const unsub = subscriptionsRef.current.get(destination)
        unsub?.()
        subscriptionsRef.current.delete(destination)
      }
    },
    [],
  )

  const send = useCallback((destination: string, body: unknown) => {
    if (!clientRef.current?.connected) {
      console.warn("WebSocket not connected, cannot send to", destination)
      return
    }
    clientRef.current.publish({
      destination,
      body: JSON.stringify(body),
    })
  }, [])

  const disconnect = useCallback(() => {
    subscriptionsRef.current.forEach((unsub) => unsub())
    subscriptionsRef.current.clear()
    clientRef.current?.deactivate()
    setIsConnected(false)
  }, [])

  return { isConnected, subscribe, send, disconnect }
}
