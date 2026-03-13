'use client';

import React from 'react';
import { BookOpen, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CourseCardProps {
    course: {
        $id: string;
        title: string;
        code: string;
        description: string;
        progress?: number;
    };
}

export default function CourseCard({ course }: CourseCardProps) {
    return (
        <Link href={`/dashboard/courses/${course.$id}`} className="block">
            <motion.div
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer group transition-all"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                        <BookOpen className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onClick={(e) => e.preventDefault()}>
                        <MoreVertical className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md">
                            {course.code}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                        {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 italic">
                        {course.description || 'No description provided.'}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">Completion</span>
                        <span className="text-xs font-bold text-blue-600">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress || 0}%` }}
                            className="bg-blue-600 h-full rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
