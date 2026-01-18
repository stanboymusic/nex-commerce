import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, passwordConfirm, phone } = await req.json()

    if (!name || (!email && !phone) || !password) {
      return NextResponse.json({ error: 'Name, Password and at least Email or Phone are required' }, { status: 400 })
    }

    const pb = await initPocketBase(req);

    const data = {
      email,
      emailVisibility: true,
      password,
      passwordConfirm: passwordConfirm || password, // Handle if frontend doesn't send verify
      name,
      phone // Assumption: you added 'phone' field to users collection or it's standard
    };

    const record = await pb.collection('users').create(data);

    // Auto login after registration
    const authData = await pb.collection('users').authWithPassword(email, password);

    const response = NextResponse.json({
      user: {
        id: record.id,
        name: record.name,
        email: record.email,
        role: 'USER',
      },
      token: authData.token,
    })

    // Set standard PB cookie
    response.cookies.set('pb_auth', pb.authStore.exportToCookie().split('=')[1].split(';')[0], {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    })

    return response
  } catch (error) {
    const err = error as { status?: number; data?: { message?: string; data?: any } };
    console.error('Registration error:', err)
    const status = err.status || 500
    const message = err.data?.message || 'Error creating user'
    // Extract formatted error from PocketBase if available
    const pbError = err.data?.data ? JSON.stringify(err.data.data) : message;

    return NextResponse.json({ error: pbError }, { status })
  }
}
