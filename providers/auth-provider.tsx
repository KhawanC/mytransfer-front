"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import type { User, AuthResponse } from "@/types"
import { api, ApiError } from "@/lib/api"
import { getAccessToken, setTokens, clearTokens, isTokenExpired, getUserFromToken } from "@/lib/auth"

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

  const fetchUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token || isTokenExpired(token)) {
      setUser(null)
      setIsLoading(false)
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
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email: string, password: string) => {
    const data = await api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const data = await api<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
  }

  const loginWithTokens = (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken)
    const localUser = getUserFromToken(accessToken)
    setUser(localUser)
  }

  const logout = () => {
    clearTokens()
    setUser(null)
  }

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
