import { API_URL } from "./constants"
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "./auth"
import type { AuthResponse } from "@/types"

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(`${status} ${statusText}`)
    this.name = "ApiError"
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken || isTokenExpired(refreshToken)) {
    clearTokens()
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
      return null
    }

    const data: AuthResponse = await res.json()
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clearTokens()
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
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
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

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      })
    } else {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new ApiError(401, "Session expired")
    }
  }

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const body = await res.json().catch(() => null)
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

export { ApiError }
