import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // 添加错误处理，避免网络问题导致整个请求失败
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protected routes - redirect to home if not logged in
    // if (!user && request.nextUrl.pathname.startsWith('/protected')) {
    //   const url = request.nextUrl.clone()
    //   url.pathname = '/'
    //   return NextResponse.redirect(url)
    // }
  } catch (error) {
    // 网络错误时继续，不阻止请求
    console.error('Supabase auth error in middleware:', error)
  }

  return supabaseResponse
}
