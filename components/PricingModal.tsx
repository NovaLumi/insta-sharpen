"use client"

import { X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface PricingModalProps {
  onClose: () => void
}

const plans = [
  {
    name: 'Starter',
    credits: 20,
    price: 4.99,
    features: ['20 Image Credits', 'Standard Processing', 'No Watermark'],
  },
  {
    name: 'Pro',
    credits: 100,
    price: 19.99,
    features: ['100 Image Credits', 'Pro Enhance Mode', 'Priority Processing', 'No Watermark'],
    recommended: true,
  },
  {
    name: 'Unlimited',
    credits: -1,
    price: 49.99,
    features: ['Unlimited Credits', 'All Processing Modes', 'Priority Support', 'No Watermark', 'API Access'],
  },
]

export default function PricingModal({ onClose }: PricingModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-card border border-border rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Get More Credits</h2>
            <p className="text-muted-foreground">
              Choose the perfect plan for your image enhancement needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${plan.recommended
                    ? 'border-primary bg-primary/5 scale-105'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {plan.recommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    Best Value
                  </span>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.credits === -1 ? 'Unlimited' : plan.credits} credits
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`
                    w-full py-3 rounded-lg font-semibold transition-all
                    ${plan.recommended
                      ? 'bg-primary text-primary-foreground hover:opacity-90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
                    }
                  `}
                >
                  Purchase
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
