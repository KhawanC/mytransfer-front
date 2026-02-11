"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { listSubscriptionPlans, createSubscriptionCheckout } from "@/lib/api"
import type { CheckoutResponse, PlanoAssinatura } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, Crown } from "lucide-react"
import { toast } from "sonner"

const benefits = [
  "Sessoes simultaneas ilimitadas",
  "Sessoes em grupo com aprovacao (ate 10 usuarios)",
  "Sessões criadas duram 5 horas",
  "Até 100 arquivos por sessão",
  "Upload de até 5GB por arquivo",
]

function formatPrice(precoCentavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(precoCentavos / 100)
}

interface UpgradeLimitsProps {
  onCheckoutCreated: (data: CheckoutResponse) => void
}

export function UpgradeLimits({ onCheckoutCreated }: UpgradeLimitsProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [plans, setPlans] = useState<PlanoAssinatura[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)

  const canUpgrade = user?.userType !== "GUEST" && user?.userType !== "PREMIUM"

  const planLabel = useMemo(() => {
    if (plans.length === 0) return ""
    return plans.map((plan) => plan.nome).join(" · ")
  }, [plans])

  const fetchPlans = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listSubscriptionPlans()
      setPlans(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar planos"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && plans.length === 0) {
      fetchPlans()
    }
  }, [open, plans.length, fetchPlans])

  const handleCheckout = useCallback(async (planId: string) => {
    setActivePlanId(planId)
    try {
      const data = await createSubscriptionCheckout(planId)
      onCheckoutCreated(data)
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar QR Code"
      toast.error(message)
    } finally {
      setActivePlanId(null)
    }
  }, [onCheckoutCreated])

  if (!canUpgrade) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="w-full h-11 gap-2 cursor-pointer border border-amber-300/60 bg-gradient-to-r from-amber-300/25 via-yellow-200/15 to-amber-200/25 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_10px_24px_rgba(251,191,36,0.22)] transition hover:border-amber-300/90 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.6),0_14px_34px_rgba(251,191,36,0.35)]"
        >
          <Crown className="h-4 w-4" />
          Aumentar limites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plano Premium</DialogTitle>
          <DialogDescription>
            Desbloqueie limites maiores e sessoes em grupo. {planLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="border-border/60">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{plan.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.duracaoDias} dias</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-semibold text-foreground">
                  {formatPrice(plan.precoCentavos)}
                </div>
                <Button
                  className="w-full cursor-pointer"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={activePlanId === plan.id}
                >
                  {activePlanId === plan.id ? "Gerando QR Code..." : "Comprar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && plans.length === 0 && (
          <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
            Carregando planos...
          </div>
        )}

        <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-primary" />
            Beneficios inclusos
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-primary" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
