import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs'

export async function POST(request: NextRequest) {
  try {
    const KIE_API_KEY = process.env.KIE_API_KEY
    if (!KIE_API_KEY) {
      console.error('KIE_API_KEY environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { imageUrl, upscaleFactor } = body

    if (!imageUrl || !upscaleFactor) {
      return NextResponse.json(
        { error: 'Missing imageUrl or upscaleFactor' },
        { status: 400 }
      )
    }

    // Calculate cost
    const costMap: Record<string, number> = { '2': 1, '4': 2, '8': 4 }
    const cost = costMap[upscaleFactor] || 1

    // Check and deduct credits atomically
    const { data: currentCredits, error: creditError } = await supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single()

    if (creditError || !currentCredits || currentCredits.amount < cost) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      )
    }

    // Deduct credits before processing
    const { error: deductError } = await supabase
      .from('credits')
      .update({
        amount: currentCredits.amount - cost,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (deductError) {
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      )
    }

    // Record transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        amount: -cost,
        type: 'deduct',
        description: `Image upscale ${upscaleFactor}x`,
      })

    // Create task with kie.ai API
    const response = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'topaz/image-upscale',
        input: {
          image_url: imageUrl,
          upscale_factor: String(upscaleFactor),
        },
      }),
    })

    const data = await response.json()

    if (!response.ok || data.code !== 200) {
      console.error('Kie.ai API error:', data)
      // Refund credits on API failure
      await supabase
        .from('credits')
        .update({ amount: currentCredits.amount })
        .eq('user_id', user.id)
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          amount: cost,
          type: 'refund',
          description: 'API error - credit refund',
        })
      return NextResponse.json(
        { error: data.msg || 'Failed to create upscale task' },
        { status: response.status }
      )
    }

    const taskId = data.data?.taskId

    if (!taskId) {
      console.error('Failed to get taskId from kie.ai response:', data)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    // Record task to database
    await supabase
      .from('upscale_tasks')
      .insert({
        user_id: user.id,
        task_id: taskId,
        original_url: imageUrl,
        upscale_factor: `${upscaleFactor}x`,
        credits_used: cost,
        status: 'pending',
      })

    return NextResponse.json({
      success: true,
      taskId,
    })
  } catch (error) {
    console.error('Upscale API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Poll task status from kie.ai API
// state values: 'waiting' -> 'generating' -> 'success' or 'failed'
export async function GET(request: NextRequest) {
  try {
    const KIE_API_KEY = process.env.KIE_API_KEY
    if (!KIE_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      )
    }

    // Query task from database
    const { data: task, error } = await supabase
      .from('upscale_tasks')
      .select('status, result_url, user_id, credits_used')
      .eq('task_id', taskId)
      .single()

    if (error || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // If task is completed in database, return immediately
    if (task.status === 'completed' && task.result_url) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        result: { url: task.result_url },
      })
    }

    // If failed, return immediately
    if (task.status === 'failed') {
      return NextResponse.json({
        success: true,
        status: 'failed',
      })
    }

    // Query kie.ai API for status
    const response = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    })

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return NextResponse.json({
        success: true,
        status: 'pending',
      })
    }

    const data = await response.json()

    if (response.ok && data.code === 200) {
      const apiState = data.data?.state
      const resultJson = data.data?.resultJson

      if (apiState === 'success') {
        // Parse resultJson to get the URL
        let resultUrl = null
        if (resultJson) {
          try {
            const parsed = JSON.parse(resultJson)
            resultUrl = parsed.resultUrls?.[0]
          } catch (e) {
            console.error('Failed to parse resultJson:', e)
          }
        }

        if (resultUrl) {
          await supabase
            .from('upscale_tasks')
            .update({
              status: 'completed',
              result_url: resultUrl,
              completed_at: new Date().toISOString(),
            })
            .eq('task_id', taskId)

          return NextResponse.json({
            success: true,
            status: 'completed',
            result: { url: resultUrl },
          })
        }
      }

      if (apiState === 'failed') {
        // Refund credits on failure
        if (task.credits_used && task.user_id) {
          const { data: credits } = await supabase
            .from('credits')
            .select('amount')
            .eq('user_id', task.user_id)
            .single()

          if (credits) {
            await supabase
              .from('credits')
              .update({ amount: credits.amount + task.credits_used })
              .eq('user_id', task.user_id)
            await supabase
              .from('credit_transactions')
              .insert({
                user_id: task.user_id,
                amount: task.credits_used,
                type: 'refund',
                description: 'Processing failed - credit refund',
              })
          }
        }

        await supabase
          .from('upscale_tasks')
          .update({ status: 'failed' })
          .eq('task_id', taskId)

        return NextResponse.json({
          success: true,
          status: 'failed',
          refunded: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
    })
  } catch (error) {
    console.error('Task status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
