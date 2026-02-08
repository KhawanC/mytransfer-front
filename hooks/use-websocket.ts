"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Client } from "@stomp/stompjs"
import { getAccessToken } from "@/lib/auth"
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

    const token = getAccessToken()
    if (!token) return

    const wsUrl = `${WS_URL}?token=${encodeURIComponent(token)}`

    const client = new Client({
      brokerURL: wsUrl.replace(/^http/, "ws"),
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
