import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://nex-users.vercel.app',
  'https://nex-admin.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin')
  const isAllowed = ALLOWED_ORIGINS.includes(origin || '')

  // Handle API routes CORS
  if (req.nextUrl.pathname.startsWith('/api')) {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const resp = new NextResponse(null, { status: 200 })
      resp.headers.set('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'https://nex-users.vercel.app')
      resp.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      resp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      resp.headers.set('Access-Control-Allow-Credentials', 'true')
      return resp
    }
  }

  // Auth Protection Logic
  const token = req.cookies.get('pb_auth')?.value
  const protectedRoutes = ['/user/checkout', '/profile', '/orders']

  if (protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  const response = NextResponse.next()

  // Add CORS headers to API responses
  if (req.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Access-Control-Allow-Origin', isAllowed ? (origin || '*') : 'https://nex-users.vercel.app')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next|static|favicon).*)'], // Removed exclusion of API
}
