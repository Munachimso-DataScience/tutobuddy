'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { account, getCachedJWT } from '@/lib/appwrite';
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

const StatCard = ({ icon: Icon, label, value, trend, color }: any) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
                <div className="flex items-center text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {trend}
                </div>
            )}
        </div>
        <div className="mt-4">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [courseCount, setCourseCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const jwt = await getCachedJWT();
                
                // Fetch stats and courses in parallel
                const [statsRes, coursesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/activity/stats`, {
                        headers: { Authorization: `Bearer ${jwt}` }
                    }),
                    axios.get(`${API_URL}/api/courses`, {
                        headers: { Authorization: `Bearer ${jwt}` }
                    })
                ]);

                setStats(statsRes.data);
                setCourses(coursesRes.data);
                setCourseCount(coursesRes.data.length);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome, {user?.name?.split(' ')[0] || 'Scholar'}! 👋
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        {stats?.streak > 0 
                            ? `On a ${stats.streak}-day study streak!`
                            : "Start your study journey today!"}
                    </p>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <Link href="/dashboard/reports" className="flex-1 sm:flex-none">
                        <button className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
                            Reports
                        </button>
                    </Link>
                    <Link href="/dashboard/courses" className="flex-1 sm:flex-none">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
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
                    color="bg-blue-600"
                />
                <StatCard
                    icon={Trophy}
                    label="Streak"
                    value={`${stats?.streak || 0} Days`}
                    trend={stats?.streak > 0 ? "+1" : undefined}
                    color="bg-orange-500"
                />
                <StatCard
                    icon={Clock}
                    label="Study Time"
                    value={stats?.studyTime || "0m"}
                    trend="+5m"
                    color="bg-purple-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg Score"
                    value={stats?.avgScore || "0%"}
                    color="bg-emerald-500"
                />
                {/* New Leaderboard Glance Card */}
                <Link href="/dashboard/leaderboard" className="col-span-2 lg:col-span-1">
                    <div className="bg-linear-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white h-full hover:scale-105 transition-all group">
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
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Daily Quests</h3>
                        <p className="text-sm text-gray-500 font-medium">Complete these to level up your exam readiness</p>
                    </div>
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                        0/3 Complete
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Quiz Master", desc: "Complete any 10-question quiz", xp: "+50 XP", done: false, color: "bg-blue-500" },
                        { title: "The Scholar", desc: "Upload and read 1 new document", xp: "+30 XP", done: false, color: "bg-purple-500" },
                        { title: "Essay Writer", desc: "Submit 1 high-quality essay", xp: "+100 XP", done: false, color: "bg-emerald-500" }
                    ].map((quest, i) => (
                        <div key={i} className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                            <div className={`${quest.color} h-12 w-12 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg shadow-blue-500/10`}>
                                <CheckCircle2 size={20} className={quest.done ? "text-white" : "text-white/30"} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{quest.title}</h4>
                                <p className="text-xs text-gray-500">{quest.desc}</p>
                            </div>
                            <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest pl-2">
                                {quest.xp}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Activity</h3>
                            <p className="text-sm text-gray-500 font-medium">Weekly hours spent learning</p>
                        </div>
                        <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-blue-500" title="Select Study Activity Time Range" aria-label="Select Study Activity Time Range">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <StudyActivityChart logs={stats?.recentLogs} />
                </div>

                {/* Readiness & Goals */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                        <ReadinessChart percentage={courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + (c.exam_readiness || 0), 0) / courses.length) : 0} />
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500 font-medium px-4">
                                {courses.length > 0 ? (
                                    <span>Based on your activity across <span className="text-blue-600 font-bold">{courses.length} courses</span>.</span>
                                ) : (
                                    <span>Complete your first quiz to see your <span className="text-blue-600 font-bold">Exam Readiness</span>.</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-1">Pro Tip</h3>
                            <p className="text-blue-100 text-sm font-medium leading-relaxed">
                                Students who study at least 30 minutes a day are 4x more likely to pass their finals.
                            </p>
                            <Link href="/dashboard/success-tips" className="mt-6 inline-block">
                                <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-lg">
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
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 mt-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Courses & Exam Readiness</h3>
                </div>
                <div className="space-y-6">
                    {courses.map((course: any, idx: number) => {
                        const daysToExam = course.exam_date ? Math.ceil((new Date(course.exam_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                        return (
                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                            <style>{`
                                .progress-bar-prog-${idx} { width: ${course.progress || 0}%; }
                                .progress-bar-read-${idx} { width: ${course.exam_readiness || 0}%; }
                            `}</style>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{course.title} ({course.code})</h4>
                                    {daysToExam !== null && daysToExam > 0 ? (
                                        <p className="text-xs font-semibold text-orange-500 mt-1">{daysToExam} days until final exam ({new Date(course.exam_date).toLocaleDateString()})</p>
                                    ) : daysToExam !== null && daysToExam <= 0 ? (
                                        <p className="text-xs font-semibold text-red-500 mt-1">Exam Date Passed</p>
                                    ) : (
                                        <p className="text-xs font-semibold text-gray-500 mt-1">No exam date set</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Readiness: {course.exam_readiness || 0}%</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                                        <span>Course Completion</span>
                                        <span>{course.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className={`bg-emerald-500 h-2.5 rounded-full progress-bar-prog-${idx}`}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                                        <span>Topics Studied & Mastered</span>
                                        <span>{course.exam_readiness || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div className={`bg-blue-600 h-2.5 rounded-full progress-bar-read-${idx}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                    {courses.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                            <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 font-medium">You have not enrolled in any courses yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
