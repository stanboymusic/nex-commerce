import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json()

    if (!name || (!email && !phone)) {
      return NextResponse.json({ error: 'Name and at least Email or Phone are required' }, { status: 400 })
    }

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    if (phone) {
      const existingUser = await prisma.user.findUnique({
        where: { phone },
      })
      if (existingUser) {
        return NextResponse.json({ error: 'Phone number already exists' }, { status: 400 })
      }
    }

    const hashedPassword = password ? await hashPassword(password) : null

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
      },
    })

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: user.email || undefined,
      phone: user.phone || undefined,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
