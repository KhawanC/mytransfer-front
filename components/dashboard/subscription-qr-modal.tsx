"use client"

import { useCallback, useMemo, useState } from "react"
import type { CheckoutResponse } from "@/types"
import { useCountdown } from "@/hooks/use-countdown"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"

interface SubscriptionQrModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: CheckoutResponse | null
  onRefresh: (planoId: string) => Promise<void>
}

export function SubscriptionQrModal({ open, onOpenChange, data, onRefresh }: SubscriptionQrModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { formatted, isExpired } = useCountdown(data?.expiraEm ?? null)

  const canShowQr = (!!data?.brCode || !!data?.qrCodeImageUrl) && !isExpired
  const canRefresh = isExpired && !!data?.planoId

  const handleCopy = useCallback(async () => {
    if (!data?.brCode) return
    await navigator.clipboard.writeText(data.brCode)
    toast.success("Codigo Pix copiado")
  }, [data])

  const handleRefresh = useCallback(async () => {
    if (!data?.planoId) return
    setIsRefreshing(true)
    try {
      await onRefresh(data.planoId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar novo QR Code"
      toast.error(message)
    } finally {
      setIsRefreshing(false)
    }
  }, [data, onRefresh])

  const qrValue = useMemo(() => data?.brCode ?? "", [data])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Pagamento via Pix</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code ou copie o codigo Pix. O pagamento expira em {formatted}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl bg-white p-3">
            {canShowQr ? (
              data?.qrCodeImageUrl ? (
                <img src={data.qrCodeImageUrl} alt="QR Code" className="h-[190px] w-[190px]" />
              ) : (
                <QRCodeSVG value={qrValue} size={190} level="M" />
              )
            ) : (
              <div className="h-[190px] w-[190px] rounded-lg bg-zinc-100" />
            )}
          </div>

          {data?.paymentLinkUrl && (
            <Button
              variant="secondary"
              className="w-full cursor-pointer"
              onClick={() => window.open(data.paymentLinkUrl, "_blank")}
            >
              Abrir link de pagamento
            </Button>
          )}

          <Button className="w-full cursor-pointer" onClick={handleCopy} disabled={!data?.brCode}>
            Copiar codigo Pix
          </Button>

          {canRefresh && (
            <Button
              variant="outline"
              className="w-full cursor-pointer"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Gerando..." : "Gerar novo QR Code"}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full cursor-pointer" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
