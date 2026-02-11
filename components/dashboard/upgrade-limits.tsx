"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@/providers/auth-provider"
import { listSubscriptionPlans, createSubscriptionCheckout } from "@/lib/api"
import type { CheckoutResponse, PlanoAssinatura } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Waves from "@/components/react-bits/waves"
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

  const canUpgrade = user?.userType === "FREE"

  const planLabel = useMemo(() => {
    if (plans.length === 0) return ""
    return plans.map((plan) => plan.nome).join(" · ")
  }, [plans])

  const featuredPlanId = useMemo(() => {
    if (plans.length === 0) return null
    return plans.find((plan) => plan.recomendado)?.id ?? null
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
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-3xl lg:max-w-4xl p-4 sm:p-6">
        <DialogHeader className="pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(251,191,36,0.4)]">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl bg-linear-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                Plano Premium
              </DialogTitle>
              <DialogDescription className="text-sm">
                Desbloqueie todo o potencial do MyTransfer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-semibold bg-linear-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Escolha seu plano</span>
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
            className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pr-2 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch] scrollbar-hide"
          >
            {plans.map((plan) => {
              const isFeatured = featuredPlanId === plan.id
              return (
                <Card
                  key={plan.id}
                  className={`min-w-56 sm:min-w-60 md:min-w-64 snap-start relative transition-all duration-300 overflow-hidden ${
                    isFeatured
                      ? "border-2 border-slate-300/30 bg-linear-to-br from-slate-100/10 via-zinc-50/5 to-slate-100/10 shadow-[0_8px_32px_rgba(148,163,184,0.25),0_0_0_1px_rgba(148,163,184,0.1)] backdrop-blur-sm"
                      : "border border-border/60 bg-linear-to-b from-background to-muted/30 hover:border-border hover:shadow-lg"
                  }`}
                >
                  {isFeatured && (
                    <>
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <Waves
                          className="pointer-events-none opacity-70"
                          lineColor="rgba(226, 232, 240, 0.35)"
                          backgroundColor="transparent"
                          waveSpeedX={0.015}
                          waveSpeedY={0.006}
                          waveAmpX={28}
                          waveAmpY={14}
                          xGap={12}
                          yGap={28}
                          friction={0.9}
                          tension={0.008}
                          maxCursorMove={80}
                        />
                      </div>
                      <div className="absolute -inset-px rounded-xl bg-linear-to-r from-slate-300/40 via-zinc-200/30 to-slate-300/40 opacity-60 blur-[2px]" />
                      <div className="absolute top-2 right-2">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-linear-to-r from-slate-300 to-zinc-200 opacity-50 blur-md animate-ping" />
                          <Badge className="relative border-slate-300/50 bg-linear-to-r from-slate-100 via-zinc-50 to-slate-100 text-slate-800 font-bold text-[10px] shadow-[0_4px_12px_rgba(148,163,184,0.3)] px-2 py-1">
                            <Crown className="h-3 w-3 mr-1 inline" />
                            RECOMENDADO
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                  <CardHeader className="space-y-2 relative z-10 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className={`text-base font-bold ${
                        isFeatured
                          ? "text-amber-200"
                          : "text-foreground"
                      }`}>
                        {plan.nome}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className={`w-fit text-[11px] ${
                      isFeatured ? "border-slate-300/50 text-slate-400" : ""
                    }`}>
                      {plan.duracaoDias} dias de acesso
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 relative z-10 pt-0">
                    <div>
                      <div className={`text-2xl font-bold ${
                        isFeatured
                          ? "bg-linear-to-r from-slate-200 via-zinc-100 to-slate-200 bg-clip-text text-transparent"
                          : "text-foreground"
                      }`}>
                        {formatPrice(plan.precoCentavos)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pagamento único via Pix</p>
                    </div>
                    <Button
                      className={`w-full cursor-pointer font-semibold ${
                        isFeatured
                          ? "bg-linear-to-r from-slate-600 via-zinc-500 to-slate-600 hover:from-slate-700 hover:via-zinc-600 hover:to-slate-700 text-white shadow-[0_4px_20px_rgba(148,163,184,0.4)] hover:shadow-[0_6px_30px_rgba(148,163,184,0.6)]"
                          : ""
                      }`}
                      onClick={() => handleCheckout(plan.id)}
                      disabled={activePlanId === plan.id}
                    >
                      {activePlanId === plan.id ? "Gerando QR Code..." : isFeatured ? "⭐ Começar agora" : "Comprar"}
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
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`plan-skeleton-${index}`}
                className="min-w-60 md:min-w-64 rounded-xl border border-border/60 bg-secondary/40 p-4 space-y-3"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-linear-to-br from-amber-500/5 via-transparent to-purple-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-amber-400 to-yellow-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold bg-linear-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Benefícios inclusos
            </span>
          </div>
          <ul className="grid md:grid-cols-2 gap-x-4 gap-y-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <li key={index} className="flex items-start gap-2 group">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-primary/20 to-primary/10 transition-transform group-hover:scale-110">
                    <Icon className={`h-3 w-3 ${benefit.color}`} />
                  </div>
                  <span className="text-xs text-foreground/90 leading-snug">{benefit.text}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
