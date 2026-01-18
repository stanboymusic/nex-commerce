import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('pb_auth')?.value
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isRootPath = req.nextUrl.pathname === '/'

  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (isRootPath && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon).*)'],
}
