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
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText) => {
          console.log("QR Code detectado:", decodedText)
          onResult(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Log silencioso de erros de scan (normal durante o scan)
          if (!errorMessage.includes("NotFoundException")) {
            console.debug("Erro de scan:", errorMessage)
          }
        },
      )
      setIsScanning(true)
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err)
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
