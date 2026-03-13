'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { account } from '@/lib/appwrite';
import { Target, TrendingDown, BookOpen, Award } from 'lucide-react';

export default function AnalyticsDashboard() {
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const { jwt } = await account.createJWT();
                const res = await axios.get('http://localhost:5000/api/analytics/weaknesses', {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
                setAnalysis(res.data);
            } catch (error) {
                console.error('Failed to fetch analytics');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    if (loading) return <div>Loading Analytics...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">Weakness Areas</h3>
                </div>
                
                <div className="space-y-4">
                    {analysis?.weaknesses?.length > 0 ? (
                        analysis.weaknesses.map((w: string, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                <span className="font-semibold capitalize">{w}</span>
                                <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Focus Needed</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">Not enough data to identify weaknesses yet. Keep practicing!</p>
                    )}
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                        <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold">AI Recommendation</h3>
                </div>
                
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                        {analysis?.recommendations || "Complete more quizzes to receive personalized AI study recommendations."}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
