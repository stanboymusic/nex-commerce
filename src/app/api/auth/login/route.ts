import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'
import { corsHeaders, handleCORS } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCORS(request)
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email || undefined,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    const corsHeadersObj = corsHeaders(req as NextRequest)
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    const corsHeadersObj = corsHeaders(req as NextRequest)
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
}
