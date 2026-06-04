'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import {
    TrendingUp,
    BookOpen,
    Trophy,
    Clock,
    ArrowUpRight,
    Loader2,
    Crown,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

import ReadinessChart from '@/components/dashboard/ReadinessChart';
import StudyActivityChart from '@/components/dashboard/StudyActivityChart';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

type DashboardStats = {
    streak?: number;
    studyTime?: string;
    avgScore?: string;
    recentLogs?: Array<Record<string, unknown>>;
};

type DashboardCourse = {
    exam_date?: string;
    title?: string;
    code?: string;
    progress?: number;
    exam_readiness?: number;
};

type StatCardProps = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    trend?: string;
    color: string;
};

const StatCard = ({ icon: Icon, label, value, trend, color }: StatCardProps) => (
    <div className="bg-[var(--teal)] text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-white/20`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
            <div className="flex items-center text-white text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {trend}
                </div>
            )}
        </div>
        <div className="mt-4">
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">{label}</h3>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [courses, setCourses] = useState<DashboardCourse[]>([]);
    const [courseCount, setCourseCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const streak = stats?.streak || 0;

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const jwt = await getCachedJWT();
                
                // Fetch stats and courses in parallel, but don't fail the whole page
                const [statsRes, coursesRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/activity/stats`, {
                        headers: { Authorization: `Bearer ${jwt}` }
                    }),
                    axios.get(`${API_URL}/api/courses`, {
                        headers: { Authorization: `Bearer ${jwt}` }
                    })
                ]);

                if (statsRes.status === 'fulfilled') {
                    setStats(statsRes.value.data);
                } else {
                    console.warn('Activity stats request failed:', statsRes.reason);
                    setStats(null);
                }

                if (coursesRes.status === 'fulfilled') {
                    setCourses(coursesRes.value.data || []);
                    setCourseCount((coursesRes.value.data || []).length);
                } else {
                    console.warn('Courses request failed:', coursesRes.reason);
                    setCourses([]);
                    setCourseCount(0);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setStats(null);
                setCourses([]);
                setCourseCount(0);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && user) {
            fetchDashboardData();
        }
    }, [user, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-secondary animate-spin" />
            </div>
        );
    }

    const today = new Date().toISOString().slice(0, 10);
    const todaysLogs = stats?.recentLogs?.filter((log: any) => log.timestamp?.startsWith(today)) || [];
    
    const quizDone = todaysLogs.some((log: any) => log.type.includes('quiz') || log.type.includes('evaluate'));
    const uploadDone = todaysLogs.some((log: any) => log.type.includes('upload') || log.type.includes('material'));
    const essayDone = todaysLogs.some((log: any) => log.type.includes('essay'));

    const dailyQuests = [
        { title: 'Quiz Master', desc: 'Complete any 10-question quiz', xp: '+50 XP', done: quizDone, color: 'bg-primary' },
        { title: 'The Scholar', desc: 'Upload and read 1 new document', xp: '+30 XP', done: uploadDone, color: 'bg-accent' },
        { title: 'Essay Writer', desc: 'Submit 1 high-quality essay', xp: '+100 XP', done: essayDone, color: 'bg-denim' }
    ];
    const completedQuestsCount = dailyQuests.filter(q => q.done).length;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-cream">
                        Welcome, {user?.name?.split(' ')[0] || 'Scholar'}! 👋
                    </h1>
                    <p className="text-sm md:text-base text-foreground/60 dark:text-cream/60 mt-1 font-medium">
                        {streak > 0
                            ? `On a ${streak}-day study streak!`
                            : "Start your study journey today!"}
                    </p>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <Link href="/dashboard/reports" className="flex-1 sm:flex-none">
                        <button className="w-full bg-surface/90 dark:bg-surface-2/90 border border-primary/10 dark:border-primary/20 text-foreground px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-surface-2 transition-all">
                            Reports
                        </button>
                    </Link>
                    <Link href="/dashboard/courses" className="flex-1 sm:flex-none">
                        <button className="w-full bg-secondary hover:bg-accent text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center shadow-lg shadow-secondary/20 transition-all hover:scale-105">
                            Study
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                        </button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                <StatCard
                    icon={BookOpen}
                    label="Active Courses"
                    value={courseCount.toString()}
                color="bg-primary"
                />
                <StatCard
                    icon={Trophy}
                    label="Streak"
                    value={`${streak} Days`}
                    trend={streak > 0 ? "+1" : undefined}
                color="bg-secondary"
                />
                <StatCard
                    icon={Clock}
                    label="Study Time"
                    value={stats?.studyTime || "0m"}
                    trend="+5m"
                color="bg-accent"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg Score"
                    value={stats?.avgScore || "0%"}
                color="bg-denim"
                />
                {/* New Leaderboard Glance Card */}
                <Link href="/dashboard/leaderboard" className="col-span-2 lg:col-span-1">
                    <div className="bg-linear-to-br from-secondary to-accent p-6 rounded-2xl shadow-lg shadow-secondary/20 text-white h-full hover:scale-105 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <Crown className="group-hover:rotate-12 transition-transform" size={24} />
                            <ArrowUpRight size={16} />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Rank #245</h3>
                        <p className="text-xl font-black tracking-tighter mt-1">Join the Race</p>
                    </div>
                </Link>
            </div>

            {/* Daily Quests Section */}
            <div className="bg-[var(--teal)] text-white rounded-3xl p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Daily Quests</h3>
                        <p className="text-sm text-white/80 font-medium">Complete these to level up your exam readiness</p>
                    </div>
                    <div className="px-4 py-2 bg-white/20 rounded-xl text-white text-xs font-black uppercase tracking-widest">
                        {completedQuestsCount}/3 Complete
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dailyQuests.map((quest, i) => (
                        <div key={i} className="flex items-center p-4 bg-white/10 rounded-2xl group cursor-pointer hover:bg-white/20 transition-all border border-transparent hover:border-white/30">
                            <div className={`${quest.color} h-12 w-12 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg shadow-black/10`}>
                                <CheckCircle2 size={20} className={quest.done ? "text-white" : "text-white/30"} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm">{quest.title}</h4>
                                <p className="text-xs text-white/70">{quest.desc}</p>
                            </div>
                            <div className="text-[10px] font-black text-white uppercase tracking-widest pl-2">
                                {quest.xp}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-[var(--teal)] text-white rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white">Study Activity</h3>
                            <p className="text-sm text-white/80 font-medium">Weekly hours spent learning</p>
                        </div>
                        <select className="bg-white/20 border-none rounded-lg text-white text-xs font-bold px-3 py-2 outline-none focus:ring-2 focus:ring-white" title="Select Study Activity Time Range" aria-label="Select Study Activity Time Range">
                            <option className="text-black">Last 7 Days</option>
                            <option className="text-black">Last 30 Days</option>
                        </select>
                    </div>
                        <StudyActivityChart logs={stats?.recentLogs} textWhite={true} />
                </div>

                {/* Readiness & Goals */}
                <div className="space-y-8">
                    <div className="bg-[var(--teal)] text-white rounded-3xl p-8 shadow-sm flex flex-col items-center">
                        <div className="[&_*]:text-white dark:[&_*]:text-white w-full">
                            <ReadinessChart textWhite={true} percentage={courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + (c.exam_readiness || 0), 0) / courses.length) : 0} />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-white/90 font-medium px-4">
                                {courses.length > 0 ? (
                                    <span>Based on your activity across <span className="font-bold text-white">{courses.length} courses</span>.</span>
                                ) : (
                                    <span>Complete your first quiz to see your <span className="font-bold text-white">Exam Readiness</span>.</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-primary to-secondary rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-1">Pro Tip</h3>
                            <p className="text-cream/90 text-sm font-medium leading-relaxed">
                                Students who study at least 30 minutes a day are 4x more likely to pass their finals.
                            </p>
                            <Link href="/dashboard/success-tips" className="mt-6 inline-block">
                                    <button className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-cream transition-colors shadow-lg">
                                    Learn More
                                </button>
                            </Link>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp className="h-32 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            <AnalyticsDashboard />

            {/* Courses Progress section */}
            <div className="bg-[var(--teal)] text-white rounded-3xl p-8 shadow-sm mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Courses & Exam Readiness</h3>
                </div>
                <div className="space-y-6">
                    {courses.map((course: DashboardCourse, idx: number) => {
                        const examDate = course.exam_date ? new Date(course.exam_date) : null;
                        const daysToExam = examDate ? Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                        return (
                        <div key={idx} className="bg-white/10 p-6 rounded-2xl">
                            <style>{`
                                .progress-bar-prog-${idx} { width: ${course.progress || 0}%; }
                                .progress-bar-read-${idx} { width: ${course.exam_readiness || 0}%; }
                            `}</style>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-white">{course.title} ({course.code})</h4>
                                    {daysToExam !== null && daysToExam > 0 ? (
                                        <p className="text-xs font-semibold text-white/80 mt-1">{daysToExam} days until final exam ({examDate?.toLocaleDateString()})</p>
                                    ) : daysToExam !== null && daysToExam <= 0 ? (
                                        <p className="text-xs font-semibold text-red-300 mt-1">Exam Date Passed</p>
                                    ) : (
                                        <p className="text-xs font-semibold text-white/60 mt-1">No exam date set</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-white">Readiness: {course.exam_readiness || 0}%</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-white/80 mb-2">
                                        <span>Course Completion</span>
                                        <span>{course.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-2.5">
                                        <div className={`bg-white h-2.5 rounded-full progress-bar-prog-${idx}`}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-white/80 mb-2">
                                        <span>Topics Studied & Mastered</span>
                                        <span>{course.exam_readiness || 0}%</span>
                                    </div>
                                    <div className="w-full bg-black/20 rounded-full h-2.5">
                                        <div className={`bg-secondary h-2.5 rounded-full progress-bar-read-${idx}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                    {courses.length === 0 && (
                        <div className="text-center py-8 bg-white/10 rounded-2xl">
                            <BookOpen className="h-10 w-10 text-white/50 mx-auto mb-3" />
                            <p className="text-sm text-white/70 font-medium">You have not enrolled in any courses yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
