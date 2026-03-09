import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_CREDITS } from '@/lib/constants'

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
      // If no credits record, create one with default credits
      if (error.code === 'PGRST116') {
        const { data: newCredits, error: insertError } = await supabase
          .from('credits')
          .insert({ user_id: user.id, amount: DEFAULT_CREDITS })
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

    if (operation === 'deduct') {
      // Try RPC first for atomic operation
      const { data: deductResult, error: rpcError } = await supabase
        .rpc('deduct_credits_if_sufficient', {
          p_user_id: user.id,
          p_amount: amount,
        })

      if (!rpcError && deductResult !== null) {
        if (!deductResult) {
          return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
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

        // Get updated credits
        const { data: credits } = await supabase
          .from('credits')
          .select('amount')
          .eq('user_id', user.id)
          .single()

        return NextResponse.json({ success: true, credits: credits?.amount || 0 })
      }

      // Fallback: Manual atomic deduction with optimistic locking
      const { data: currentCredits } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single()

      const currentAmount = currentCredits?.amount || 0

      if (currentAmount < amount) {
        return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
      }

      // Conditional update for atomicity - use select to verify update happened
      const { data: updateResult, error: updateError } = await supabase
        .from('credits')
        .update({
          amount: currentAmount - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('amount', currentAmount) // Optimistic lock
        .select('id')
        .maybeSingle()

      if (updateError || !updateResult) {
        return NextResponse.json(
          { error: 'Concurrent operation detected, please retry' },
          { status: 409 }
        )
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

      return NextResponse.json({ success: true, credits: currentAmount - amount })
    }

    if (operation === 'add') {
      // Try RPC for atomic increment
      const { error: rpcError } = await supabase
        .rpc('increment_credits', {
          p_user_id: user.id,
          p_amount: amount,
        })

      if (rpcError) {
        // Fallback: manual upsert
        const { data: currentCredits } = await supabase
          .from('credits')
          .select('amount')
          .eq('user_id', user.id)
          .maybeSingle()

        if (currentCredits) {
          await supabase
            .from('credits')
            .update({
              amount: currentCredits.amount + amount,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
        } else {
          await supabase
            .from('credits')
            .insert({ user_id: user.id, amount: amount })
        }
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

      // Get final amount
      const { data: finalCredits } = await supabase
        .from('credits')
        .select('amount')
        .eq('user_id', user.id)
        .single()

      return NextResponse.json({ success: true, credits: finalCredits?.amount || amount })
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 })
  } catch (error) {
    console.error('Credits operation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
