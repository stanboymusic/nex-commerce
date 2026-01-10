import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://nex-users.vercel.app',
  'https://nex-admin.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
]

export function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin')
  const isAllowed = ALLOWED_ORIGINS.includes(origin || '')

  return {
    'Access-Control-Allow-Origin': isAllowed ? (origin || 'https://nex-users.vercel.app') : 'https://nex-users.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export function handleCORS(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(request),
    })
  }
}
