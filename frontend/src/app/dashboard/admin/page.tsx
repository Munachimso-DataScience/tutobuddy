'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getAdminSummary } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';
import UserManagement from './UserManagement';
import QuestionTemplateManagement from './QuestionTemplateManagement';
import ContentManagement from './ContentManagement';

type AdminSummary = {
    user?: {
        total_users?: number;
        active_users?: number;
        active_rate?: number;
        average_streak?: number;
        streak_distribution?: Record<string, number>;
        quiz_completion_rate?: number;
        average_quiz_score?: number;
        role_breakdown?: {
            student?: number;
            lecturer?: number;
            admin?: number;
        };
        daily_weekly_activity?: {
            days?: Record<string, number>;
            study_sessions_7d?: number;
            quiz_events_7d?: number;
            login_events_7d?: number;
        };
    };
    system?: {
        total_ai_requests?: number;
        quiz_generation_success_rate?: number;
        notification_sends?: number;
        daily_active_users?: number;
        avg_response_time?: number;
        source?: string;
    };
    health?: {
        ai?: {
            configured?: boolean;
            endpoint?: string;
            reachable?: boolean;
        };
        smtp?: {
            configured?: boolean;
            ready?: boolean;
            host?: string;
            port?: number;
            from_email?: string;
            from_name?: string;
        };
        scheduler?: {
            running?: boolean;
            startedAt?: string;
            lastRunAt?: string;
            jobs?: string[];
        };
        appwrite?: {
            configured?: boolean;
            endpoint?: string;
            project_id?: string;
        };
    };
    content?: {
        total_courses?: number;
        total_materials?: number;
        total_quizzes?: number;
        flagged_materials?: number;
        duplicate_content?: number;
    };
    templates?: {
        total_templates?: number;
        active_templates?: number;
        inactive_templates?: number;
    };
};

export default function AdminDashboard() {
    const [summary, setSummary] = useState<AdminSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                setLoading(true);
                setError(null);
                const jwt = await getCachedJWT();
                const data = await getAdminSummary(jwt);
                setSummary(data);
            } catch (err) {
                console.error('Failed to load admin summary:', err);
                setError('Unable to load admin dashboard data right now.');
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
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
                    <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Admin dashboard unavailable</h1>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <Card className="h-full">
                            <h2 className="font-semibold">Total Users</h2>
                            <p className="text-3xl font-bold">{summary?.user?.total_users ?? 0}</p>
                        </Card>
                        <Card className="h-full">
                            <h2 className="font-semibold">Active Users</h2>
                            <p className="text-3xl font-bold">{summary?.user?.active_users ?? 0}</p>
                        </Card>
                        <Card className="h-full">
                            <h2 className="font-semibold">Active Rate</h2>
                            <p className="text-3xl font-bold">{summary?.user?.active_rate ?? 0}%</p>
                        </Card>
                        <Card className="h-full">
                            <h2 className="font-semibold">Avg Streak</h2>
                            <p className="text-3xl font-bold">{summary?.user?.average_streak ?? 0}</p>
                        </Card>
                        <Card className="h-full">
                            <h2 className="font-semibold">Total Courses</h2>
                            <p className="text-3xl font-bold">{summary?.content?.total_courses ?? 0}</p>
                        </Card>
                        <Card className="h-full">
                            <h2 className="font-semibold">Total Quizzes</h2>
                            <p className="text-3xl font-bold">{summary?.content?.total_quizzes ?? 0}</p>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">User Statistics</h2>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Card>
                                <h3 className="font-semibold">Students</h3>
                                <p className="text-2xl font-bold">{summary?.user?.role_breakdown?.student ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Lecturers</h3>
                                <p className="text-2xl font-bold">{summary?.user?.role_breakdown?.lecturer ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Admins</h3>
                                <p className="text-2xl font-bold">{summary?.user?.role_breakdown?.admin ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Quiz Completion</h3>
                                <p className="text-2xl font-bold">{summary?.user?.quiz_completion_rate ?? 0}%</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Average Score</h3>
                                <p className="text-2xl font-bold">{summary?.user?.average_quiz_score ?? 0}%</p>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <h3 className="font-semibold mb-3">Streak Distribution</h3>
                                <div className="space-y-2 text-sm">
                                    {Object.entries(summary?.user?.streak_distribution || {}).map(([label, value]) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span>{label} days</span>
                                            <Badge variant="secondary">{value}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card>
                                <h3 className="font-semibold mb-3">Recent Activity</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Study sessions (7d)</span>
                                        <Badge variant="secondary">{summary?.user?.daily_weekly_activity?.study_sessions_7d ?? 0}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Quiz events (7d)</span>
                                        <Badge variant="secondary">{summary?.user?.daily_weekly_activity?.quiz_events_7d ?? 0}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Login events (7d)</span>
                                        <Badge variant="secondary">{summary?.user?.daily_weekly_activity?.login_events_7d ?? 0}</Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Card>
                            <h3 className="font-semibold mb-3">Daily Activity</h3>
                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                                {Object.entries(summary?.user?.daily_weekly_activity?.days || {}).map(([day, count]) => (
                                    <div key={day} className="rounded-xl border border-border/60 p-3">
                                        <div className="text-xs text-muted-foreground">{day}</div>
                                        <div className="mt-1 text-lg font-bold">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                        <UserManagement />
                    </div>
                </TabsContent>

                <TabsContent value="system">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">System Metrics</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <h3 className="font-semibold">Total AI Requests</h3>
                                <p className="text-2xl font-bold">{summary?.system?.total_ai_requests ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Quiz Generation Success Rate</h3>
                                <p className="text-2xl font-bold">{summary?.system?.quiz_generation_success_rate ?? 0}%</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Notification Sends</h3>
                                <p className="text-2xl font-bold">{summary?.system?.notification_sends ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Daily Active Users</h3>
                                <p className="text-2xl font-bold">{summary?.system?.daily_active_users ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Average Response Time</h3>
                                <p className="text-2xl font-bold">{summary?.system?.avg_response_time ?? 0}ms</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Metric Source</h3>
                                <p className="text-2xl font-bold">{summary?.system?.source || 'system_metrics'}</p>
                            </Card>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <Card>
                                <h3 className="font-semibold">AI Service</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {summary?.health?.ai?.endpoint || 'http://localhost:8000'}
                                </p>
                                <Badge variant={summary?.health?.ai?.reachable ? 'default' : 'destructive'} className="mt-3">
                                    {summary?.health?.ai?.reachable ? 'Reachable' : 'Unreachable'}
                                </Badge>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">SMTP</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {summary?.health?.smtp?.host || 'smtp-relay.brevo.com'}:{summary?.health?.smtp?.port || 587}
                                </p>
                                <Badge variant={summary?.health?.smtp?.ready ? 'default' : 'secondary'} className="mt-3">
                                    {summary?.health?.smtp?.ready ? 'Ready' : 'Not ready'}
                                </Badge>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Scheduler</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {summary?.health?.scheduler?.running ? 'Running' : 'Stopped'}
                                </p>
                                <Badge variant={summary?.health?.scheduler?.running ? 'default' : 'secondary'} className="mt-3">
                                    {summary?.health?.scheduler?.jobs?.length || 0} jobs
                                </Badge>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Appwrite</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {summary?.health?.appwrite?.endpoint || 'Not configured'}
                                </p>
                                <Badge variant={summary?.health?.appwrite?.configured ? 'default' : 'secondary'} className="mt-3">
                                    {summary?.health?.appwrite?.configured ? 'Configured' : 'Missing'}
                                </Badge>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="content">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Content Statistics</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <h3 className="font-semibold">Total Materials</h3>
                                <p className="text-2xl font-bold">{summary?.content?.total_materials ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Flagged Materials</h3>
                                <p className="text-2xl font-bold">{summary?.content?.flagged_materials ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Duplicate Content</h3>
                                <p className="text-2xl font-bold">{summary?.content?.duplicate_content ?? 0}</p>
                            </Card>
                        </div>
                        <ContentManagement />
                    </div>
                </TabsContent>

                <TabsContent value="templates">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Question Templates</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <h3 className="font-semibold">Total Templates</h3>
                                <p className="text-2xl font-bold">{summary?.templates?.total_templates ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Active Templates</h3>
                                <p className="text-2xl font-bold">{summary?.templates?.active_templates ?? 0}</p>
                            </Card>
                            <Card>
                                <h3 className="font-semibold">Inactive Templates</h3>
                                <p className="text-2xl font-bold">{summary?.templates?.inactive_templates ?? 0}</p>
                            </Card>
                        </div>
                        <QuestionTemplateManagement />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
