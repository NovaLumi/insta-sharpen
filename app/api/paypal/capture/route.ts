import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAccessToken, getPayPalApiBase, parsePayPalOrder, validatePayment, getPlan, type PayPalOrderResponse } from '@/lib/paypal'

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

    // Check if this order has already been processed (prevent duplicate payments)
    const { data: existingTransaction } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('paypal_order_id', orderId)
      .maybeSingle()

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Order already processed' },
        { status: 400 }
      )
    }

    const accessToken = await generateAccessToken()
    const apiBase = getPayPalApiBase()

    // Capture the order
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

    // Parse order data
    const parsedOrder = parsePayPalOrder(orderData)
    if (!parsedOrder) {
      return NextResponse.json(
        { error: 'Failed to parse order data' },
        { status: 500 }
      )
    }

    // Validate the payment (status, plan, amount)
    const validation = validatePayment(parsedOrder)
    if (!validation.valid) {
      console.error('Payment validation failed:', validation.error, parsedOrder)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify the user matches
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

    // Use atomic update with increment to avoid race conditions
    // First, try to update existing record
    const { data: updateResult, error: updateError } = await supabase
      .rpc('increment_credits', {
        p_user_id: user.id,
        p_amount: plan.credits,
      })

    if (updateError) {
      // If RPC doesn't exist, fall back to manual upsert
      const { data: currentCredits } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .maybeSingle()

      if (currentCredits) {
        const { error: upsertError } = await supabase
          .from('credits')
          .update({
            amount: currentCredits.amount + plan.credits,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (upsertError) {
          console.error('Failed to update credits:', upsertError)
          return NextResponse.json(
            { error: 'Failed to add credits' },
            { status: 500 }
          )
        }
      } else {
        const { error: insertError } = await supabase
          .from('credits')
          .insert({
            user_id: user.id,
            amount: plan.credits,
          })

        if (insertError) {
          console.error('Failed to insert credits:', insertError)
          return NextResponse.json(
            { error: 'Failed to add credits' },
            { status: 500 }
          )
        }
      }
    }

    // Get final credits amount
    const { data: finalCredits } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single()

    // Record transaction with paypal_order_id for deduplication
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: plan.credits,
        type: 'purchase',
        description: `${plan.name} plan - PayPal (${orderId})`,
        paypal_order_id: orderId,
      })

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      credits: finalCredits?.amount || plan.credits,
      planName: plan.name,
      creditsAdded: plan.credits,
    })
  } catch (error) {
    console.error('Capture order error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
