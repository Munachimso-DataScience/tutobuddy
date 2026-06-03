'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, GraduationCap, ShieldAlert } from 'lucide-react';
import { getStudentClasses } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';
import Link from 'next/link';

export default function StudentClasses() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadClasses = async () => {
            try {
                setLoading(true);
                setError(null);
                const jwt = await getCachedJWT();
                const fetchedClasses = await getStudentClasses(jwt);
                setClasses(fetchedClasses || []);
            } catch (err) {
                console.error('Failed to load student classes:', err);
                setError('Unable to load your classes right now.');
            } finally {
                setLoading(false);
            }
        };

        loadClasses();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                    <h1 className="text-2xl font-bold">My Classes</h1>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-48">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-20 w-full mt-4" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
                    <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-500" />
                    <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Unable to load classes</h1>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <GraduationCap className="h-6 w-6 text-secondary" />
                <div>
                    <h1 className="text-2xl font-bold">My Classes</h1>
                    <p className="text-sm text-muted-foreground">
                        Official course offerings and materials uploaded by your lecturers.
                    </p>
                </div>
            </div>

            {classes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((cls) => (
                        <Link key={cls.$id} href={`/dashboard/classes/${cls.$id}`}>
                            <Card className="h-full cursor-pointer transition-all hover:border-secondary/50 hover:shadow-md flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-lg leading-tight">{cls.title || 'Untitled Class'}</h3>
                                    {cls.status === 'active' && <Badge variant="secondary" className="text-[10px]">Active</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground font-medium mb-4">
                                    {cls.code} {cls.term ? `• ${cls.term}` : ''}
                                </p>
                                {cls.description && (
                                    <p className="text-sm text-foreground/80 line-clamp-3 mb-4 flex-1">
                                        {cls.description}
                                    </p>
                                )}
                                <div className="mt-auto pt-4 border-t border-border flex flex-wrap gap-2">
                                    {cls.department && <Badge variant="outline" className="text-[10px]">{cls.department}</Badge>}
                                    {cls.class_group && <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">{cls.class_group}</Badge>}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-20 text-center flex flex-col items-center">
                    <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <GraduationCap className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No classes yet</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        You haven't been enrolled in any official classes yet. Check back later or contact your lecturer.
                    </p>
                </div>
            )}
        </div>
    );
}
