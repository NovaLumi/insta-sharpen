import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ credits: 0 })
    }

    const { data: creditsData, error } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no credits record, create one with default 3 credits
      if (error.code === 'PGRST116') {
        const { data: newCredits, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: user.id, amount: 3 })
          .select('amount')
          .single()

        if (insertError) {
          return NextResponse.json({ credits: 0 })
        }

        return NextResponse.json({ credits: newCredits.amount })
      }

      return NextResponse.json({ credits: 0 })
    }

    return NextResponse.json({ credits: creditsData.amount })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json({ credits: 0 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { amount, operation, description, taskId } = await request.json()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current credits
    const { data: currentCredits } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single()

    const currentAmount = currentCredits?.amount || 0

    if (operation === 'deduct') {
      if (currentAmount < amount) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
      }

      const newAmount = currentAmount - amount

      // Update credits
      const { error } = await supabase
        .from('credits')
        .update({ amount: newAmount, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
      }

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'deduct',
          description: description || 'Image upscaling',
          task_id: taskId || null,
        })

      return NextResponse.json({ success: true, credits: newAmount })
    }

    if (operation === 'add') {
      const newAmount = currentAmount + amount

      // Update or create credits record
      if (currentCredits) {
        await supabase
          .from('credits')
          .update({ amount: newAmount, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
      } else {
        await supabase
          .from('credits')
          .insert({ user_id: user.id, amount: newAmount })
      }

      // Record transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: amount,
          type: 'purchase',
          description: description || 'Credits purchased',
        })

      return NextResponse.json({ success: true, credits: newAmount })
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
  } catch (error) {
    console.error('Credits operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
