import { NextRequest, NextResponse } from 'next/server'

const KIE_API_KEY = process.env.KIE_API_KEY || 'a0e8c3e52d72aca03aa659ad1f067757'
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, upscaleFactor } = body

    if (!imageUrl || !upscaleFactor) {
      return NextResponse.json(
        { error: 'Missing imageUrl or upscaleFactor' },
        { status: 400 }
      )
    }

    // Create task with kie.ai API
    const response = await fetch(`${KIE_API_URL}/createTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'topaz/image-upscale',
        callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/callback`,
        input: {
          image_url: imageUrl,
          upscale_factor: upscaleFactor,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Kie.ai API error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to create upscale task' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      taskId: data.data?.taskId || data.taskId,
    })
  } catch (error) {
    console.error('Upscale API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Poll task status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      )
    }

    const response = await fetch(`${KIE_API_URL}/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Kie.ai API error:', data)
      return NextResponse.json(
        { error: data.message || 'Failed to get task status' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      status: data.data?.status || data.status,
      result: data.data?.result || data.result,
    })
  } catch (error) {
    console.error('Task status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
