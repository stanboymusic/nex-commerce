import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, passwordConfirm, phone } = await req.json()

    if (!name || (!email && !phone) || !password) {
      return NextResponse.json({ error: 'Name, Password and at least Email or Phone are required' }, { status: 400 })
    }

    const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://nexcommerce.fly.dev');

    const data = {
      email,
      emailVisibility: true,
      password,
      passwordConfirm: passwordConfirm || password,
      name,
      phone,
      role: 'USER' // Ensure default role is USER
    };

    const record = await pb.collection('users').create(data);

    // Auto login after registration
    const authData = await pb.collection('users').authWithPassword(email, password);

    const response = NextResponse.json({
      user: {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role || 'USER',
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
  } catch (error: any) {
    console.error('Registration error:', error)
    const status = error.status || 500
    const message = error.data?.message || 'Error creating user'
    
    // Extract detailed validation errors if available
    let detailedError = message;
    if (error.data?.data) {
        const firstError = Object.values(error.data.data)[0] as { message: string };
        if (firstError?.message) {
            detailedError = firstError.message;
        }
    }

    return NextResponse.json({ error: detailedError }, { status })
  }
}
