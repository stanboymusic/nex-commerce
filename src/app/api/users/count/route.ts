import { NextRequest, NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'
import { initPocketBase } from '@/lib/pocketbase'

export async function GET(req: NextRequest) {
    try {
        const pb = await initPocketBase(req);
        const user = pb.authStore.model;

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const adminPb = await getAdminPocketBase();
        const resultList = await adminPb.collection('users').getList(1, 1);

        return NextResponse.json({ count: resultList.totalItems });
    } catch (error: any) {
        console.error('Error fetching users count:', error);
        return NextResponse.json({ error: 'Internal server error', count: 0 }, { status: 500 });
    }
}
