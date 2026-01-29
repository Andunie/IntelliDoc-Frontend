"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Search, Settings, ShieldCheck, FileInput } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workbench', href: '/dashboard/workbench', icon: FileText },
    { name: 'Search', href: '/dashboard/search', icon: Search },
    { name: 'Audit Logs', href: '/dashboard/audit', icon: ShieldCheck },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col fixed inset-y-0 z-50 bg-slate-900 text-white shadow-xl transition-all duration-300">
            {/* Logo Section */}
            <div className="flex h-16 items-center border-b border-slate-800 px-6">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
                    <div className="bg-indigo-500 p-1.5 rounded-lg">
                        <FileInput className="h-5 w-5 text-white" />
                    </div>
                    <span>IntelliDoc</span>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1 px-3 py-6">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out',
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'h-5 w-5 transition-colors',
                                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section (Optional: User concise info or version) */}
            <div className="border-t border-slate-800 p-4">
                <div className="rounded-lg bg-slate-800/50 p-3">
                    <p className="text-xs text-slate-400 font-medium">IntelliDoc Enterprise</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">v1.2.0-beta</p>
                </div>
            </div>
        </div>
    );
}
