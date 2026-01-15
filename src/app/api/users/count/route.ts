import { NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function GET() {
    try {
        const pb = await getAdminPocketBase();
        // Use authRefresh or just check collection count
        // Requesting total users count
        const resultList = await pb.collection('users').getList(1, 1);

        return NextResponse.json({ count: resultList.totalItems });
    } catch (error: any) {
        console.error('Error fetching users count:', error);
        return NextResponse.json({ error: 'Internal server error', count: 0 }, { status: 500 });
    }
}
