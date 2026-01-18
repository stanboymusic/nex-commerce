import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev')

    // Standard auth
    const authData = await pb.collection('users').authWithPassword(email, password)

    const response = NextResponse.json({
      user: authData.record,
      token: authData.token,
    })

    // Set standard PB cookie
    response.cookies.set('pb_auth', pb.authStore.exportToCookie().split('=')[1].split(';')[0], {
      path: '/',
      httpOnly: false, // Accessible by client and server
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    })

    return response
  } catch (error) {
    const err = error as { status?: number; data?: { message?: string } };
    console.error('Login error:', err)
    return NextResponse.json(
      { error: err.data?.message || 'Invalid credentials' },
      { status: err.status || 401 }
    )
  }
}
