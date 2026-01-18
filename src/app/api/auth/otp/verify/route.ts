import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function POST(req: Request) {
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

    // To "log in" via PocketBase without a password, we can use the admin to generate a token
    // Actually, PocketBase doesn't have a direct "impersonate" but we can use the admin
    // to get a token if we use authWithPassword with a known password.
    // However, for OTP we just want to return the user and a token.
    // If we want a valid PB token, we might need a workaround.
    
    // For now, let's assume we can use the admin PB to create a token or just return a signed one 
    // BUT the user wants to "Eliminar JWT manual".
    
    // If we want a real PB token, we might need to set a temporary password and use it.
    const tempPassword = Math.random().toString(36).slice(-10);
    await pbAdmin.collection('users').update(user.id, {
        password: tempPassword,
        passwordConfirm: tempPassword
    });

    const authData = await pbAdmin.collection('users').authWithPassword(user.email || user.id + '@nex.local', tempPassword);

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
