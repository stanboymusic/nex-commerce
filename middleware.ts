import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  const protectedRoutes = ['/checkout', '/profile', '/orders']

  if (protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      verifyToken(token)
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|favicon|api).*)'],
}
