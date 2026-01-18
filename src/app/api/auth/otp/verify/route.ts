import { NextRequest, NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 })
    }

    const pbAdmin = await getAdminPocketBase();
    
    let user;
    try {
      user = await pbAdmin.collection('users').getFirstListItem(`phone = "${phone}"`);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    if (!user || user.otpCode !== code) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    if (user.otpExpiry && new Date(user.otpExpiry) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 })
    }

    // Clear OTP after successful verification
    await pbAdmin.collection('users').update(user.id, {
      otpCode: null,
      otpExpiry: null,
    })

    // To log in, we set a temporary password and use it to get a valid PB token
    const tempPassword = Math.random().toString(36).slice(-10);
    await pbAdmin.collection('users').update(user.id, {
        password: tempPassword,
        passwordConfirm: tempPassword
    });

    const authData = await pbAdmin.collection('users').authWithPassword(user.email || `${user.id}@nex.local`, tempPassword);

    const response = NextResponse.json({
      user: authData.record,
      token: authData.token,
    })

    // Set standard PB cookie
    response.cookies.set('pb_auth', authData.token, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    })

    return response
  } catch (error: any) {
    console.error('OTP Verify error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
