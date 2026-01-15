import { NextResponse } from 'next/server'
import { getAdminPocketBase } from '@/lib/admin'

export async function GET() {
    try {
        const pb = await getAdminPocketBase();

        // Fetch stock alerts
        const alerts = await pb.collection('stock_alerts').getFullList({
            sort: '-created',
            expand: 'product'
        });

        // Fetch recent stock requests
        const requests = await pb.collection('stock_requests').getFullList({
            sort: '-created',
            expand: 'product,user'
        });

        const notifications = [
            ...alerts.map(a => ({
                id: a.id,
                title: `Stock Bajo: ${a.expand?.product?.name || 'Producto'}`,
                description: `Se ha detectado bajo inventario.`,
                type: 'warning',
                time: new Date(a.created).toLocaleString(),
                source: 'stock_alerts'
            })),
            ...requests.map(r => ({
                id: r.id,
                title: `Nueva Solicitud: ${r.expand?.product?.name || 'Producto'}`,
                description: `El cliente ${r.expand?.user?.name || 'Anónimo'} requiere stock.`,
                type: 'info',
                time: new Date(r.created).toLocaleString(),
                source: 'stock_requests'
            }))
        ];

        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json([], { status: 500 });
    }
}
