import { NextRequest, NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const pbAdmin = await getAdminPocketBase();
    
    // Find user by phone
    let user;
    try {
      user = await pbAdmin.collection('users').getFirstListItem(`phone = "${phone}"`);
    } catch (e) {
      // User not found
    }

    if (!user) {
      // Create user if not exists
      const randomPass = Math.random().toString(36).slice(-10);
      user = await pbAdmin.collection('users').create({
        phone,
        name: `User ${phone}`,
        otpCode: otp,
        otpExpiry: expiry,
        role: 'USER',
        password: randomPass,
        passwordConfirm: randomPass,
      });
    } else {
      await pbAdmin.collection('users').update(user.id, {
        otpCode: otp,
        otpExpiry: expiry,
      })
    }

    // SIMULATION: In a real app, send SMS via Twilio/etc.
    console.log(`[SMS Simulation] To: ${phone}, Message: Your NexCommerce code is ${otp}`)

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error: any) {
    console.error('OTP Send error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
