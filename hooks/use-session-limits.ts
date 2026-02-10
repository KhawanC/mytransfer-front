"use client"

import { useState, useEffect, useCallback } from "react"
import { getSessaoEstatisticas } from "@/lib/api"
import { useWebSocket } from "./use-websocket"
import type { SessaoEstatisticas, TipoNotificacao, NotificacaoResponse } from "@/types"

const CACHE_DURATION_MS = 5 * 60 * 1000

interface CacheEntry {
  data: SessaoEstatisticas
  timestamp: number
}

const cache: Record<string, CacheEntry> = {}

export function useSessionLimits(sessaoId: string) {
  const [limites, setLimites] = useState<SessaoEstatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { subscribe } = useWebSocket()

  const fetchLimites = useCallback(async (force = false) => {
    if (!sessaoId) return

    const now = Date.now()
    const cached = cache[sessaoId]

    if (!force && cached && now - cached.timestamp < CACHE_DURATION_MS) {
      setLimites(cached.data)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getSessaoEstatisticas(sessaoId)
      cache[sessaoId] = { data, timestamp: now }
      setLimites(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao carregar limites"))
    } finally {
      setLoading(false)
    }
  }, [sessaoId])

  const revalidate = useCallback(() => {
    fetchLimites(true)
  }, [fetchLimites])

  useEffect(() => {
    fetchLimites()
  }, [fetchLimites])

  useEffect(() => {
    if (!sessaoId) return

    const invalidationTypes: TipoNotificacao[] = [
      "ARQUIVO_DISPONIVEL",
      "ARQUIVO_CONVERTIDO",
      "ARQUIVO_BLOQUEADO",
      "UPLOAD_COMPLETO"
    ]

    const unsubscribe = subscribe(`/topic/sessao/${sessaoId}`, (body) => {
      const notification = body as NotificacaoResponse
      if (invalidationTypes.includes(notification.tipo)) {
        revalidate()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [sessaoId, subscribe, revalidate])

  const espacoDisponivel = limites?.espacoDisponivel ?? 0

  const verificarEspacoParaConversao = useCallback(() => {
    return espacoDisponivel > 0
  }, [espacoDisponivel])

  return {
    limites,
    loading,
    error,
    espacoDisponivel,
    revalidate,
    verificarEspacoParaConversao,
  }
}
