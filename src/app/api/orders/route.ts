import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { items, total, paymentMethod, currency, address, notes } = await req.json()

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    if (!address || !paymentMethod || !currency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if any item is a preorder
    const isPreorder = items.some((item: any) => item.isPreorder)

    // Transaction to ensure data consistency
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: payload.userId,
          total,
          isPreorder,
          paymentMethod,
          currency,
          address,
          notes,
          status: 'PENDING_PAYMENT',
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      })

      // 2. Update stock for non-preorder items
      for (const item of items) {
        if (!item.isPreorder) {
          await tx.product.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }

      return newOrder
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: payload.role === 'ADMIN' ? {} : { userId: payload.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        },
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
