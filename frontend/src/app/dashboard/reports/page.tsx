'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { account } from '@/lib/appwrite';
import axios from 'axios';
import { 
    BarChart3, 
    Calendar, 
    ChevronLeft, 
    Download, 
    FileText, 
    TrendingUp, 
    PieChart,
    Clock,
    Award
} from 'lucide-react';
import Link from 'next/link';
import StudyActivityChart from '@/components/dashboard/StudyActivityChart';
import ReadinessChart from '@/components/dashboard/ReadinessChart';

export default function ReportsPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const { jwt } = await account.createJWT();
                const [statsRes, coursesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/activity/stats', {
                        headers: { Authorization: `Bearer ${jwt}` }
                    }),
                    axios.get('http://localhost:5000/api/courses', {
                        headers: { Authorization: `Bearer ${jwt}` }
                    })
                ]);

                setStats(statsRes.data);
                setCourses(coursesRes.data);
            } catch (error) {
                console.error('Failed to fetch report data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchReportData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const avgReadiness = courses.length > 0 
        ? Math.round(courses.reduce((acc, c) => acc + (c.exam_readiness || 0), 0) / courses.length) 
        : 0;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold">Academic Performance Report</h1>
                </div>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Summary Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold uppercase tracking-tight">Weekly Study Progress</h2>
                                <p className="text-sm text-gray-500 font-medium">Activity from the last 7 days</p>
                            </div>
                            <div className="flex items-center text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                                <Calendar className="h-4 w-4 mr-2" />
                                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                        <div className="h-64">
                            <StudyActivityChart logs={stats?.recentLogs} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h2 className="text-xl font-bold mb-6">Course Mastery Breakdown</h2>
                        <div className="space-y-6">
                            {courses.map((course) => (
                                <div key={course.$id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                            <span className="font-bold text-sm">{course.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-blue-600">{course.exam_readiness || 0}% Ready</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${course.exam_readiness || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Readiness & Stats */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Overall Exam Readiness</h3>
                        <ReadinessChart percentage={avgReadiness} />
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-center">
                                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 font-bold uppercase">Consistency</p>
                                <p className="text-lg font-black">{avgReadiness > 50 ? 'High' : 'Moderate'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-center">
                                <Award className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 font-bold uppercase">Mastery</p>
                                <p className="text-lg font-black">{courses.length} Courses</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6">Learning Insights</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Active Streak</p>
                                    <p className="text-[10px] text-gray-500 font-medium">You've studied for {stats?.streak || 0} days in a row.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Materials Processed</p>
                                    <p className="text-[10px] text-gray-500 font-medium">{stats?.activityCount || 0} AI-powered study sessions logged.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
