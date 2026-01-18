import { NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(req: Request) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, message } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const record = await pb.collection('stock_requests').create({
      product: productId,
      user: user.id,
      message: message || 'Cliente está requiriendo este producto.',
    })

    return NextResponse.json(record)
  } catch (error: any) {
    console.error('Stock request error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
