'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, GraduationCap, ShieldAlert } from 'lucide-react';
import { getLecturerSummary } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';

type LecturerSummary = {
    lecturer?: {
        full_name?: string;
        role?: string;
        department?: string;
        class_group?: string;
        assigned_courses?: string[];
    };
    scope?: {
        students?: number;
        tracked_courses?: number;
        tracked_quizzes?: number;
    };
    performance?: {
        average_score?: number;
        readiness?: number;
        total_study_minutes?: number;
        course_stats?: Array<{
            course_id?: string;
            title?: string;
            attempts?: number;
            avg_score?: number;
            readiness?: number;
        }>;
        class_stats?: Array<{
            name?: string;
            students?: number;
            quizzes?: number;
            avg_score?: number;
            study_minutes?: number;
        }>;
        top_weaknesses?: Array<{
            topic?: string;
            misses?: number;
        }>;
    };
    recommendations?: string[];
};

export default function LecturerDashboard() {
    const [summary, setSummary] = useState<LecturerSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                setLoading(true);
                setError(null);
                const jwt = await getCachedJWT();
                const data = await getLecturerSummary(jwt);
                setSummary(data);
            } catch (err) {
                console.error('Failed to load lecturer summary:', err);
                setError('Unable to load lecturer dashboard data right now.');
            } finally {
                setLoading(false);
            }
        };

        loadSummary();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                    <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="h-28">
                            <Skeleton className="h-4 w-24 mb-4" />
                            <Skeleton className="h-8 w-16" />
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
                    <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Lecturer dashboard unavailable</h1>
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
                    <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Aggregated performance by course, class, and weakness.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <h3 className="font-semibold">Tracked Students</h3>
                            <p className="text-3xl font-bold">{summary?.scope?.students ?? 0}</p>
                        </Card>
                        <Card>
                            <h3 className="font-semibold">Tracked Courses</h3>
                            <p className="text-3xl font-bold">{summary?.scope?.tracked_courses ?? 0}</p>
                        </Card>
                        <Card>
                            <h3 className="font-semibold">Average Score</h3>
                            <p className="text-3xl font-bold">{summary?.performance?.average_score ?? 0}%</p>
                        </Card>
                        <Card>
                            <h3 className="font-semibold">Readiness</h3>
                            <p className="text-3xl font-bold">{summary?.performance?.readiness ?? 0}%</p>
                        </Card>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <Card>
                            <h3 className="font-semibold mb-3">Teaching Scope</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span>Tracked quizzes</span>
                                    <Badge variant="secondary">{summary?.scope?.tracked_quizzes ?? 0}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Total study minutes</span>
                                    <Badge variant="secondary">{summary?.performance?.total_study_minutes ?? 0}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Lecturer</span>
                                    <Badge variant="secondary">{summary?.lecturer?.full_name || 'Unknown'}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Department</span>
                                    <Badge variant="secondary">{summary?.lecturer?.department || 'General'}</Badge>
                                </div>
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-semibold mb-3">Assigned Courses</h3>
                            <div className="flex flex-wrap gap-2">
                                {(summary?.lecturer?.assigned_courses || []).length > 0 ? (
                                    summary?.lecturer?.assigned_courses?.map((course) => (
                                        <Badge key={course} variant="secondary">{course}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No assigned courses found.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="courses">
                    <div className="grid gap-4">
                        {(summary?.performance?.course_stats || []).length > 0 ? (
                            summary?.performance?.course_stats?.map((course) => (
                                <Card key={`${course.course_id}-${course.title}`}>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{course.title || 'Untitled course'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {course.attempts ?? 0} quizzes attempted
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Avg {course.avg_score ?? 0}%</Badge>
                                            <Badge variant="outline">Readiness {course.readiness ?? 0}%</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <p className="text-sm text-muted-foreground">
                                    No course performance data is available yet.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="classes">
                    <div className="grid gap-4">
                        {(summary?.performance?.class_stats || []).length > 0 ? (
                            summary?.performance?.class_stats?.map((group) => (
                                <Card key={group.name}>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{group.name || 'Unassigned'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {group.students ?? 0} students, {group.quizzes ?? 0} quizzes
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Avg {group.avg_score ?? 0}%</Badge>
                                            <Badge variant="outline">{group.study_minutes ?? 0} min</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <p className="text-sm text-muted-foreground">
                                    No class group data is available yet.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="weaknesses">
                    <div className="grid gap-4">
                        {(summary?.performance?.top_weaknesses || []).length > 0 ? (
                            summary?.performance?.top_weaknesses?.map((weakness) => (
                                <Card key={weakness.topic}>
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold">{weakness.topic || 'General revision'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {weakness.misses ?? 0} missed responses
                                            </p>
                                        </div>
                                        <Badge variant="secondary">{weakness.misses ?? 0}</Badge>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <p className="text-sm text-muted-foreground">
                                    No weakness clusters have been recorded yet.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="recommendations">
                    <div className="grid gap-4">
                        {(summary?.recommendations || []).length > 0 ? (
                            summary?.recommendations?.map((recommendation, index) => (
                                <Card key={`${index}-${recommendation}`}>
                                    <p className="text-sm leading-relaxed">{recommendation}</p>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <p className="text-sm text-muted-foreground">
                                    No recommendations available yet.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
