"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"

interface QrScannerProps {
  onResult: (data: string) => void
}

export function QrScanner({ onResult }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const readerId = "qr-reader"

  async function startScanner() {
    setError(null)

    try {
      const scanner = new Html5Qrcode(readerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          onResult(decodedText)
          stopScanner()
        },
        () => {},
      )
      setIsScanning(true)
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.")
      setIsScanning(false)
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop()
      }
    } catch {
      // ignore
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="space-y-3">
      <div
        id={readerId}
        className="relative w-full aspect-square rounded-lg overflow-hidden bg-secondary"
      />

      {error && <p className="text-xs text-destructive text-center">{error}</p>}

      <Button
        type="button"
        variant={isScanning ? "destructive" : "outline"}
        className="w-full cursor-pointer gap-2"
        onClick={isScanning ? stopScanner : startScanner}
      >
        {isScanning ? (
          <>
            <CameraOff className="h-4 w-4" />
            Parar câmera
          </>
        ) : (
          <>
            <Camera className="h-4 w-4" />
            Abrir câmera
          </>
        )}
      </Button>
    </div>
  )
}
