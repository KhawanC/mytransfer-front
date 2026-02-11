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
import { Check, ChevronLeft, ChevronRight, Crown, Sparkles, Zap, Users, Clock, FileStack, Upload } from "lucide-react"
import { toast } from "sonner"

const benefits = [
  { icon: Zap, text: "Sessoes simultaneas ilimitadas", color: "text-amber-400" },
  { icon: Users, text: "Sessoes em grupo com aprovacao (ate 10 usuarios)", color: "text-purple-400" },
  { icon: Clock, text: "Sessões criadas duram 5 horas", color: "text-blue-400" },
  { icon: FileStack, text: "Até 100 arquivos por sessão", color: "text-green-400" },
  { icon: Upload, text: "Upload de até 5GB por arquivo", color: "text-pink-400" },
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
    const child = sliderRef.current.children.item(index) as HTMLElement | null
    if (!child) return
    sliderRef.current.scrollTo({ left: child.offsetLeft, behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (!sliderRef.current) return
    const slider = sliderRef.current
    const onScroll = () => {
      const children = Array.from(slider.children) as HTMLElement[]
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
          className="w-full h-11 gap-2 cursor-pointer border border-amber-300/60 bg-linear-to-r from-amber-300/25 via-yellow-200/15 to-amber-200/25 text-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_10px_24px_rgba(251,191,36,0.22)] transition hover:border-amber-300/90 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.6),0_14px_34px_rgba(251,191,36,0.35)]"
        >
          <Crown className="h-4 w-4" />
          Aumentar limites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl bg-linear-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                Plano Premium
              </DialogTitle>
              <DialogDescription className="text-base">
                Desbloqueie todo o potencial do MyTransfer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold bg-linear-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Escolha seu plano</span>
            </div>
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
            className="flex gap-4 overflow-x-auto pb-3 pr-2 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch] scrollbar-hide"
          >
            {plans.map((plan) => {
              const isFeatured = featuredPlanId === plan.id
              return (
                <Card
                  key={plan.id}
                  className={`min-w-62.5 md:min-w-70 snap-start relative transition-all duration-300 ${
                    isFeatured
                      ? "border-2 border-transparent bg-linear-to-br from-amber-500/20 via-yellow-400/10 to-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.3),0_0_60px_rgba(251,191,36,0.15)] animate-glow-pulse"
                      : "border border-border/60 bg-linear-to-b from-background to-muted/30 hover:border-border hover:shadow-lg"
                  }`}
                >
                  {isFeatured && (
                    <>
                      <div className="absolute -inset-px rounded-xl bg-linear-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-75 blur-sm animate-border-glow" />
                      <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-linear-to-r from-amber-400 to-yellow-300 opacity-75 blur-md animate-ping" />
                          <Badge className="relative border-amber-400/50 bg-linear-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 font-bold text-[10px] shadow-lg px-2 py-1">
                            <Crown className="h-3 w-3 mr-1 inline" />
                            RECOMENDADO
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                  <CardHeader className="space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className={`text-lg font-bold ${
                        isFeatured
                          ? "bg-linear-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent"
                          : "text-foreground"
                      }`}>
                        {plan.nome}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={`w-fit text-[11px] ${
                      isFeatured ? "border-amber-400/50 text-amber-300" : ""
                    }`}>
                      {plan.duracaoDias} dias de acesso
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div>
                      <div className={`text-3xl font-bold ${
                        isFeatured
                          ? "bg-linear-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent"
                          : "text-foreground"
                      }`}>
                        {formatPrice(plan.precoCentavos)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pagamento único via Pix</p>
                    </div>
                    <Button
                      className={`w-full cursor-pointer font-semibold ${
                        isFeatured
                          ? "bg-linear-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:via-yellow-500 hover:to-amber-600 text-white shadow-[0_4px_20px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_30px_rgba(251,191,36,0.6)]"
                          : ""
                      }`}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={activePlanId === plan.id}
                    >
                      {activePlanId === plan.id ? "Gerando QR Code..." : isFeatured ? "🚀 Começar agora" : "Comprar"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
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
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`plan-skeleton-${index}`}
                className="min-w-62.5 md:min-w-70 rounded-xl border border-border/60 bg-secondary/40 p-6 space-y-4"
              >
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-500/5 via-transparent to-purple-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-yellow-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold bg-linear-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Todos os benefícios inclusos
            </span>
          </div>
          <ul className="space-y-3">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <li key={index} className="flex items-start gap-3 group">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                    <Icon className={`h-3.5 w-3.5 ${benefit.color}`} />
                  </div>
                  <span className="text-sm text-foreground/90 leading-relaxed">{benefit.text}</span>
                </li>
              )
            })}
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
