import { NextRequest, NextResponse } from 'next/server'
import { initPocketBase } from '@/lib/pocketbase'
import { getAdminPocketBase } from '@/lib/admin'

export async function GET(req: NextRequest) {
    try {
        const pb = await initPocketBase(req);
        const user = pb.authStore.model;

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // We use admin credentials to fetch from collections that might be restricted
        const adminPb = await getAdminPocketBase();

        // Fetch stock alerts
        const alerts = await adminPb.collection('stock_alerts').getFullList({
            sort: '-created',
            expand: 'product'
        });

        // Fetch recent stock requests
        const requests = await adminPb.collection('stock_requests').getFullList({
            sort: '-created',
            expand: 'product,user'
        });

        const notifications = [
            ...alerts.map(a => ({
                id: a.id,
                title: `Low Stock: ${a.expand?.product?.name || 'Product'}`,
                description: `Low inventory detected.`,
                type: 'warning',
                time: new Date(a.created).toLocaleString(),
                source: 'stock_alerts'
            })),
            ...requests.map(r => ({
                id: r.id,
                title: `New Request: ${r.expand?.product?.name || 'Product'}`,
                description: `Customer ${r.expand?.user?.name || 'Anonymous'} requested stock.`,
                type: 'info',
                time: new Date(r.created).toLocaleString(),
                source: 'stock_requests'
            }))
        ];

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
