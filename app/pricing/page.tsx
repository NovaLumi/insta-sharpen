"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/context/AppContext"

const plans = [
  {
    name: "Starter",
    price: 9.9,
    credits: 60,
    features: [
      "60 Image Enhancements",
      "2 Credits per image (2x)",
      "1.5 Credits per image (4x)",
      "Valid for 30 days",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: 19.9,
    credits: 500,
    features: [
      "500 Image Enhancements",
      "2 Credits per image (2x)",
      "1.25 Credits per image (4x)",
      "Priority processing",
      "Valid for 90 days",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: 29.9,
    credits: 1000,
    features: [
      "1000 Image Enhancements",
      "2 Credits per image (2x)",
      "1 Credit per image (4x)",
      "Priority processing",
      "Email support",
      "Valid for 180 days",
    ],
    popular: false,
  },
]

export default function PricingPage() {
  const { credits, fetchCredits } = useApp()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (plan: typeof plans[0]) => {
    setLoading(plan.name)
    // TODO: Integrate Stripe payment
    // For now, just add credits directly
    try {
      const response = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.credits,
          operation: 'add',
          description: `${plan.name} plan purchase`
        }),
      })

      if (response.ok) {
        fetchCredits()
        alert(`${plan.name} plan activated! ${plan.credits} credits added.`)
      } else {
        alert('Purchase failed. Please try again.')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed. Please try again.')
    } finally {
      setLoading(null)
    }
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
          <div
            key={plan.name}
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
                <span className="text-muted-foreground">$</span>
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
              onClick={() => handlePurchase(plan)}
              disabled={loading === plan.name}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.popular
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-secondary text-secondary-foreground hover:opacity-80'
              } disabled:opacity-50`}
            >
              {loading === plan.name ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a4 4 0 00-4-4z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Get ${plan.credits} Credits`
              )}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="mt-16 text-center text-muted-foreground text-sm">
        <p>All prices are in USD. Credits never expire.</p>
        <p className="mt-2">Secure payment powered by Stripe</p>
      </div>
    </main>
  )
}
