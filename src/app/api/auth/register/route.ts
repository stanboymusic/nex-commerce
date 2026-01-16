import { NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(req: Request) {
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

    return NextResponse.json({
      user: {
        id: record.id,
        name: record.name,
        email: record.email,
        role: 'USER',
      },
      token: authData.token,
    })
  } catch (error: any) {
    console.error('Registration error:', error)
    const status = error?.status || 500
    const message = error?.data?.message || 'Error creating user'
    // Extract formatted error from PocketBase if available
    const pbError = error?.data?.data ? JSON.stringify(error.data.data) : message;

    return NextResponse.json({ error: pbError }, { status })
  }
}
