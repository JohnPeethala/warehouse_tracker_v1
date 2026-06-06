import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/desktop-blocked'

  // Unauthenticated → public page
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on login or root → route by role
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'ground'
    const url = request.nextUrl.clone()
    url.pathname = role === 'ground' ? '/mobile/gt' : '/mobile/supervisor'
    return NextResponse.redirect(url)
  }

  // Role-guard: ground cannot access supervisor view
  if (user && request.nextUrl.pathname.startsWith('/mobile/supervisor')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'ground') {
      const url = request.nextUrl.clone()
      url.pathname = '/mobile/gt'
      return NextResponse.redirect(url)
    }
  }

  // Role-guard: supervisor/admin cannot access GT view
  if (user && request.nextUrl.pathname.startsWith('/mobile/gt')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'ground') {
      const url = request.nextUrl.clone()
      url.pathname = '/mobile/supervisor'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
