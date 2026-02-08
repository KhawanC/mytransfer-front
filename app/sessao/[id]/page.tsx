"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { api } from "@/lib/api"
import { useWebSocket } from "@/hooks/use-websocket"
import { useUpload } from "@/hooks/use-upload"
import { useUploadRecovery } from "@/hooks/use-upload-recovery"
import type { Sessao, Arquivo, NotificacaoResponse, ProgressoUploadResponse } from "@/types"
import type { PersistedUploadSession } from "@/lib/upload-storage"
import { SessionHeader } from "@/components/session/session-header"
import { UploadZone } from "@/components/session/upload-zone"
import { FileList } from "@/components/session/file-list"
import { PendingApprovalAlert } from "@/components/session/pending-approval-alert"
import { RecoverableUploads } from "@/components/session/recoverable-uploads"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const router = useRouter()

  const [session, setSession] = useState<Sessao | null>(null)
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showApprovalAlert, setShowApprovalAlert] = useState(false)
  const [pendingUserName, setPendingUserName] = useState<string>("")

  const { isConnected, subscribe, send } = useWebSocket()
  const { uploads, uploadFile, resumeUpload, isUploading, clearUpload, cancelUpload } = useUpload()
  const { 
    recoverableUploads, 
    isLoading: isLoadingRecovery, 
    discardUpload, 
    discardAll: discardAllRecoverable,
    refreshRecoverable 
  } = useUploadRecovery(id)

  const fetchSession = useCallback(async () => {
    try {
      const [sessao, files] = await Promise.all([
        api<Sessao>(`/api/transferencia/sessao/${id}`),
        api<Arquivo[]>(`/api/transferencia/sessao/${id}/arquivos`),
      ])
      setSession(sessao)
      
      // Mescla arquivos do backend com os temporários locais, removendo duplicatas
      setArquivos((prev) => {
        const tempFiles = prev.filter(a => a.id.startsWith('temp_'))
        const backendFileIds = new Set(files.map(f => f.id))
        
        // Remove temporários se o arquivo real já chegou do backend
        const validTempFiles = tempFiles.filter(tf => 
          !files.some(f => f.nomeOriginal === tf.nomeOriginal)
        )
        
        // Mescla: mantém temporários que ainda não têm correspondente + adiciona todos do backend
        const merged = [...validTempFiles, ...files]
        
        // Remove duplicatas baseado em ID
        const uniqueMap = new Map(merged.map(f => [f.id, f]))
        return Array.from(uniqueMap.values())
      })
      
      // Se o usuário é o criador e há um usuário aguardando aprovação, mostra o dialog
      if (sessao.usuarioCriadorId === user?.id && 
          sessao.status === "AGUARDANDO_APROVACAO" && 
          sessao.nomeUsuarioConvidadoPendente) {
        setPendingUserName(sessao.nomeUsuarioConvidadoPendente)
        setShowApprovalAlert(true)
      }
    } catch {
      toast.error("Sessão não encontrada")
      router.replace("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }, [id, router, user?.id])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleApprove = useCallback(() => {
    if (!session) return
    send("/app/sessao/aprovar", { sessaoId: session.id })
    setShowApprovalAlert(false)
    toast.success("Entrada aprovada!")
  }, [session, send])

  const handleReject = useCallback(() => {
    if (!session) return
    send("/app/sessao/rejeitar", { sessaoId: session.id })
    setShowApprovalAlert(false)
    toast.info("Entrada rejeitada")
  }, [session, send])

  useEffect(() => {
    if (!isConnected || !session) return

    const unsubNotif = subscribe(`/topic/sessao/${id}`, (data) => {
      const notif = data as NotificacaoResponse
      switch (notif.tipo) {
        case "SOLICITACAO_ENTRADA": {
          const dados = notif.dados as { usuarioConvidadoPendenteId: string; nomeUsuario: string }
          setPendingUserName(dados.nomeUsuario)
          setShowApprovalAlert(true)
          toast.info(notif.mensagem)
          fetchSession()
          break
        }
        case "ENTRADA_APROVADA":
          toast.success("Entrada aprovada!")
          fetchSession()
          break
        case "ENTRADA_REJEITADA":
          toast.error("Sua entrada foi rejeitada")
          if (session.usuarioCriadorId !== user?.id) {
            setTimeout(() => router.push("/dashboard"), 2000)
          }
          fetchSession()
          break
        case "USUARIO_ENTROU":
          toast.info("Um usuário entrou na sessão")
          fetchSession()
          break
        case "SESSAO_ENCERRADA":
          toast.info("Sessão encerrada")
          setSession((prev) => (prev ? { ...prev, status: "ENCERRADA" } : prev))
          break
        case "SESSAO_EXPIRADA":
          toast.warning("Sessão expirada")
          setSession((prev) => (prev ? { ...prev, status: "EXPIRADA" } : prev))
          break
        case "UPLOAD_INICIADO":
          fetchSession()
          break
        case "UPLOAD_COMPLETO":
          // Não faz nada aqui, espera ARQUIVO_DISPONIVEL
          break
        case "ARQUIVO_DISPONIVEL":
          // Atualiza o arquivo para COMPLETO quando realmente disponível
          const dados = notif.dados as { arquivoId: string; nomeArquivo: string; urlDownload: string }
          setArquivos((prev) =>
            prev.map((arq) =>
              arq.id === dados.arquivoId
                ? { ...arq, status: "COMPLETO", progressoUpload: 100 }
                : arq,
            ),
          )
          clearUpload(dados.arquivoId)
          toast.success(`${dados.nomeArquivo} disponível para download`)
          break
      }
    })

    const unsubProgresso = subscribe(`/topic/sessao/${id}/progresso`, (data) => {
      const progresso = data as ProgressoUploadResponse
      setArquivos((prev) =>
        prev.map((arq) =>
          arq.id === progresso.arquivoId
            ? {
                ...arq,
                progressoUpload: progresso.progressoPorcentagem,
                chunksRecebidos: progresso.chunkAtual,
                status: progresso.completo ? "PROCESSANDO" : "ENVIANDO",
              }
            : arq,
        ),
      )
      
      // Quando completo, apenas limpa o estado local
      // O status COMPLETO será definido pela notificação ARQUIVO_DISPONIVEL
      if (progresso.completo) {
        clearUpload(progresso.arquivoId)
      }
    })

    return () => {
      unsubNotif()
      unsubProgresso()
    }
  }, [isConnected, session, id, subscribe, fetchSession, user, router, send, handleApprove, handleReject, clearUpload])

  async function handleUpload(files: File[]) {
    if (!session) return
    for (const file of files) {
      // Adiciona arquivo à lista localmente antes mesmo do upload completar
      const tempArquivo: Arquivo = {
        id: `temp_${Date.now()}_${file.name}`,
        sessaoId: session.id,
        nomeOriginal: file.name,
        tamanhoBytes: file.size,
        tipoMime: file.type || "application/octet-stream",
        status: "PENDENTE",
        remetenteId: user?.id ?? "",
        progressoUpload: 0,
        totalChunks: 0,
        chunksRecebidos: 0,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      }
      
      setArquivos((prev) => [...prev, tempArquivo])
      
      await uploadFile(file, session.id)
    }
    // Atualiza lista com dados reais do servidor
    fetchSession()
  }

  async function handleDelete(arquivoId: string) {
    try {
      await api(`/api/transferencia/arquivo/${arquivoId}`, { method: "DELETE" })
      setArquivos((prev) => prev.filter((a) => a.id !== arquivoId))
      toast.success("Arquivo removido")
    } catch {
      toast.error("Erro ao remover arquivo")
    }
  }

  async function handleDownload(arquivoId: string) {
    try {
      const { urlDownload } = await api<{ arquivoId: string; urlDownload: string }>(
        `/api/transferencia/arquivo/${arquivoId}/download`,
      )
      
      // Buscar informações do arquivo para pegar o nome
      const arquivo = arquivos.find(a => a.id === arquivoId)
      const nomeArquivo = arquivo?.nomeOriginal || "download"
      
      // Download via fetch para ter controle total e evitar problemas de CORS
      const response = await fetch(urlDownload)
      
      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo")
      }
      
      // Criar blob a partir da resposta
      const blob = await response.blob()
      
      // Criar URL temporário do blob e forçar download
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = nomeArquivo
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      
      // Limpar
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      toast.success("Download concluído")
    } catch (error) {
      console.error("Erro no download:", error)
      toast.error("Erro ao baixar arquivo")
    }
  }

  async function handleEndSession() {
    if (!session) return
    try {
      await api(`/api/transferencia/sessao/${session.id}`, { method: "DELETE" })
      toast.success("Sessão encerrada")
      router.replace("/dashboard")
    } catch {
      toast.error("Erro ao encerrar sessão")
    }
  }

  async function handleResumeUpload(file: File, persistedSession: PersistedUploadSession) {
    if (!session) return
    
    try {
      await resumeUpload(file, session.id, persistedSession)
      toast.success("Upload retomado!")
      // Atualiza lista após iniciar retomada
      setTimeout(() => {
        fetchSession()
        refreshRecoverable()
      }, 500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao retomar upload")
    }
  }

  async function handleDiscardUpload(fingerprint: string) {
    await discardUpload(fingerprint)
    toast.info("Upload descartado")
  }

  async function handleDiscardAll() {
    await discardAllRecoverable()
    toast.info("Todos os uploads foram descartados")
  }

  async function handleCancelUpload(arquivoId: string) {
    cancelUpload(arquivoId)
    // Remove da lista local após pequeno delay
    setTimeout(() => {
      setArquivos((prev) => prev.filter((a) => a.id !== arquivoId))
    }, 500)
    toast.info("Upload cancelado")
  }

  if (isLoading) {
    return (
      <div className="min-h-dvh p-4 space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!session) return null

  const isCreator = session.usuarioCriadorId === user?.id
  const isPendingGuest = session.usuarioConvidadoPendenteId === user?.id
  const isWaitingApproval = session.status === "AGUARDANDO_APROVACAO" && isPendingGuest

  const canUpload =
    session.status === "ATIVA" && !isUploading

  const mergedArquivos = arquivos.map((arq) => {
    const upload = uploads.get(arq.id)
    // Só usa o status local se o arquivo não estiver COMPLETO no backend
    // Prioriza sempre o status do backend quando for COMPLETO
    if (upload && arq.status !== "COMPLETO") {
      return {
        ...arq,
        progressoUpload: upload.progress,
        status: upload.status,
      }
    }
    return arq
  })

  return (
    <div className="min-h-dvh flex flex-col">
      <PendingApprovalAlert
        isOpen={showApprovalAlert}
        userName={pendingUserName}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      
      <SessionHeader
        session={session}
        isCreator={isCreator}
        onEndSession={handleEndSession}
        isConnected={isConnected}
      />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-4 space-y-4">
        {isWaitingApproval && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-lg">⏳</span>
              </div>
              <p className="text-sm font-medium text-blue-400">
                Aguardando aprovação do criador da sessão
              </p>
              <p className="text-xs text-muted-foreground">
                Você poderá transferir arquivos assim que sua entrada for aprovada
              </p>
            </div>
          </div>
        )}

        {/* Uploads retomáveis - mostra apenas se tiver sessão ativa e não estiver aguardando aprovação */}
        {!isWaitingApproval && !isLoadingRecovery && recoverableUploads.length > 0 && (
          <RecoverableUploads
            uploads={recoverableUploads}
            onResume={handleResumeUpload}
            onDiscard={handleDiscardUpload}
            onDiscardAll={handleDiscardAll}
            isResuming={isUploading}
          />
        )}

        {canUpload && <UploadZone onUpload={handleUpload} isUploading={isUploading} />}

        <FileList
          arquivos={mergedArquivos}
          currentUserId={user?.id ?? ""}
          currentUserName={user?.name}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onCancel={handleCancelUpload}
          sessionStatus={session.status}
        />
      </main>
    </div>
  )
}
