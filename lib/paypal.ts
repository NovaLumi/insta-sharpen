import { PLANS } from './plans'

// Re-export getPlan for convenience
export { getPlan } from './plans'

const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export function getPayPalApiBase(): string {
  return PAYPAL_API_BASE
}

export async function generateAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('PayPal credentials missing:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret
    })
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  })

  const data = await response.json() as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!response.ok) {
    console.error('PayPal auth error:', {
      status: response.status,
      error: data.error,
      error_description: data.error_description
    })
    throw new Error(data.error_description || data.error || 'Failed to generate access token')
  }

  if (!data.access_token) {
    throw new Error('No access token in PayPal response')
  }

  return data.access_token
}

export interface PayPalOrderData {
  orderId: string
  status: string
  amount: number
  currency: string
  planId: string
  userId: string
}

interface PayPalPurchaseUnit {
  reference_id?: string
  payments?: {
    captures?: Array<{
      status?: string
      amount?: {
        value?: string
        currency_code?: string
      }
    }>
  }
}

export interface PayPalOrderResponse {
  id: string
  purchase_units?: PayPalPurchaseUnit[]
}

export function parsePayPalOrder(orderData: PayPalOrderResponse): PayPalOrderData | null {
  try {
    const purchaseUnit = orderData.purchase_units?.[0]
    if (!purchaseUnit) return null

    const referenceId = purchaseUnit.reference_id || ''
    const [planId, userId] = referenceId.split('_')

    const capture = purchaseUnit.payments?.captures?.[0]
    const amount = capture?.amount

    return {
      orderId: orderData.id,
      status: capture?.status || '',
      amount: parseFloat(amount?.value || '0'),
      currency: amount?.currency_code || 'USD',
      planId,
      userId,
    }
  } catch {
    return null
  }
}

export function validatePayment(orderData: PayPalOrderData): { valid: boolean; error?: string } {
  // Check capture status
  if (orderData.status !== 'COMPLETED') {
    return { valid: false, error: 'Payment not completed' }
  }

  // Verify plan exists
  const plan = PLANS[orderData.planId]
  if (!plan) {
    return { valid: false, error: 'Invalid plan' }
  }

  // Verify amount matches plan price
  if (orderData.amount !== plan.price) {
    return { valid: false, error: 'Amount mismatch - possible fraud attempt' }
  }

  return { valid: true }
}

export { PLANS }
