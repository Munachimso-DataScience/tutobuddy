'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, GraduationCap, ShieldAlert, Send } from 'lucide-react';
import { createLecturerCourseOffering, getLecturerCourseOfferings, getLecturerSummary, sendLecturerReminder, getLecturerStudentHistory } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

type LecturerSummary = {
    filters?: {
        range_days?: number;
        class_group?: string;
        course_id?: string;
    };
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
    trends?: Array<{
        date?: string;
        study_minutes?: number;
        avg_score?: number;
        readiness?: number;
        quizzes?: number;
        study_sessions?: number;
    }>;
    students?: {
        progress?: Array<{
            user_id?: string;
            full_name?: string;
            class_group?: string;
            study_minutes_total?: number;
            current_streak?: number;
            average_score?: number;
            readiness?: number;
            recent_content_covered?: string;
            last_study_summary?: string;
            weekly_weaknesses?: string;
            last_study_at?: string;
        }>;
        lowest_readiness?: Array<{
            user_id?: string;
            full_name?: string;
            class_group?: string;
            readiness?: number;
            average_score?: number;
        }>;
        available_class_groups?: string[];
        available_courses?: Array<{
            course_id?: string;
            code?: string;
            title?: string;
            class_group?: string;
        }>;
    };
    reminders?: Array<{
        class_group?: string;
        topic?: string;
        message?: string;
        recipients?: number;
        created_at?: string;
    }>;
    offerings?: Array<{
        $id?: string;
        title?: string;
        code?: string;
        description?: string;
        department?: string;
        class_group?: string;
        lecturer_id?: string;
        term?: string;
        status?: string;
        created_at?: string;
        enrolled_students?: number;
    }>;
    recommendations?: string[];
};

export default function LecturerDashboard() {
    const { profile } = useAuth();
    const [summary, setSummary] = useState<LecturerSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [range, setRange] = useState('7d');
    const [selectedClassGroup, setSelectedClassGroup] = useState('');
    const [courseId, setCourseId] = useState('');
    const [reminderClassGroup, setReminderClassGroup] = useState('');
    const [reminderTopic, setReminderTopic] = useState('');
    const [reminderMessage, setReminderMessage] = useState('');
    const [sendingReminder, setSendingReminder] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentHistory, setStudentHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [offerings, setOfferings] = useState<NonNullable<LecturerSummary['offerings']>>([]);
    const [offeringTitle, setOfferingTitle] = useState('');
    const [offeringCode, setOfferingCode] = useState('');
    const [offeringDescription, setOfferingDescription] = useState('');
    const [offeringDepartment, setOfferingDepartment] = useState('');
    const [offeringClassGroup, setOfferingClassGroup] = useState('');
    const [offeringTerm, setOfferingTerm] = useState('');
    const [offeringStatus, setOfferingStatus] = useState('active');
    const [autoEnroll, setAutoEnroll] = useState(true);
    const [savingOffering, setSavingOffering] = useState(false);
    const [offeringFile, setOfferingFile] = useState<File | null>(null);

    useEffect(() => {
        const loadSummary = async () => {
            try {
                setLoading(true);
                setError(null);
                const jwt = await getCachedJWT();
                const [summaryData, offeringsData] = await Promise.all([
                    getLecturerSummary(jwt, {
                    range,
                    classGroup: selectedClassGroup || profile?.class_group || '',
                    courseId
                    }),
                    getLecturerCourseOfferings(jwt)
                ]);
                setSummary(summaryData);
                setOfferings(offeringsData.offerings || []);
            } catch (err) {
                console.error('Failed to load lecturer summary:', err);
                setError('Unable to load lecturer dashboard data right now.');
            } finally {
                setLoading(false);
            }
        };

        loadSummary();
    }, [range, selectedClassGroup, courseId, profile?.class_group]);

    useEffect(() => {
        if (!selectedClassGroup && summary?.lecturer?.class_group) {
            setSelectedClassGroup(summary.lecturer.class_group);
        }
    }, [selectedClassGroup, summary?.lecturer?.class_group]);

    useEffect(() => {
        const defaultClassGroup = selectedClassGroup || summary?.lecturer?.class_group || '';
        if (!reminderClassGroup && defaultClassGroup) {
            setReminderClassGroup(defaultClassGroup);
        }
    }, [reminderClassGroup, selectedClassGroup, summary?.lecturer?.class_group]);

    useEffect(() => {
        if (!selectedStudentId && summary?.students?.progress?.length) {
            setSelectedStudentId(summary.students.progress[0]?.user_id || '');
        }
    }, [selectedStudentId, summary?.students?.progress]);

    useEffect(() => {
        if (!selectedStudentId) return;
        const loadHistory = async () => {
            try {
                setLoadingHistory(true);
                const jwt = await getCachedJWT();
                const res = await getLecturerStudentHistory(jwt, selectedStudentId);
                setStudentHistory(res.history || []);
            } catch (err) {
                console.error('Failed to load student history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();
    }, [selectedStudentId]);

    const selectedStudent = summary?.students?.progress?.find((student) => student.user_id === selectedStudentId) || null;
    const trendData = summary?.trends || [];
    const reminderHistory = summary?.reminders || [];

    const handleSendReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSendingReminder(true);
            const jwt = await getCachedJWT();
            const result = await sendLecturerReminder(jwt, {
                classGroup: reminderClassGroup || profile?.class_group || '',
                topic: reminderTopic,
                message: reminderMessage
            });
            toast.success(`Reminder sent to ${result.recipients || 0} students.`);
            setReminderTopic('');
            setReminderMessage('');
        } catch (err) {
            console.error('Failed to send reminder:', err);
            toast.error('Unable to send the revision reminder right now.');
        } finally {
            setSendingReminder(false);
        }
    };

    const handleCreateOffering = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSavingOffering(true);
            const jwt = await getCachedJWT();
            
            const formData = new FormData();
            formData.append('title', offeringTitle);
            if (offeringCode) formData.append('code', offeringCode);
            if (offeringDescription) formData.append('description', offeringDescription);
            if (offeringDepartment) formData.append('department', offeringDepartment);
            if (offeringClassGroup) formData.append('class_group', offeringClassGroup);
            if (offeringTerm) formData.append('term', offeringTerm);
            if (offeringStatus) formData.append('status', offeringStatus);
            formData.append('auto_enroll', autoEnroll.toString());
            
            if (offeringFile) {
                formData.append('file', offeringFile);
            }

            const result = await createLecturerCourseOffering(jwt, formData);
            toast.success(`Course offering created${result.enrolled ? ` and ${result.enrolled} students enrolled` : ''}.`);
            setOfferingTitle('');
            setOfferingCode('');
            setOfferingDescription('');
            setOfferingDepartment('');
            setOfferingClassGroup('');
            setOfferingTerm('');
            setOfferingStatus('active');
            setAutoEnroll(true);
            setOfferingFile(null);
            const refreshed = await getLecturerCourseOfferings(jwt);
            setOfferings(refreshed.offerings || []);
        } catch (err) {
            console.error('Failed to create course offering:', err);
            toast.error('Unable to create the course offering right now.');
        } finally {
            setSavingOffering(false);
        }
    };

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

            <Card className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Date Range
                        </label>
                        <select
                            aria-label="Date Range"
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="term">Full term</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Class Group
                        </label>
                        <select
                            aria-label="Class Group"
                            value={selectedClassGroup}
                            onChange={(e) => setSelectedClassGroup(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All classes</option>
                            {(summary?.students?.available_class_groups || []).map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Course
                        </label>
                        <select
                            aria-label="Course"
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value="">All courses</option>
                            {(summary?.students?.available_courses || []).map((course) => (
                                <option key={course.course_id || course.code || course.title} value={course.course_id || course.code || ''}>
                                    {course.title || course.code || 'Untitled course'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="offerings">Offerings</TabsTrigger>
                    <TabsTrigger value="weaknesses">Weaknesses</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
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
                                <div className="flex items-center justify-between">
                                    <span>Course offerings</span>
                                    <Badge variant="secondary">{offerings.length}</Badge>
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

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        <Card>
                            <h3 className="font-semibold mb-3">Study Minutes Trend</h3>
                            <div className="space-y-3">
                                {trendData.length > 0 ? trendData.map((point) => (
                                    <div key={point.date} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{point.date}</span>
                                            <span>{point.study_minutes ?? 0} min</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div className={`h-2 rounded-full bg-primary trend-bar-${point.date}`} />
                                            <style jsx>{`.trend-bar-${point.date} { width: ${Math.min(100, ((point.study_minutes ?? 0) / Math.max(1, Math.max(...trendData.map((item) => item.study_minutes ?? 0)))) * 100)}%; }`}</style>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No trend data yet.</p>
                                )}
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-semibold mb-3">Average Score Trend</h3>
                            <div className="space-y-3">
                                {trendData.length > 0 ? trendData.map((point) => (
                                    <div key={point.date} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{point.date}</span>
                                            <span>{point.avg_score ?? 0}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div className={`h-2 rounded-full bg-emerald-500 trend-bar-score-${point.date}`} />
                                            <style jsx>{`.trend-bar-score-${point.date} { width: ${Math.max(0, Math.min(100, point.avg_score ?? 0))}%; }`}</style>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No trend data yet.</p>
                                )}
                            </div>
                        </Card>
                        <Card>
                            <h3 className="font-semibold mb-3">Readiness Trend</h3>
                            <div className="space-y-3">
                                {trendData.length > 0 ? trendData.map((point) => (
                                    <div key={point.date} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{point.date}</span>
                                            <span>{point.readiness ?? 0}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted">
                                            <div className={`h-2 rounded-full bg-amber-500 trend-bar-readiness-${point.date}`} />
                                            <style jsx>{`.trend-bar-readiness-${point.date} { width: ${Math.max(0, Math.min(100, point.readiness ?? 0))}%; }`}</style>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No trend data yet.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="offerings">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <h3 className="font-semibold mb-4">Create Course Offering</h3>
                            <form className="space-y-3" onSubmit={handleCreateOffering}>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Title</label>
                                        <input value={offeringTitle} onChange={(e) => setOfferingTitle(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Calculus I" required />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Code</label>
                                        <input value={offeringCode} onChange={(e) => setOfferingCode(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. MTH101" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Description</label>
                                    <textarea value={offeringDescription} onChange={(e) => setOfferingDescription(e.target.value)} className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="Short description of this course offering" />
                                </div>
                                <div>
                                    <label htmlFor="courseMaterialFile" className="mb-1 block text-sm font-medium">Course Material (PDF/DOCX)</label>
                                    <input id="courseMaterialFile" title="Upload Course Material File" type="file" onChange={(e) => setOfferingFile(e.target.files ? e.target.files[0] : null)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" accept=".pdf,.docx,.doc,.txt" />
                                    <p className="text-xs text-muted-foreground mt-1">This file will be automatically added to enrolled students' study materials.</p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Department</label>
                                        <input value={offeringDepartment} onChange={(e) => setOfferingDepartment(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Mathematics" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Class Group</label>
                                        <input value={offeringClassGroup} onChange={(e) => setOfferingClassGroup(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. Year 2 A" />
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Term</label>
                                        <input value={offeringTerm} onChange={(e) => setOfferingTerm(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 2026/2027 First Term" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Status</label>
                                        <select aria-label="Status" value={offeringStatus} onChange={(e) => setOfferingStatus(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                                            <option value="active">Active</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={autoEnroll} onChange={(e) => setAutoEnroll(e.target.checked)} />
                                    Auto-enroll students from the selected class group
                                </label>
                                <button type="submit" disabled={savingOffering} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                    {savingOffering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Create offering
                                </button>
                            </form>
                        </Card>

                        <Card>
                            <h3 className="font-semibold mb-4">Current Course Offerings</h3>
                            <div className="space-y-3">
                                {offerings.length > 0 ? offerings.map((offering) => (
                                    <div key={offering.$id} className="rounded-lg border border-border p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium">{offering.title || 'Untitled offering'}</p>
                                                <p className="text-xs text-muted-foreground">{offering.code || 'No code'} {offering.term ? `- ${offering.term}` : ''}</p>
                                            </div>
                                            <Badge variant="secondary">{offering.status || 'active'}</Badge>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            {offering.department ? <Badge variant="outline">{offering.department}</Badge> : null}
                                            {offering.class_group ? <Badge variant="outline">{offering.class_group}</Badge> : null}
                                            <Badge variant="outline">{offering.enrolled_students ?? 0} students</Badge>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground">No lecturer course offerings yet.</p>
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

                <TabsContent value="progress">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="lg:col-span-2">
                            <h3 className="font-semibold mb-4">Student Drill-Down</h3>
                            {selectedStudent ? (
                                <div className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-semibold">{selectedStudent.full_name || 'Student'}</p>
                                                    <p className="text-sm text-muted-foreground">{selectedStudent.class_group || 'Unassigned'}</p>
                                                </div>
                                                <Badge variant="secondary">{selectedStudent.current_streak ?? 0} day streak</Badge>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between"><span>Study minutes</span><span className="font-medium">{selectedStudent.study_minutes_total ?? 0}</span></div>
                                                <div className="flex items-center justify-between"><span>Average score</span><span className="font-medium">{selectedStudent.average_score ?? 0}%</span></div>
                                                <div className="flex items-center justify-between"><span>Readiness</span><span className="font-medium">{selectedStudent.readiness ?? 0}%</span></div>
                                                <div className="flex items-center justify-between"><span>Last study</span><span className="font-medium">{selectedStudent.last_study_at || 'No record'}</span></div>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            {selectedStudent.recent_content_covered ? <p><span className="font-medium">Recent content:</span> {selectedStudent.recent_content_covered}</p> : null}
                                            {selectedStudent.last_study_summary ? <p><span className="font-medium">Last study summary:</span> {selectedStudent.last_study_summary}</p> : null}
                                            {selectedStudent.weekly_weaknesses ? <p><span className="font-medium">Weekly weaknesses:</span> {selectedStudent.weekly_weaknesses}</p> : null}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <h4 className="font-semibold mb-3">Detailed History</h4>
                                        {loadingHistory ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Loading timeline...
                                            </div>
                                        ) : studentHistory.length > 0 ? (
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                                {studentHistory.map((item, idx) => (
                                                    <div key={`${item.id}-${idx}`} className="flex flex-col gap-1 rounded-md border p-2 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium">{item.type === 'quiz' ? item.title : item.description || item.activity_type}</span>
                                                            <span className="text-xs text-muted-foreground">{item.timestamp?.slice(0, 10) || ''}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                                                            {item.type === 'quiz' && <Badge variant="secondary" className="text-[10px]">Score: {item.score}%</Badge>}
                                                            {item.type === 'activity' && item.duration > 0 && <Badge variant="secondary" className="text-[10px]">{item.duration} min</Badge>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No recent activity found.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Select a student below to inspect their progress.</p>
                            )}
                        </Card>

                        <Card>
                            <h3 className="font-semibold mb-4">Send Revision Reminder</h3>
                            <form className="space-y-3" onSubmit={handleSendReminder}>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Class / Cohort</label>
                                    <input
                                        value={reminderClassGroup}
                                        onChange={(e) => setReminderClassGroup(e.target.value)}
                                        placeholder="e.g. Year 2 A"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Topic</label>
                                    <input
                                        value={reminderTopic}
                                        onChange={(e) => setReminderTopic(e.target.value)}
                                        placeholder="e.g. Linear equations"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Message</label>
                                    <textarea
                                        value={reminderMessage}
                                        onChange={(e) => setReminderMessage(e.target.value)}
                                        placeholder="Add a short revision note for this group"
                                        className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sendingReminder}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                >
                                    {sendingReminder ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Send reminder
                                </button>
                            </form>
                        </Card>

                        <Card>
                            <h3 className="font-semibold mb-4">Lowest Readiness Students</h3>
                            <div className="space-y-3">
                                {(summary?.students?.lowest_readiness || []).length > 0 ? (
                                    summary?.students?.lowest_readiness?.map((student) => (
                                        <div key={student.user_id || student.full_name} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                                            <div>
                                                <p className="font-medium">{student.full_name || 'Student'}</p>
                                                <p className="text-xs text-muted-foreground">{student.class_group || 'Unassigned'}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary">Readiness {student.readiness ?? 0}%</Badge>
                                                <Badge variant="outline">Avg {student.average_score ?? 0}%</Badge>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No student progress data is available yet.</p>
                                )}
                            </div>
                        </Card>

                        <Card className="lg:col-span-2">
                            <h3 className="font-semibold mb-4">Student Progress Summary</h3>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {(summary?.students?.progress || []).length > 0 ? (
                                    summary?.students?.progress?.map((student) => (
                                        <button
                                            key={student.user_id || student.full_name}
                                            type="button"
                                            onClick={() => setSelectedStudentId(student.user_id || '')}
                                            className={`rounded-xl border p-4 text-left transition hover:border-primary/60 ${selectedStudentId === student.user_id ? 'border-primary bg-primary/5' : 'border-border'}`}
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold">{student.full_name || 'Student'}</p>
                                                    <p className="text-xs text-muted-foreground">{student.class_group || 'Unassigned'}</p>
                                                </div>
                                                <Badge variant="secondary">{student.current_streak ?? 0} day streak</Badge>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span>Study minutes</span>
                                                    <span className="font-medium">{student.study_minutes_total ?? 0}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Average score</span>
                                                    <span className="font-medium">{student.average_score ?? 0}%</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Readiness</span>
                                                    <span className="font-medium">{student.readiness ?? 0}%</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                                {student.recent_content_covered ? <p><span className="font-medium text-foreground">Recent:</span> {student.recent_content_covered}</p> : null}
                                                {student.last_study_summary ? <p><span className="font-medium text-foreground">Last study:</span> {student.last_study_summary}</p> : null}
                                                {student.weekly_weaknesses ? <p><span className="font-medium text-foreground">Weaknesses:</span> {student.weekly_weaknesses}</p> : null}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No student progress cards available yet.</p>
                                )}
                            </div>
                        </Card>
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

                <TabsContent value="history">
                    <div className="grid gap-4">
                        {(reminderHistory || []).length > 0 ? (
                            reminderHistory.map((reminder, index) => (
                                <Card key={`${reminder.created_at}-${index}`}>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <h3 className="font-semibold">{reminder.topic || 'Revision reminder'}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {reminder.class_group || 'All students'} - {reminder.recipients ?? 0} recipients
                                            </p>
                                            <p className="mt-2 text-sm leading-relaxed">{reminder.message || 'No message provided.'}</p>
                                        </div>
                                        <Badge variant="secondary">{reminder.created_at || 'Recent'}</Badge>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <Card>
                                <p className="text-sm text-muted-foreground">
                                    No reminder history is available yet.
                                </p>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
