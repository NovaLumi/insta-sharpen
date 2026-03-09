// Plan configuration - single source of truth

export interface Plan {
  id: string
  name: string
  price: number
  credits: number
  features: string[]
  popular?: boolean
}

export const PLANS: Record<string, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9.9,
    credits: 60,
    features: [
      '2 Credits per image (2x)',
      '4 Credits per image (4x)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19.9,
    credits: 500,
    features: [
      '500 Image Enhancements',
      '2 Credits per image (2x)',
      '4 Credits per image (4x)',
      '8 Credits per image (8x)',
      'Priority processing',
    ],
    popular: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.9,
    credits: 1000,
    features: [
      '1000 Image Enhancements',
      '2 Credits per image (2x)',
      '4 Credits per image (4x)',
      '8 Credits per image (8x)',
      'Priority processing',
    ],
  },
}

export function getPlan(planId: string): Plan | undefined {
  return PLANS[planId]
}

export function getPlanByPrice(price: number): Plan | undefined {
  return Object.values(PLANS).find(plan => plan.price === price)
}

export function isValidPrice(planId: string, price: number): boolean {
  const plan = PLANS[planId]
  return plan?.price === price
}

export function getPlanList(): Plan[] {
  return Object.values(PLANS)
}
