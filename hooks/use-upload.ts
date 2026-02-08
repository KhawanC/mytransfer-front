"use client"

import { useState, useCallback, useRef } from "react"
import pLimit from "p-limit"
import { api, getUploadProgress } from "@/lib/api"
import { CHUNK_SIZE_BYTES } from "@/lib/constants"
import { 
  calculateFileFingerprint, 
  calculateFullFileHash, 
  calculateChunkHash, 
  arrayBufferToBase64 
} from "@/lib/fingerprint"
import { 
  saveUploadSession, 
  getUploadSession, 
  removeUploadSession,
  type PersistedUploadSession 
} from "@/lib/upload-storage"
import type { 
  IniciarUploadResponse, 
  ProgressoUploadResponse, 
  StatusArquivo 
} from "@/types"

// Limite de uploads paralelos de chunks
const PARALLEL_CHUNK_LIMIT = 4

export interface UploadItem {
  arquivoId: string
  fingerprint: string
  fileName: string
  fileSize: number
  progress: number
  status: StatusArquivo
  error?: string
  chunksTotal: number
  chunksSent: number
  isResuming?: boolean
}

interface UseUploadReturn {
  uploads: Map<string, UploadItem>
  uploadFile: (file: File, sessaoId: string) => Promise<void>
  resumeUpload: (file: File, sessaoId: string, persistedSession: PersistedUploadSession) => Promise<void>
  isUploading: boolean
  clearUpload: (arquivoId: string) => void
  cancelUpload: (arquivoId: string) => void
}

export function useUpload(): UseUploadReturn {
  const [uploads, setUploads] = useState<Map<string, UploadItem>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const cancelledUploads = useRef<Set<string>>(new Set())

  const updateUpload = useCallback((id: string, update: Partial<UploadItem>) => {
    setUploads((prev) => {
      const next = new Map(prev)
      const existing = next.get(id)
      if (existing) {
        next.set(id, { ...existing, ...update })
      }
      return next
    })
  }, [])

  const clearUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const next = new Map(prev)
      next.delete(id)
      return next
    })
    cancelledUploads.current.delete(id)
  }, [])

  const cancelUpload = useCallback((id: string) => {
    cancelledUploads.current.add(id)
    updateUpload(id, { status: "ERRO", error: "Upload cancelado" })
  }, [updateUpload])

  /**
   * Envia chunks em paralelo usando p-limit para controlar concorrência.
   * Retorna quando todos os chunks forem enviados ou em caso de erro.
   */
  const sendChunksInParallel = useCallback(async (
    arquivoId: string,
    sessaoId: string,
    fileBuffer: ArrayBuffer,
    chunkSize: number,
    totalChunks: number,
    chunksToSend: number[],
    onProgress: (chunksSent: number) => void
  ): Promise<boolean> => {
    const limit = pLimit(PARALLEL_CHUNK_LIMIT)
    let chunksSent = 0
    let hasError = false

    const sendChunk = async (chunkIndex: number): Promise<void> => {
      // Verifica se foi cancelado
      if (cancelledUploads.current.has(arquivoId)) {
        throw new Error("Upload cancelado")
      }

      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, fileBuffer.byteLength)
      const chunkBuffer = fileBuffer.slice(start, end)
      const hashChunk = await calculateChunkHash(chunkBuffer)
      const dadosBase64 = arrayBufferToBase64(chunkBuffer)

      await api<ProgressoUploadResponse>("/api/transferencia/arquivo/chunk", {
        method: "POST",
        body: JSON.stringify({
          arquivoId,
          numeroChunk: chunkIndex,
          hashChunk,
          dadosBase64,
          sessaoId,
        }),
      })

      chunksSent++
      onProgress(chunksSent)
    }

    const promises = chunksToSend.map((chunkIndex) =>
      limit(() => sendChunk(chunkIndex).catch((err) => {
        hasError = true
        throw err
      }))
    )

    try {
      await Promise.all(promises)
      return !hasError
    } catch {
      return false
    }
  }, [])

  /**
   * Função interna para retomar upload.
   * Separada para ser chamada tanto por resumeUpload quanto por uploadFile.
   */
  const resumeUploadInternal = useCallback(
    async (
      file: File, 
      sessaoId: string, 
      persistedSession: PersistedUploadSession,
      fingerprint: string
    ) => {
      const arquivoId = persistedSession.arquivoId

      try {
        // Consulta o progresso no servidor
        const progressoResponse = await getUploadProgress(arquivoId)

        if (!progressoResponse.uploadValido) {
          // Upload não é mais válido, remove do IndexedDB
          await removeUploadSession(fingerprint)
          throw new Error("Upload expirado ou inválido")
        }

        const totalChunks = progressoResponse.totalChunks
        const chunkSize = progressoResponse.chunkSizeBytes
        const chunksRecebidos = new Set(progressoResponse.chunksRecebidos)
        
        // Calcula chunks faltantes
        const chunksToSend: number[] = []
        for (let i = 0; i < totalChunks; i++) {
          if (!chunksRecebidos.has(i)) {
            chunksToSend.push(i)
          }
        }

        const initialProgress = ((totalChunks - chunksToSend.length) / totalChunks) * 100

        // Adiciona ao estado de uploads
        setUploads((prev) => {
          const next = new Map(prev)
          next.set(arquivoId, {
            arquivoId,
            fingerprint,
            fileName: file.name,
            fileSize: file.size,
            progress: initialProgress,
            status: "ENVIANDO",
            chunksTotal: totalChunks,
            chunksSent: totalChunks - chunksToSend.length,
            isResuming: true,
          })
          return next
        })

        if (chunksToSend.length === 0) {
          // Todos os chunks já foram enviados
          updateUpload(arquivoId, { 
            progress: 100, 
            status: "PROCESSANDO",
            chunksSent: totalChunks 
          })
          await removeUploadSession(fingerprint)
          return
        }

        // Lê o arquivo em memória
        const fileBuffer = await file.arrayBuffer()
        const startChunksSent = totalChunks - chunksToSend.length

        // Envia apenas os chunks faltantes em paralelo
        const success = await sendChunksInParallel(
          arquivoId,
          sessaoId,
          fileBuffer,
          chunkSize,
          totalChunks,
          chunksToSend,
          (newChunksSent) => {
            const totalSent = startChunksSent + newChunksSent
            const progress = (totalSent / totalChunks) * 100
            updateUpload(arquivoId, {
              progress,
              chunksSent: totalSent,
              status: totalSent >= totalChunks ? "PROCESSANDO" : "ENVIANDO",
            })
          }
        )

        if (success) {
          updateUpload(arquivoId, { 
            progress: 100, 
            status: "PROCESSANDO",
            chunksSent: totalChunks 
          })
          await removeUploadSession(fingerprint)
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Falha ao retomar upload"
        updateUpload(arquivoId, { status: "ERRO", error: errorMsg })
      }
    },
    [updateUpload, sendChunksInParallel]
  )

  /**
   * Upload de arquivo com suporte a resumable.
   * Calcula fingerprint, persiste sessão no IndexedDB, e envia chunks em paralelo.
   */
  const uploadFile = useCallback(
    async (file: File, sessaoId: string) => {
      setIsUploading(true)
      let fingerprint: string = ""
      let arquivoId: string = ""

      try {
        // Calcula fingerprint primeiro para verificar se já existe sessão
        fingerprint = await calculateFileFingerprint(file)
        
        // Verifica se já existe uma sessão para este arquivo
        const existingSession = await getUploadSession(fingerprint)
        if (existingSession && existingSession.sessaoId === sessaoId) {
          // Tenta retomar o upload existente
          try {
            const progressoResponse = await getUploadProgress(existingSession.arquivoId)
            if (progressoResponse.uploadValido) {
              // Sessão válida, retoma o upload
              await resumeUploadInternal(file, sessaoId, existingSession, fingerprint)
              return
            }
          } catch {
            // Sessão não existe mais no servidor, remove do IndexedDB
            await removeUploadSession(fingerprint)
          }
        }

        const tempId = `temp_${fingerprint}`

        setUploads((prev) => {
          const next = new Map(prev)
          next.set(tempId, {
            arquivoId: tempId,
            fingerprint,
            fileName: file.name,
            fileSize: file.size,
            progress: 0,
            status: "PENDENTE",
            chunksTotal: 0,
            chunksSent: 0,
          })
          return next
        })

        // Calcula hash completo do arquivo
        const hashConteudo = await calculateFullFileHash(file)

        // Inicia o upload no servidor
        const initResponse = await api<IniciarUploadResponse>("/api/transferencia/arquivo/upload", {
          method: "POST",
          body: JSON.stringify({
            nomeArquivo: file.name,
            tamanhoBytes: file.size,
            tipoMime: file.type || "application/octet-stream",
            hashConteudo,
            sessaoId,
          }),
        })

        arquivoId = initResponse.arquivoId

        // Atualiza o ID do upload
        setUploads((prev) => {
          const next = new Map(prev)
          const existing = next.get(tempId)
          next.delete(tempId)
          if (existing) {
            next.set(arquivoId, {
              ...existing,
              arquivoId,
              status: "ENVIANDO",
              chunksTotal: initResponse.totalChunks,
            })
          }
          return next
        })

        // Se arquivo duplicado, já está completo
        if (initResponse.arquivoDuplicado) {
          updateUpload(arquivoId, { 
            progress: 100, 
            status: "PROCESSANDO",
            chunksSent: initResponse.totalChunks 
          })
          setIsUploading(false)
          return
        }

        const totalChunks = initResponse.totalChunks
        const chunkSize = initResponse.chunkSizeBytes || CHUNK_SIZE_BYTES

        // Persiste a sessão no IndexedDB para permitir retomada
        const session: PersistedUploadSession = {
          fingerprint,
          arquivoId,
          sessaoId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          hashConteudo,
          totalChunks,
          chunkSizeBytes: chunkSize,
          createdAt: Date.now(),
          lastUpdatedAt: Date.now(),
        }
        await saveUploadSession(session)

        // Gera lista de todos os chunks para enviar
        const chunksToSend = Array.from({ length: totalChunks }, (_, i) => i)

        // Lê o arquivo em memória
        const fileBuffer = await file.arrayBuffer()

        // Envia chunks em paralelo
        const success = await sendChunksInParallel(
          arquivoId,
          sessaoId,
          fileBuffer,
          chunkSize,
          totalChunks,
          chunksToSend,
          (chunksSent) => {
            const progress = (chunksSent / totalChunks) * 100
            updateUpload(arquivoId, {
              progress,
              chunksSent,
              status: chunksSent >= totalChunks ? "PROCESSANDO" : "ENVIANDO",
            })
          }
        )

        if (success) {
          updateUpload(arquivoId, { 
            progress: 100, 
            status: "PROCESSANDO",
            chunksSent: totalChunks 
          })
          // Remove a sessão do IndexedDB pois o upload foi concluído
          await removeUploadSession(fingerprint)
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed"
        if (arquivoId) {
          updateUpload(arquivoId, { status: "ERRO", error: errorMsg })
        } else if (fingerprint) {
          const tempId = `temp_${fingerprint}`
          updateUpload(tempId, { status: "ERRO", error: errorMsg })
        }
      } finally {
        setIsUploading(false)
      }
    },
    [updateUpload, sendChunksInParallel, resumeUploadInternal],
  )

  /**
   * Retoma um upload a partir de uma sessão persistida.
   * Requer o arquivo original (mesmo conteúdo) e a sessão do IndexedDB.
   */
  const resumeUpload = useCallback(
    async (file: File, sessaoId: string, persistedSession: PersistedUploadSession) => {
      setIsUploading(true)

      try {
        // Verifica se o fingerprint do arquivo corresponde
        const fingerprint = await calculateFileFingerprint(file)
        
        if (fingerprint !== persistedSession.fingerprint) {
          throw new Error("Arquivo diferente do original. Não é possível retomar.")
        }

        await resumeUploadInternal(file, sessaoId, persistedSession, fingerprint)

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Falha ao retomar upload"
        updateUpload(persistedSession.arquivoId, { status: "ERRO", error: errorMsg })
      } finally {
        setIsUploading(false)
      }
    },
    [updateUpload, resumeUploadInternal]
  )

  return { 
    uploads, 
    uploadFile, 
    resumeUpload,
    isUploading, 
    clearUpload,
    cancelUpload 
  }
}
