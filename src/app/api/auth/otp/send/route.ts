import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateOTP } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const otp = generateOTP()
    const expiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Upsert user or just find and update? 
    // In a private marketplace, maybe we only allow existing users.
    // But let's assume we can create them if they don't exist for now, 
    // or at least handle the 'not found' case gracefully.
    
    let user = await prisma.user.findUnique({
      where: { phone }
    })

    if (!user) {
      // For this demo, let's create a placeholder user if they don't exist
      user = await prisma.user.create({
        data: {
          phone,
          name: `User ${phone}`,
          otpCode: otp,
          otpExpiry: expiry,
        }
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: otp,
          otpExpiry: expiry,
        }
      })
    }

    // SIMULATION: In a real app, send SMS via Twilio/etc.
    console.log(`[SMS Simulation] To: ${phone}, Message: Your NexCommerce code is ${otp}`)

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('OTP Send error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
