import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { corsHeaders, handleCORS } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCORS(request)
}

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('token', '', { maxAge: 0, path: '/' })
  
  const corsHeadersObj = corsHeaders(req as NextRequest)
  Object.entries(corsHeadersObj).forEach(([key, value]) => {
    res.headers.set(key, value)
  })
  
  return res
}
