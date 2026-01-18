import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('pb_auth')?.value;

    if (!token) {
        redirect('/login');
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}
