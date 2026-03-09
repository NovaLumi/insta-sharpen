import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAccessToken, getPayPalApiBase, getPlan } from '@/lib/paypal'

// Create PayPal Order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    const plan = getPlan(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const accessToken = await generateAccessToken()
    const apiBase = getPayPalApiBase()

    const response = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: `${planId}_${user.id}`,
            description: `${plan.name} Plan - ${plan.credits} Credits`,
            amount: {
              currency_code: 'USD',
              value: plan.price.toFixed(2),
            },
          },
        ],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('PayPal create order error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to create order' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
