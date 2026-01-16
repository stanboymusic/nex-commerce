import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { initPocketBase } from '@root/lib/pocketbase';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pb = await initPocketBase();

    if (!pb.authStore.isValid || (pb.authStore.model?.role !== 'ADMIN' && (pb.authStore as any).collectionName !== '_superusers')) {
        redirect('/login');
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
