import { NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function GET() {
    try {
        const pb = await getAdminPocketBase();
        const records = await pb.collection('users').getFullList({
            sort: '-created',
        });

        const users = records.map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            created: r.created
        }));

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
