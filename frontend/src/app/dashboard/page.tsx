'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    TrendingUp,
    BookOpen,
    Trophy,
    Clock,
    ArrowUpRight
} from 'lucide-react';

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

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        You're on a 12-day study streak. Keep it up!
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
                        View Reports
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                        Start Studying
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={BookOpen}
                    label="Active Courses"
                    value="4"
                    color="bg-blue-600"
                />
                <StatCard
                    icon={Trophy}
                    label="Learning Streak"
                    value="12 Days"
                    trend="+2 today"
                    color="bg-orange-500"
                />
                <StatCard
                    icon={Clock}
                    label="Total Study Time"
                    value="48.5h"
                    trend="+4h this week"
                    color="bg-purple-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Average Score"
                    value="84%"
                    color="bg-emerald-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Activity</h3>
                            <p className="text-sm text-gray-500 font-medium">Weekly hours spent learning</p>
                        </div>
                        <select className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs font-bold px-3 py-2 focus:ring-2 focus:ring-blue-500">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <StudyActivityChart />
                </div>

                {/* Readiness & Goals */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                        <ReadinessChart percentage={78} />
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500 font-medium px-4">
                                You are <span className="text-blue-600 font-bold">78% ready</span> for your final examinations. Focus on <span className="text-gray-900 dark:text-white font-bold">Quantum Mechanics</span>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-1">Pro Tip</h3>
                            <p className="text-blue-100 text-sm font-medium leading-relaxed">
                                Students who study at least 30 minutes a day are 4x more likely to pass their finals.
                            </p>
                            <button className="mt-6 bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-lg">
                                Learn More
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <TrendingUp className="h-32 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            <AnalyticsDashboard />
        </div>
    );
}

import { BarChart3 } from 'lucide-react';
