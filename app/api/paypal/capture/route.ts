import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateAccessToken,
  getPayPalApiBase,
  parsePayPalOrder,
  validatePayment,
  getPlan,
  type PayPalOrderResponse,
} from '@/lib/paypal'

interface ProcessPurchaseResult {
  status: 'processed' | 'already_processed'
  credits: number
  credits_added: number
}

async function getCurrentCredits(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', userId)
    .maybeSingle()

  return data?.amount || 0
}

// Capture PayPal Order and add credits
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const { data: existingTransaction } = await supabase
      .from('credit_transactions')
      .select('amount, description, type')
      .eq('paypal_order_id', orderId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingTransaction && existingTransaction.type !== 'purchase_pending') {
      const credits = await getCurrentCredits(supabase, user.id)

      return NextResponse.json({
        success: true,
        credits,
        creditsAdded: existingTransaction?.amount || 0,
        alreadyProcessed: true,
      })
    }

    const accessToken = await generateAccessToken()
    const apiBase = getPayPalApiBase()

    const response = await fetch(`${apiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const orderData = await response.json() as PayPalOrderResponse & { message?: string }

    if (!response.ok) {
      console.error('PayPal capture error:', orderData)
      return NextResponse.json(
        { error: orderData.message || 'Failed to capture order' },
        { status: response.status }
      )
    }

    const parsedOrder = parsePayPalOrder(orderData)
    if (!parsedOrder) {
      return NextResponse.json(
        { error: 'Failed to parse order data' },
        { status: 500 }
      )
    }

    const validation = validatePayment(parsedOrder)
    if (!validation.valid) {
      console.error('Payment validation failed:', validation.error, parsedOrder)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    if (parsedOrder.userId !== user.id) {
      console.error('User ID mismatch:', parsedOrder.userId, user.id)
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      )
    }

    const plan = getPlan(parsedOrder.planId)
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    const { data: purchaseResult, error: purchaseError } = await supabase
      .rpc('process_paypal_credit_purchase', {
        p_user_id: user.id,
        p_order_id: orderId,
        p_credits: plan.credits,
        p_description: `${plan.name} plan - PayPal (${orderId})`,
      })

    if (purchaseError) {
      console.error('Atomic PayPal credit processing failed:', purchaseError)
      return NextResponse.json(
        { error: 'Database migration required or payment processing failed' },
        { status: 500 }
      )
    }

    const result = Array.isArray(purchaseResult)
      ? purchaseResult[0] as ProcessPurchaseResult | undefined
      : purchaseResult as ProcessPurchaseResult | undefined

    if (!result) {
      return NextResponse.json(
        { error: 'Unexpected payment processing result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credits: result.credits,
      planName: plan.name,
      creditsAdded: result.credits_added,
      alreadyProcessed: result.status === 'already_processed',
    })
  } catch (error) {
    console.error('Capture order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
