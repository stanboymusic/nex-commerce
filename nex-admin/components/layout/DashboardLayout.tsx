import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import RealtimeNotifications from '@/components/notifications/RealtimeNotifications';
import PushSubscriptionManager from '@/components/notifications/PushSubscriptionManager';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-muted">
            <Sidebar />
            <Topbar />
            <main className="ml-64 p-8">
                {children}
            </main>
            <RealtimeNotifications />
            <PushSubscriptionManager />
        </div>
    );
};
