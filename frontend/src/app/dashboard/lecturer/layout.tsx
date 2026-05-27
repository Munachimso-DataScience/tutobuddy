'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
            {children}
        </ProtectedRoute>
    );
}
