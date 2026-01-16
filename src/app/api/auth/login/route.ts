import { NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    const pb = new PocketBase(process.env.POCKETBASE_URL || 'http://127.0.0.1:8090')

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
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error?.data?.message || 'Credenciales inválidas' },
      { status: error?.status || 401 }
    )
  }
}
