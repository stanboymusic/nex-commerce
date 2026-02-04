import { NextRequest, NextResponse } from 'next/server';
import { initPocketBase } from '@/lib/pocketbase';
import { sendPushToRole, sendPushToUser } from '@/lib/push';

export async function POST(req: NextRequest) {
  try {
    const pb = await initPocketBase(req);
    const user = pb.authStore.model as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await sendPushToUser(user.id, {
      title: 'Prueba de notificación',
      body: 'Si ves esto, el push funciona fuera de la app.',
      data: { url: '/orders' }
    });

    if (user.role === 'ADMIN') {
      await sendPushToRole('ADMIN', {
        title: 'Prueba de notificación (Admin)',
        body: 'El push para administradores está activo.',
        data: { url: '/orders' }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PUSH_TEST_ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to test push' }, { status: 500 });
  }
}
