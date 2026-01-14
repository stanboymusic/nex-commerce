import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // Check for PocketBase auth cookie
  const token = req.cookies.get('pb_auth')?.value

  const protectedRoutes = ['/user/checkout', '/profile', '/orders']

  // If trying to access a protected route
  if (protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r))) {
    // If no token exists, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // We trust the existence of the cookie for middleware routing.
    // Actual validation happens in the Server Components / API via initPocketBase()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|favicon|api).*)'],
}
