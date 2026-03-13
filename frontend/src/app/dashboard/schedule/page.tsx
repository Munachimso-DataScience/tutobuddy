'use client';

import React from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SchedulePage() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Schedule</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Plan your study sessions and stay on track.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Session
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-bold">March 2026</h2>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                        <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Day</button>
                        <button className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-700 text-blue-600 rounded-lg shadow-sm">Week</button>
                        <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Month</button>
                    </div>
                </div>

                <div className="grid grid-cols-8 gap-4 overflow-x-auto min-w-[800px]">
                    <div className="pt-12">
                        {hours.map((hour) => (
                            <div key={hour} className="h-20 text-xs font-bold text-gray-400 text-right pr-4 pt-2">
                                {hour}
                            </div>
                        ))}
                    </div>
                    {days.map((day) => (
                        <div key={day} className="flex-1">
                            <h3 className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">
                                {day.substring(0, 3)}
                            </h3>
                            <div className="border border-gray-50 dark:border-gray-800 rounded-2xl min-h-[600px] bg-gray-50/30 dark:bg-gray-900/30 relative">
                                {day === 'Monday' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute top-20 left-1 right-1 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 p-3 rounded-r-xl shadow-sm cursor-pointer group hover:shadow-md transition-all"
                                    >
                                        <p className="text-xs font-extrabold text-blue-700 dark:text-blue-400">09:00 - 10:30</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">Quantum Physics</p>
                                    </motion.div>
                                )}
                                {day === 'Wednesday' && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute top-60 left-1 right-1 bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-600 p-3 rounded-r-xl shadow-sm cursor-pointer group hover:shadow-md transition-all"
                                    >
                                        <p className="text-xs font-extrabold text-purple-700 dark:text-purple-400">14:00 - 15:30</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">Calculus III</p>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
