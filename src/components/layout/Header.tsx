"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { authHelper, UserProfile } from '@/lib/auth-helper';

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const getPageTitle = (path: string) => {
        if (path.includes('/dashboard/documents') || path.includes('/dashboard/workbench')) return 'Workbench';
        if (path.includes('/dashboard/search')) return 'Search';
        if (path.includes('/dashboard/audit')) return 'Audit Logs';
        if (path.includes('/dashboard/settings')) return 'Settings';
        return 'Dashboard';
    };

    const pageTitle = getPageTitle(pathname || '');

    useEffect(() => {
        // Get user directly from token
        const userProfile = authHelper.getUserFromToken();
        if (userProfile) {
            setUser(userProfile);
        }
    }, []);

    const handleLogout = () => {
        authHelper.logout();
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md transition-all">

            {/* Left: Breadcrumbs / Title */}
            <div className="flex items-center gap-4">
                {/* Mobile menu trigger could go here */}
                <button className="lg:hidden p-1 text-slate-500 hover:text-slate-700">
                    <Menu className="h-6 w-6" />
                </button>

                <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                    {pageTitle}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                {/* User Profile */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-4 shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-medium text-slate-700 leading-none">
                                {user?.fullName || 'Guest User'}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-none mt-1">{user?.role || 'User'}</p>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-slate-50">
                                <p className="text-sm font-medium text-slate-900">{user?.fullName || 'Guest'}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email || 'No email'}</p>
                            </div>
                            <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <User className="h-4 w-4" /> Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="h-4 w-4" /> Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
