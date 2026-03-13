'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    History,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Bell,
    UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

import Link from 'next/link';

const SidebarItem = ({ icon: Icon, label, href, active = false }: { icon: any, label: string, href: string, active?: boolean }) => (
    <Link href={href}>
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${active
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            <Icon className="h-5 w-5" />
            <span className="font-medium text-sm">{label}</span>
        </div>
    </Link>
);

import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
        { icon: ClipboardList, label: "Schedule", href: "/dashboard/schedule" },
        { icon: History, label: "Tasks", href: "/dashboard/tasks" },
    ];

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
                    <div className="p-6">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Study Companion</span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <SidebarItem 
                                key={item.href}
                                icon={item.icon} 
                                label={item.label} 
                                href={item.href}
                                active={pathname === item.href}
                            />
                        ))}
                        <div className="pt-4 pb-2 px-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</span>
                        </div>
                        <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" active={pathname === '/dashboard/settings'} />
                    </nav>

                    <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                        <button
                            onClick={logout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium text-sm">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8">
                        <div className="relative w-96 font-medium">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search courses, materials..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div className="flex items-center space-x-6">
                            <button className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                                    3
                                </span>
                            </button>
                            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-800 pl-6 h-8">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">
                                        {user?.name || 'Student'}
                                    </p>
                                    <p className="text-xs text-gray-500 font-medium capitalize">
                                        Free Tier
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <UserCircle className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content Area */}
                    <section className="flex-1 overflow-y-auto p-8">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    </section>
                </main>
            </div>
        </ProtectedRoute>
    );
}
