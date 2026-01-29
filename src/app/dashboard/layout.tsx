import type { Metadata } from 'next';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
    title: 'Dashboard | IntelliDoc',
    description: 'Manage your documents efficiently',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 relative selection:bg-indigo-100 selection:text-indigo-700">

            {/* Sidebar - Fixed Position */}
            <Sidebar />

            {/* Main Content Area - Offset by Sidebar Width */}
            <div className="ml-64 flex min-h-screen flex-col transition-all duration-300">

                {/* Sticky Header */}
                <Header />

                {/* Dynamic Page Content */}
                <main className="flex-1 p-6 md:p-8 animate-in fade-in duration-500 slide-in-from-bottom-2">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}
