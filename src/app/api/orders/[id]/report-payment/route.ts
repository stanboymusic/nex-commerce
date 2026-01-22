import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pb = await initPocketBase(req);
    const user = pb.authStore.model;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData();
    const reference = formData.get('reference') as string;
    const file = formData.get('paymentProof') as File;

    if (!reference && !file) {
      return NextResponse.json({ error: 'Reference or Payment Proof is required' }, { status: 400 })
    }

    // Fetch the order first to check ownership if not admin
    const order = await pb.collection('orders').getOne(id);

    if (order.user !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update order payment status and set reference/file
    // PocketBase handles file upload via formData automatically if passed to update/create
    const updatedOrder = await pb.collection('orders').update(id, formData);

    // Ensure status is updated if not passed explicitly in form data (it won't be from client usually)
    // We do a second update or rely on client sending everything. 
    // Safest is to force fields we want associated with "Reporting".
    // But update(id, formData) will only update keys present in formData.
    // We want to force paymentStatus = 'REPORTED' and paymentReportedAt = now.

    // Since we consumed formData, we need to construct a new object or append to it if we were proxying.
    // But pb.collection.update takes an object or FormData.
    // If we pass formData directly, we can't easily add system fields like "paymentReportedAt" unless we append to that FormData.

    formData.append('paymentStatus', 'REPORTED');
    formData.append('paymentReportedAt', new Date().toISOString());

    const result = await pb.collection('orders').update(id, formData);

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Report payment error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
