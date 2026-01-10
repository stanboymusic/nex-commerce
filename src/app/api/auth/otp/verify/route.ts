import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import { corsHeaders, handleCORS } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  return handleCORS(request)
}

export async function POST(req: Request) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user || user.otpCode !== code) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 })
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
      }
    })

    const token = signToken({
      userId: user.id,
      role: user.role,
      phone: user.phone!,
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
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
    console.error('OTP Verify error:', error)
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    const corsHeadersObj = corsHeaders(req as NextRequest)
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
}
