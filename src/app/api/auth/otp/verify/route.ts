import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/auth'

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

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('OTP Verify error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
