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
  localSession: PersistedUploadSession
  serverData?: UploadPendenteResponse
  isValidOnServer: boolean
  progressoPorcentagem: number
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
      await cleanupOldSessions()

      const localSessions = await getPendingSessionsBySessaoId(sessaoId)

      if (localSessions.length === 0) {
        setRecoverableUploads([])
        setIsLoading(false)
        return
      }

      let serverPendingUploads: UploadPendenteResponse[] = []
      try {
        serverPendingUploads = await getPendingUploads(sessaoId)
      } catch {
        console.warn("Falha ao consultar uploads pendentes do servidor")
      }

      const serverUploadsMap = new Map<string, UploadPendenteResponse>(
        serverPendingUploads.map(u => [u.arquivoId, u])
      )

      const recoverable: RecoverableUpload[] = []

      for (const localSession of localSessions) {
        const serverData = serverUploadsMap.get(localSession.arquivoId)
        
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

  useEffect(() => {
    refreshRecoverable()
  }, [refreshRecoverable])

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
