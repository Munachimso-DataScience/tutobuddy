'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, BookOpen, Send, ShieldAlert } from 'lucide-react';
import { createLecturerCourseOffering, getLecturerCourseOfferings, getLecturerSummary } from '@/lib/api';
import { getCachedJWT } from '@/lib/appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-toastify';

export default function LecturerClassesManagement() {
    const { profile } = useAuth();
    const [offerings, setOfferings] = useState<any[]>([]);
    const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const jwt = await getCachedJWT();
                const [summaryData, offeringsData] = await Promise.all([
                    getLecturerSummary(jwt, { classGroup: profile?.class_group || '' }),
                    getLecturerCourseOfferings(jwt)
                ]);
                setAssignedCourses(summaryData?.lecturer?.assigned_courses || []);
                setOfferings(offeringsData.offerings || []);
            } catch (err) {
                console.error('Failed to load classes data:', err);
                setError('Unable to load classes data right now.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [profile?.class_group]);

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
                    <h1 className="text-2xl font-bold">Manage Classes</h1>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="h-96">
                        <Skeleton className="h-4 w-48 mb-4 m-4" />
                        <Skeleton className="h-full w-full" />
                    </Card>
                    <Card className="h-96">
                        <Skeleton className="h-4 w-48 mb-4 m-4" />
                        <Skeleton className="h-full w-full" />
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="max-w-md rounded-3xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/30">
                    <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-red-500" />
                    <h1 className="text-xl font-bold text-red-700 dark:text-red-300">Classes unavailable</h1>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <BookOpen className="h-6 w-6 text-secondary" />
                <div>
                    <h1 className="text-2xl font-bold">Manage Classes</h1>
                    <p className="text-sm text-muted-foreground">
                        Create course offerings, enroll students, and upload official materials.
                    </p>
                </div>
            </div>

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
                                <label htmlFor="offeringCodeInput" className="mb-1 block text-sm font-medium">Code</label>
                                {assignedCourses.length > 0 ? (
                                    <select
                                        id="offeringCodeInput"
                                        title="Course Offering Code"
                                        value={offeringCode}
                                        onChange={(e) => setOfferingCode(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        required
                                    >
                                        <option value="" disabled>Select assigned course</option>
                                        {assignedCourses.map((course) => (
                                            <option key={course} value={course}>{course}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input id="offeringCodeInput" title="Course Offering Code" value={offeringCode} onChange={(e) => setOfferingCode(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. MTH101" required />
                                )}
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
                            <div key={offering.$id} className="rounded-lg border border-border p-4 transition hover:border-primary/50">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-lg">{offering.title || 'Untitled offering'}</p>
                                        <p className="text-sm text-muted-foreground">{offering.code || 'No code'} {offering.term ? `- ${offering.term}` : ''}</p>
                                    </div>
                                    <Badge variant="secondary">{offering.status || 'active'}</Badge>
                                </div>
                                {offering.description && (
                                    <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{offering.description}</p>
                                )}
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    {offering.department ? <Badge variant="outline">{offering.department}</Badge> : null}
                                    {offering.class_group ? <Badge variant="outline">{offering.class_group}</Badge> : null}
                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{offering.enrolled_students ?? 0} students</Badge>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">No class offerings yet.</p>
                                <p className="text-xs text-muted-foreground mt-1">Use the form to create your first class.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
