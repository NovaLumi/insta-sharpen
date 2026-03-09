"use client"

import { Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { getPlanList, type Plan } from "@/lib/plans"

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-8 flex flex-col ${
        plan.popular
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 right-1/2 flex justify-center">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            MOST POPULAR
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">USD</span>
        </div>
        <p className="text-sm text-muted-foreground">{plan.credits} credits</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          plan.popular
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'bg-secondary text-secondary-foreground hover:opacity-80'
        }`}
      >
        Select {plan.name}
      </button>
    </div>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const plans = getPlanList()

  const handleSelectPlan = (planId: string) => {
    router.push(`/checkout?plan=${planId}`)
  }

  return (
    <main className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that fits your needs
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelect={() => handleSelectPlan(plan.id)}
          />
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-16 text-center text-muted-foreground text-sm">
        <p>All prices are in USD. Credits never expire.</p>
        <p className="mt-2">Secure payment powered by PayPal</p>
      </div>
    </main>
  )
}
