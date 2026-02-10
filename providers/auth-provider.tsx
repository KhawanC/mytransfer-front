"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import type { User, AuthResponse } from "@/types"
import { api, ApiError, refreshAccessToken } from "@/lib/api"
import { getAccessToken, setTokens, clearTokens, isTokenExpired, isTokenExpiringSoon, getUserFromToken } from "@/lib/auth"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isFetchingRef = useRef(false)

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    let token = getAccessToken()
    
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken()
      if (!token) {
        setUser(null)
        setIsLoading(false)
        isFetchingRef.current = false
        return
      }
    }

    if (!token) {
      setUser(null)
      setIsLoading(false)
      isFetchingRef.current = false
      return
    }

    try {
      const userInfo = await api<User>("/api/auth/me")
      setUser(userInfo)
    } catch {
      const localUser = getUserFromToken(token)
      if (localUser) {
        setUser(localUser)
      } else {
        clearTokens()
        setUser(null)
      }
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      const token = getAccessToken()

      if (!token) {
        if (user) logout()
        return
      }

      if (isTokenExpired(token)) {
        const refreshed = await refreshAccessToken()
        if (!refreshed) logout()
        return
      }

      if (isTokenExpiringSoon(token, 300)) {
        const refreshed = await refreshAccessToken()
        if (!refreshed) logout()
      }
    }

    const initialDelay = setTimeout(() => {
      checkAndRefreshToken()
      refreshIntervalRef.current = setInterval(checkAndRefreshToken, 120000)
    }, 30000)

    return () => {
      clearTimeout(initialDelay)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [logout, user])

  useEffect(() => {
    const handler = () => logout()
    window.addEventListener("mt:logout", handler)
    return () => window.removeEventListener("mt:logout", handler)
  }, [logout])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }, [])

  const loginWithTokens = useCallback((accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken)
    const localUser = getUserFromToken(accessToken)
    if (localUser) {
      setUser(prevUser => {
        if (prevUser?.id === localUser.id) return prevUser
        return localUser
      })
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithTokens,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
