import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAccessToken, getPayPalApiBase } from '@/lib/paypal'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accessToken = await generateAccessToken()
    const apiBase = getPayPalApiBase()

    return NextResponse.json({
      ok: true,
      environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
      apiBase,
      tokenReceived: Boolean(accessToken),
    })
  } catch (error) {
    console.error('PayPal health check failed:', error)
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
      },
      { status: 500 }
    )
  }
}
