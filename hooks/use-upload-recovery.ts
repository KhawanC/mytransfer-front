"use client"

import { useState, useEffect, useCallback } from "react"
import { getPendingUploads } from "@/lib/api"
import { 
  getPendingSessionsBySessaoId, 
  removeUploadSession,
  cleanupOldSessions,
  type PersistedUploadSession 
} from "@/lib/upload-storage"
import type { UploadPendenteResponse } from "@/types"

export interface RecoverableUpload {
  // Dados do IndexedDB (cliente)
  localSession: PersistedUploadSession
  // Dados do servidor (se disponível)
  serverData?: UploadPendenteResponse
  // Indica se o upload ainda é válido no servidor
  isValidOnServer: boolean
  // Progresso calculado
  progressoPorcentagem: number
  // Chunks faltantes
  chunksFaltantes: number
}

interface UseUploadRecoveryReturn {
  recoverableUploads: RecoverableUpload[]
  isLoading: boolean
  error: string | null
  refreshRecoverable: () => Promise<void>
  discardUpload: (fingerprint: string) => Promise<void>
  discardAll: () => Promise<void>
}

/**
 * Hook para detectar e gerenciar uploads que podem ser retomados.
 * Combina dados do IndexedDB (cliente) com dados do servidor para
 * determinar quais uploads são recuperáveis.
 */
export function useUploadRecovery(sessaoId: string): UseUploadRecoveryReturn {
  const [recoverableUploads, setRecoverableUploads] = useState<RecoverableUpload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshRecoverable = useCallback(async () => {
    if (!sessaoId) {
      setRecoverableUploads([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Limpa sessões antigas (mais de 24h)
      await cleanupOldSessions()

      // Busca sessões locais do IndexedDB
      const localSessions = await getPendingSessionsBySessaoId(sessaoId)

      if (localSessions.length === 0) {
        setRecoverableUploads([])
        setIsLoading(false)
        return
      }

      // Busca uploads pendentes do servidor
      let serverPendingUploads: UploadPendenteResponse[] = []
      try {
        serverPendingUploads = await getPendingUploads(sessaoId)
      } catch {
        // Se falhar ao consultar o servidor, ainda tenta usar dados locais
        console.warn("Falha ao consultar uploads pendentes do servidor")
      }

      // Mapeia uploads do servidor por arquivoId
      const serverUploadsMap = new Map<string, UploadPendenteResponse>(
        serverPendingUploads.map(u => [u.arquivoId, u])
      )

      // Combina dados locais com servidor
      const recoverable: RecoverableUpload[] = []

      for (const localSession of localSessions) {
        const serverData = serverUploadsMap.get(localSession.arquivoId)
        
        // Verifica se ainda é válido no servidor
        const isValidOnServer = serverData !== undefined

        if (isValidOnServer && serverData) {
          const chunksFaltantes = serverData.totalChunks - serverData.chunksRecebidos.length
          
          recoverable.push({
            localSession,
            serverData,
            isValidOnServer: true,
            progressoPorcentagem: serverData.progressoPorcentagem,
            chunksFaltantes,
          })
        } else {
          // Upload não existe mais no servidor
          // Remove do IndexedDB para limpar
          await removeUploadSession(localSession.fingerprint)
        }
      }

      setRecoverableUploads(recoverable)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao verificar uploads recuperáveis"
      setError(errorMsg)
      console.error("Erro em useUploadRecovery:", err)
    } finally {
      setIsLoading(false)
    }
  }, [sessaoId])

  // Carrega uploads recuperáveis ao montar
  useEffect(() => {
    refreshRecoverable()
  }, [refreshRecoverable])

  /**
   * Descarta um upload específico (remove do IndexedDB).
   */
  const discardUpload = useCallback(async (fingerprint: string) => {
    try {
      await removeUploadSession(fingerprint)
      setRecoverableUploads(prev => 
        prev.filter(u => u.localSession.fingerprint !== fingerprint)
      )
    } catch (err) {
      console.error("Erro ao descartar upload:", err)
    }
  }, [])

  /**
   * Descarta todos os uploads recuperáveis.
   */
  const discardAll = useCallback(async () => {
    try {
      for (const upload of recoverableUploads) {
        await removeUploadSession(upload.localSession.fingerprint)
      }
      setRecoverableUploads([])
    } catch (err) {
      console.error("Erro ao descartar uploads:", err)
    }
  }, [recoverableUploads])

  return {
    recoverableUploads,
    isLoading,
    error,
    refreshRecoverable,
    discardUpload,
    discardAll,
  }
}
