import { NextResponse } from "next/server"
import { generateAccessToken, getPayPalApiBase } from "@/lib/paypal"
import { getAuthorizedDebugUser, isValidDebugSlug } from "@/lib/debug-auth"

interface RouteContext {
  params: Promise<{
    slug: string
  }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params

  if (!isValidDebugSlug(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const user = await getAuthorizedDebugUser()
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const accessToken = await generateAccessToken()

    return NextResponse.json({
      ok: true,
      environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
      apiBase: getPayPalApiBase(),
      tokenReceived: Boolean(accessToken),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
        apiBase: getPayPalApiBase(),
      },
      { status: 500 }
    )
  }
}
