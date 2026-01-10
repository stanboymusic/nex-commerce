import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference } = await req.json()
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    // Update order status and set reference
    const order = await prisma.order.update({
      where: { 
        id,
        userId: payload.userId // Security: ensure user owns the order
      },
      data: {
        status: 'PAYMENT_REPORTED',
        paymentReference: reference,
        paymentReportedAt: new Date(),
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Report payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
