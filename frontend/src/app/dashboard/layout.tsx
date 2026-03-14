'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    History,
    Settings,
    LogOut,
    Search,
    Bell,
    UserCircle,
    Menu,
    X,
    ChevronLeft,
    BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Link from 'next/link';

const SidebarItem = ({ icon: Icon, label, href, active = false, onClick }: { icon: any, label: string, href: string, active?: boolean, onClick?: () => void }) => (
    <Link href={href} onClick={onClick}>
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
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
        { icon: ClipboardList, label: "Schedule", href: "/dashboard/schedule" },
        { icon: History, label: "Tasks", href: "/dashboard/tasks" },
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
                {/* Mobile Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">Study Companion</span>
                        </div>
                        <button onClick={toggleSidebar} className="lg:hidden text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <SidebarItem 
                                key={item.href}
                                icon={item.icon} 
                                label={item.label} 
                                href={item.href}
                                active={pathname === item.href}
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        ))}
                        <div className="pt-4 pb-2 px-4">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</span>
                        </div>
                        <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" active={pathname === '/dashboard/settings'} onClick={() => setIsSidebarOpen(false)} />
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
                <main className="flex-1 flex flex-col overflow-hidden w-full">
                    {/* Header */}
                    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="relative hidden md:block w-64 lg:w-96 font-medium">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses, materials..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 lg:space-x-6">
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900">
                                    3
                                </span>
                            </button>
                            <div className="flex items-center space-x-3 border-l border-gray-200 dark:border-gray-800 pl-4 lg:pl-6 h-8">
                                <div className="hidden sm:block text-right">
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
                    <section className="flex-1 overflow-y-auto p-4 lg:p-8">
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
