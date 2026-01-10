import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value

  const loginPath = '/login'
  const isLoginPage = req.nextUrl.pathname === loginPath

  if (isLoginPage) {
    if (token) {
      try {
        const payload = verifyToken(token)
        if (payload?.role === 'ADMIN') {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      } catch {
        // Token invalid, continue to login
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const payload = verifyToken(token)

    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('https://nex-users.vercel.app', req.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|static|favicon).*)'],
}
