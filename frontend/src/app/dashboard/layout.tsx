'use client';

import React from 'react';
import axios from 'axios';
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
    BarChart3,
    Camera
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Link from 'next/link';
import Image from 'next/image';
import { API_URL } from '@/lib/api';
import { client, getCachedJWT } from '@/lib/appwrite';

type NotificationItem = {
    $id: string;
    title: string;
    message: string;
    link?: string;
    type?: string;
    source?: string;
    is_read?: boolean;
    created_at?: string;
};

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'tutorbuddy';
const NOTIFICATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';

const SidebarItem = ({ icon: Icon, label, href, active = false, onClick }: { icon: LucideIcon, label: string, href: string, active?: boolean, onClick?: () => void }) => (
    <Link href={href} onClick={onClick}>
        <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${active
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-foreground/70 dark:text-cream/70 hover:bg-surface-2/70 dark:hover:bg-surface-2/30'
            }`}>
            <Icon className="h-5 w-5" />
            <span className="font-medium text-sm">{label}</span>
        </div>
    </Link>
);

import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, role } = useAuth();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);
    const [loadingNotifications, setLoadingNotifications] = React.useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
        { icon: BookOpen, label: "My Courses", href: "/dashboard/courses" },
        { icon: Camera, label: "OCR Scanner", href: "/dashboard/ocr" },
        { icon: ClipboardList, label: "Schedule", href: "/dashboard/schedule" },
        { icon: History, label: "Tasks", href: "/dashboard/tasks" },
        { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
        ...(role === 'lecturer' || role === 'admin'
            ? [{ icon: BarChart3, label: 'Lecturer View', href: '/dashboard/lecturer' }]
            : []),
        ...(role === 'admin'
            ? [{ icon: BarChart3, label: 'Admin View', href: '/dashboard/admin' }]
            : []),
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const fetchNotifications = React.useCallback(async () => {
        if (!user) return;

        try {
            setLoadingNotifications(true);
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch {
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoadingNotifications(false);
        }
    }, [user]);

    React.useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    React.useEffect(() => {
        if (!user) return;

        const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`;
        const unsubscribe = client.subscribe(channel, (response) => {
            const payload = response.payload as NotificationItem | undefined;
            if (!payload || payload.$id && payload.$id.startsWith('temp')) return;

            if (payload.is_read === false && payload.title) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification(payload.title, {
                            body: payload.message,
                            icon: '/favicon.ico'
                        });
                    } catch {
                        // ignore browser notification errors
                    }
                }
            }

            fetchNotifications();
        });

        return () => {
            unsubscribe();
        };
    }, [fetchNotifications, user]);

    const handleNotificationClick = async (notification: NotificationItem) => {
        try {
            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/notifications/${notification.$id}/read`, {}, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
        } catch {
            // ignore read errors
        }
    };

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-linear-to-br from-primary/10 via-background to-secondary/10 text-foreground overflow-hidden relative">
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
                <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-surface/95 dark:bg-surface-2/95 border-r border-primary/10 dark:border-primary/20 flex flex-col z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Image src="/logo.png" alt="TutorBuddy Logo" width={36} height={36} className="h-9 w-9 rounded-lg object-contain shadow-md" />
                            <span className="text-xl font-bold text-foreground dark:text-cream">Study Companion</span>
                        </div>
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            aria-label="Close sidebar"
                            title="Close sidebar"
                            className="lg:hidden text-foreground/60"
                        >
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
                            <span className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Account</span>
                        </div>
                        <SidebarItem icon={Settings} label="Settings" href="/dashboard/settings" active={pathname === '/dashboard/settings'} onClick={() => setIsSidebarOpen(false)} />
                    </nav>

                    <div className="p-4 border-t border-primary/10 dark:border-primary/20">
                        <button
                            type="button"
                            onClick={logout}
                            title="Sign out"
                            aria-label="Sign out"
                            className="flex items-center space-x-3 w-full px-4 py-3 text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                        >
                            <LogOut className="h-5 w-5" />
                            <span className="font-medium text-sm">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden w-full">
                    {/* Header */}
                    <header className="relative h-16 bg-surface/90 dark:bg-surface-2/90 border-b border-primary/10 dark:border-primary/20 flex items-center justify-between px-4 lg:px-8 shrink-0">
                        <div className="flex items-center space-x-4">
                            <button 
                                type="button"
                                onClick={toggleSidebar}
                                aria-label="Open sidebar"
                                title="Open sidebar"
                                className="lg:hidden p-2 hover:bg-surface-2/70 dark:hover:bg-surface-2/30 rounded-lg text-foreground/70 dark:text-cream/70"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <div className="relative hidden md:block w-64 lg:w-96 font-medium">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses, materials..."
                                    className="w-full pl-10 pr-4 py-2 bg-background/70 dark:bg-background/20 border-none rounded-lg text-sm focus:ring-2 focus:ring-secondary transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 lg:space-x-6">
                            <button
                                type="button"
                                aria-label="Notifications"
                                title="Notifications"
                                onClick={() => setShowNotifications((prev) => !prev)}
                                className="relative p-2 text-foreground/60 hover:text-foreground dark:text-cream/60 dark:hover:text-cream transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                <span
                                    aria-hidden="true"
                                    className="absolute top-1 right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900"
                                >
                                    {unreadCount}
                                </span>
                            </button>
                            {showNotifications && (
                                <div className="absolute right-4 top-16 z-50 w-80 rounded-3xl border border-primary/10 bg-surface/95 dark:bg-surface-2/95 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-foreground dark:text-cream">Notifications</p>
                                            <p className="text-xs text-foreground/50 dark:text-cream/50">Your study reminders, reports, and course alerts</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowNotifications(false)}
                                            aria-label="Close notifications"
                                            title="Close notifications"
                                            className="text-foreground/40 hover:text-foreground dark:text-cream/40 dark:hover:text-cream"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {loadingNotifications ? (
                                            <div className="rounded-2xl border border-primary/10 bg-background/70 dark:bg-background/20 px-3 py-2 text-sm text-foreground/60 dark:text-cream/60">
                                                Loading notifications...
                                            </div>
                                        ) : notifications.length > 0 ? (
                                            notifications.map((item) => (
                                                <Link
                                                    key={item.$id}
                                                    href={item.link || '/dashboard'}
                                                    onClick={() => {
                                                        handleNotificationClick(item);
                                                        setShowNotifications(false);
                                                    }}
                                                    className={`block rounded-2xl border px-3 py-3 text-sm transition-all hover:border-secondary/30 hover:bg-surface/90 dark:hover:bg-surface-2/60 ${
                                                        item.is_read
                                                            ? 'border-primary/10 bg-background/60 text-foreground/80 dark:bg-background/20 dark:text-cream/70'
                                                            : 'border-secondary/20 bg-secondary/10 text-foreground dark:bg-secondary/10 dark:text-cream'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <p className="font-bold">{item.title}</p>
                                                            <p className="text-xs text-foreground/60 dark:text-cream/60 leading-relaxed">{item.message}</p>
                                                        </div>
                                                        {!item.is_read && (
                                                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-secondary flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="rounded-2xl border border-primary/10 bg-background/70 dark:bg-background/20 px-3 py-2 text-sm text-foreground/60 dark:text-cream/60">
                                                No notifications yet. Your weekly reports and course reminders will appear here.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center space-x-3 border-l border-primary/10 dark:border-primary/20 pl-4 lg:pl-6 h-8">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-semibold text-foreground dark:text-cream truncate max-w-[120px]">
                                        {user?.name || 'Student'}
                                    </p>
                                    <p className="text-xs text-foreground/50 font-medium capitalize">
                                        {role}
                                    </p>
                                </div>
                                <div className="h-8 w-8 bg-secondary/15 rounded-full flex items-center justify-center">
                                    <UserCircle className="h-5 w-5 text-secondary" />
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
