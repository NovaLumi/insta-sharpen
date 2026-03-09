"use client"

import { X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { getPlanList, type Plan } from "@/lib/plans"

interface PricingModalProps {
  onClose: () => void
}

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`
        relative p-6 rounded-xl border-2 transition-all cursor-pointer
        ${plan.popular
          ? 'border-primary bg-primary/5 scale-105'
          : 'border-border hover:border-primary/50'
        }
      `}
      onClick={onSelect}
    >
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
          Most Popular
        </span>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${plan.price}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {plan.credits} credits
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`
          w-full py-3 rounded-lg font-semibold transition-all
          ${plan.popular
            ? 'bg-primary text-primary-foreground hover:opacity-90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
          }
        `}
      >
        Purchase
      </button>
    </motion.div>
  )
}

export default function PricingModal({ onClose }: PricingModalProps) {
  const router = useRouter()
  const plans = getPlanList()

  const handleSelectPlan = (planId: string) => {
    onClose()
    router.push(`/checkout?plan=${planId}`)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
            <p className="text-muted-foreground">Get more credits to enhance your images</p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={() => handleSelectPlan(plan.id)}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Secure payment powered by PayPal</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
