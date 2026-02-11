"use client"

import { useEffect, useState } from "react"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}
