import { API_URL } from "./constants"
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "./auth"
import type { AuthResponse } from "@/types"

function dispatchLogoutEvent(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("mt:logout"))
}

function logoutAndRedirectToLogin(): void {
  clearTokens()
  dispatchLogoutEvent()
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}

async function readErrorBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return res.json().catch(() => null)
  }

  const text = await res.text().catch(() => "")
  return text || null
}

function extractErrorMessage(status: number, statusText: string, body: unknown): string {
  if (body && typeof body === "object") {
    const maybeMessage = (body as { message?: unknown }).message
    if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) return maybeMessage

    const maybeError = (body as { error?: unknown }).error
    if (typeof maybeError === "string" && maybeError.trim().length > 0) return maybeError
  }

  if (typeof body === "string" && body.trim().length > 0) return body

  if (status === 0) return "Não foi possível conectar ao servidor"
  if (status === 401) return "Sessão expirada"

  const fallback = `${status} ${statusText}`.trim()
  return fallback.length > 0 ? fallback : "Erro inesperado"
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(extractErrorMessage(status, statusText, body))
    this.name = "ApiError"
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearTokens()
    dispatchLogoutEvent()
    return null
  }

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) {
      clearTokens()
      dispatchLogoutEvent()
      return null
    }

    const data: AuthResponse = await res.json()
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clearTokens()
    dispatchLogoutEvent()
    return null
  }
}

export async function api<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let accessToken = getAccessToken()

  if (accessToken && isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken()
    if (!accessToken) {
      logoutAndRedirectToLogin()
      throw new ApiError(401, "Session expired")
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  let res: Response

  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : String(err)
    throw new ApiError(0, "Network Error", { message: rawMessage })
  }

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      try {
        res = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        })
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : String(err)
        throw new ApiError(0, "Network Error", { message: rawMessage })
      }
    } else {
      logoutAndRedirectToLogin()
      throw new ApiError(401, "Session expired")
    }
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const body = await readErrorBody(res)

    if (res.status === 401) {
      logoutAndRedirectToLogin()
    }

    throw new ApiError(res.status, res.statusText, body)
  }

  return res.json()
}

export async function deleteSession(sessionId: string): Promise<void> {
  return api(`/api/transferencia/sessao/${sessionId}`, { method: "DELETE" })
}

/**
 * Obtém o progresso detalhado de um upload, incluindo a lista de chunks já recebidos.
 * Usado para implementar upload resumable (retomável).
 */
export async function getUploadProgress(arquivoId: string): Promise<import("@/types").ProgressoDetalhadoResponse> {
  return api(`/api/transferencia/arquivo/${arquivoId}/progresso`)
}

/**
 * Obtém a lista de uploads pendentes (incompletos) de uma sessão.
 * Usado para permitir retomada de uploads após refresh da página.
 */
export async function getPendingUploads(sessaoId: string): Promise<import("@/types").UploadPendenteResponse[]> {
  return api(`/api/transferencia/sessao/${sessaoId}/uploads-pendentes`)
}

/**
 * Obtém os limites da sessão baseado no tipo do usuário criador.
 */
export async function fetchSessionLimits(sessaoId: string): Promise<import("@/types").SessaoLimites> {
  return api(`/api/transferencia/sessao/${sessaoId}/limites`)
}

/**
 * Obtém as estatísticas da sessão (quantidade de arquivos, espaço disponível, etc).
 */
export async function getSessaoEstatisticas(sessaoId: string): Promise<import("@/types").SessaoEstatisticas> {
  return api(`/api/transferencia/sessao/${sessaoId}/estatisticas`)
}

/**
 * Obtém os formatos disponíveis para conversão de um arquivo.
 */
export async function getFormatosDisponiveis(arquivoId: string): Promise<import("@/types").FormatoConversao[]> {
  return api(`/api/transferencia/arquivo/${arquivoId}/formatos-disponiveis`)
}

/**
 * Solicita a conversão de um arquivo para um novo formato.
 */
export async function converterArquivo(arquivoId: string, formato: import("@/types").FormatoConversao): Promise<{ message: string }> {
  return api(`/api/transferencia/arquivo/${arquivoId}/converter`, {
    method: "POST",
    body: JSON.stringify({ formato }),
  })
}

export async function getNiveisOtimizacao(arquivoId: string): Promise<import("@/types").NivelOtimizacao[]> {
  return api(`/api/transferencia/arquivo/${arquivoId}/otimizacoes-disponiveis`)
}

export async function otimizarArquivo(arquivoId: string, nivel: import("@/types").NivelOtimizacao): Promise<{ message: string }> {
  return api(`/api/transferencia/arquivo/${arquivoId}/otimizar`, {
    method: "POST",
    body: JSON.stringify({ nivel }),
  })
}

/**
 * Exclui um arquivo com erro ou pendente.
 */
export async function deleteFile(arquivoId: string): Promise<void> {
  return api(`/api/transferencia/arquivo/${arquivoId}`, { method: "DELETE" })
}

export async function getChatHistory(sessaoId: string): Promise<import("@/types").ChatHistorico> {
  return api(`/api/transferencia/sessao/${sessaoId}/chat/historico`)
}

export async function markChatAsRead(sessaoId: string): Promise<void> {
  return api(`/api/transferencia/sessao/${sessaoId}/chat/leitura`, { method: "POST" })
}

export { ApiError }
