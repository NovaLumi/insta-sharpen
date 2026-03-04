import { NextRequest, NextResponse } from 'next/server'

// Store for task results (in production, use Redis or database)
const taskResults = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Callback received:', body)

    const { taskId, status, result } = body

    if (taskId) {
      taskResults.set(taskId, {
        status,
        result,
        updatedAt: Date.now(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Callback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export for checking task results
export { taskResults }
