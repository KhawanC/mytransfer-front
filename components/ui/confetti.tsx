"use client"

import { useMemo } from "react"

interface ConfettiProps {
  active: boolean
}

export function Confetti({ active }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.6
        const duration = 2.4 + Math.random() * 0.8
        const rotate = Math.random() * 360
        const colors = [
          "#f97316",
          "#facc15",
          "#22c55e",
          "#0ea5e9",
          "#8b5cf6",
          "#ec4899",
        ]
        const color = colors[index % colors.length]
        return { left, delay, duration, rotate, color }
      }),
    [],
  )

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ["--rotate" as string]: `${piece.rotate}deg`,
            ["--rotate-end" as string]: `${piece.rotate + 180}deg`,
          }}
        />
      ))}
    </div>
  )
}
