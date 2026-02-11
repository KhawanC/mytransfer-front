"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { listSubscriptionPlans, createSubscriptionCheckout } from "@/lib/api"
import type { CheckoutResponse, PlanoAssinatura } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, ChevronLeft, ChevronRight, Crown } from "lucide-react"
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
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const canUpgrade = user?.userType !== "GUEST" && user?.userType !== "PREMIUM"

  const planLabel = useMemo(() => {
    if (plans.length === 0) return ""
    return plans.map((plan) => plan.nome).join(" · ")
  }, [plans])

  const featuredPlanId = useMemo(() => {
    if (plans.length === 0) return null
    return plans.reduce((best, plan) => {
      const bestScore = best.precoCentavos / Math.max(best.duracaoDias, 1)
      const nextScore = plan.precoCentavos / Math.max(plan.duracaoDias, 1)
      return nextScore < bestScore ? plan : best
    }, plans[0]).id
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

  const handleScroll = useCallback((direction: "left" | "right") => {
    if (!sliderRef.current) return
    const delta = Math.max(sliderRef.current.clientWidth * 0.85, 240)
    sliderRef.current.scrollBy({ left: direction === "left" ? -delta : delta, behavior: "smooth" })
  }, [])

  const handleDotClick = useCallback((index: number) => {
    if (!sliderRef.current) return
    const child = sliderRef.current.children.item(index)
    if (!child) return
    sliderRef.current.scrollTo({ left: child.offsetLeft, behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!sliderRef.current) return
    const slider = sliderRef.current
    const onScroll = () => {
      const children = Array.from(slider.children)
      if (children.length === 0) return
      const sliderLeft = slider.scrollLeft
      const closestIndex = children.reduce((closest, child, index) => {
        const delta = Math.abs(child.offsetLeft - sliderLeft)
        return delta < closest.delta ? { index, delta } : closest
      }, { index: 0, delta: Number.POSITIVE_INFINITY }).index
      setActiveIndex(closestIndex)
    }
    onScroll()
    slider.addEventListener("scroll", onScroll, { passive: true })
    return () => slider.removeEventListener("scroll", onScroll)
  }, [plans.length])

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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted-foreground">Escolha seu plano</div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => handleScroll("left")}
                aria-label="Deslizar para a esquerda"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => handleScroll("right")}
                aria-label="Deslizar para a direita"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="flex gap-4 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
          >
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="min-w-[230px] snap-start border-border/60 bg-gradient-to-b from-background to-muted/30"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{plan.nome}</CardTitle>
                    {featuredPlanId === plan.id && (
                      <Badge variant="secondary" className="text-[10px]">
                        Recomendado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">
                      {plan.duracaoDias} dias
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-semibold text-foreground">
                      {formatPrice(plan.precoCentavos)}
                    </div>
                    <p className="text-xs text-muted-foreground">Pagamento unico via Pix</p>
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

          {plans.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {plans.map((plan, index) => (
                <Button
                  key={`plan-dot-${plan.id}`}
                  type="button"
                  variant={activeIndex === index ? "default" : "outline"}
                  size="icon"
                  className="h-2.5 w-2.5 rounded-full p-0"
                  onClick={() => handleDotClick(index)}
                  aria-label={`Ir para o plano ${plan.nome}`}
                />
              ))}
            </div>
          )}
        </div>

        {isLoading && plans.length === 0 && (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`plan-skeleton-${index}`}
                className="min-w-[230px] rounded-lg border border-border/60 bg-secondary/40 p-4"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-6 w-28" />
                <Skeleton className="mt-6 h-9 w-full" />
              </div>
            ))}
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
