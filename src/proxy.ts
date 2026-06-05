import { NextResponse, userAgent, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Skip mobile guard in dev so you can test on desktop
  if (process.env.NODE_ENV !== 'development') {
    const { device } = userAgent(request)
    const isMobile = device.type === 'mobile' || device.type === 'tablet'

    if (!isMobile && request.nextUrl.pathname !== '/desktop-blocked') {
      const url = request.nextUrl.clone()
      url.pathname = '/desktop-blocked'
      return NextResponse.redirect(url)
    }
    if (isMobile && request.nextUrl.pathname === '/desktop-blocked') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
