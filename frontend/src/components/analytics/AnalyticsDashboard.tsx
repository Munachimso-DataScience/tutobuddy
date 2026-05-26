'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Target, TrendingDown } from 'lucide-react';

type AnalyticsAnalysis = {
    weaknesses?: string[];
    recommendations?: string | string[];
};

export default function AnalyticsDashboard() {
    const [analysis, setAnalysis] = useState<AnalyticsAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const jwt = await getCachedJWT();
                const res = await axios.get(`${API_URL}/api/analytics/weaknesses`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
                setAnalysis(res.data);
            } catch {
                setError('Analytics are not available right now.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    const recommendationText = Array.isArray(analysis?.recommendations)
        ? analysis?.recommendations.join(' ')
        : analysis?.recommendations;

    if (loading) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weakness Areas</h3>
                </div>
                
                <div className="space-y-4">
                    {error ? (
                        <p className="text-gray-500 text-sm font-medium">{error}</p>
                    ) : analysis?.weaknesses?.length > 0 ? (
                        analysis.weaknesses.map((w: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{w}</span>
                                <span className="text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-full uppercase tracking-wider">Focus Needed</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm font-medium">Not enough data to identify weaknesses yet. Keep practicing!</p>
                    )}
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                        <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Recommendation</h3>
                </div>
                
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-blue-800 dark:text-blue-400 text-sm font-medium leading-relaxed">
                        {recommendationText || "Complete more quizzes to receive personalized AI study recommendations."}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
