"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface CountdownReturn {
  hours: number
  minutes: number
  seconds: number
  totalSeconds: number
  isExpired: boolean
  formatted: string
}

export function useCountdown(targetDate: string | null): CountdownReturn {
  const getRemaining = useCallback(() => {
    if (!targetDate) return 0
    const diff = new Date(targetDate).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / 1000))
  }, [targetDate])

  const [totalSeconds, setTotalSeconds] = useState(getRemaining)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setTotalSeconds(getRemaining())

    intervalRef.current = setInterval(() => {
      const remaining = getRemaining()
      setTotalSeconds(remaining)
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [getRemaining])

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const pad = (n: number) => n.toString().padStart(2, "0")
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return { hours, minutes, seconds, totalSeconds, isExpired: totalSeconds <= 0, formatted }
}
