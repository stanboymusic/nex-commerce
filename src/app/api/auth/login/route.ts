import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getPocketBase } from '@/lib/pocketbase'
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

    const pb = getPocketBase();

    // Authenticate with PocketBase
    const authData = await pb.collection('users').authWithPassword(email, password);

    const response = NextResponse.json({
      user: {
        id: authData.record.id,
        name: authData.record.name,
        email: authData.record.email,
        role: authData.record.role || 'USER',
      },
      token: authData.token,
    })

    // Set cookie using PocketBase's exportToCookie or manually
    // Ideally we use the same cookie name as our client side (pb_auth)
    response.cookies.set('pb_auth', pb.authStore.exportToCookie({ httpOnly: false }).split(';')[0].split('=')[1], {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    const corsHeadersObj = corsHeaders(req as NextRequest)
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    const status = error?.status || 500
    const message = error?.data?.message || 'Invalid credentials'

    const response = NextResponse.json({ error: message }, { status })
    const corsHeadersObj = corsHeaders(req as NextRequest)
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
}
