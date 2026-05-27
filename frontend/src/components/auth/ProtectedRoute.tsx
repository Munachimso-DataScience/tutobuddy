'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type AllowedRole = 'student' | 'lecturer' | 'admin';

export default function ProtectedRoute({
    children,
    allowedRoles
}: {
    children: React.ReactNode;
    allowedRoles?: AllowedRole[];
}) {
    const { user, loading, role } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (!loading && user && allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role as AllowedRole)) {
            router.push('/dashboard');
        }
    }, [user, loading, router, allowedRoles, role]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role as AllowedRole)) {
        return null;
    }

    return <>{children}</>;
}
