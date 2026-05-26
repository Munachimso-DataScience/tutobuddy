'use client';

import React, { useState } from 'react';
import { BookOpen, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { account } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import axios from 'axios';
import { toast } from 'react-toastify';

interface CourseCardProps {
    course: {
        $id: string;
        title: string;
        code: string;
        description: string;
        progress?: number;
    };
    onDelete?: () => void;
}

export default function CourseCard({ course, onDelete }: CourseCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }

        setIsDeleting(true);
        try {
            const { jwt } = await account.createJWT();
            await axios.delete(`${API_URL}/api/courses/${course.$id}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success('Course deleted');
            if (onDelete) onDelete();
        } catch { 
            toast.error('Failed to delete course');
        } finally {
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    return (
        <Link href={`/dashboard/courses/${course.$id}`} className="block">
            <motion.div
                whileHover={{ y: -5 }}
                className="bg-surface/90 dark:bg-surface-2/90 rounded-3xl p-6 shadow-sm border border-primary/10 dark:border-primary/20 cursor-pointer group transition-all"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors">
                        <BookOpen className="h-6 w-6 text-secondary group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button 
                            disabled={isDeleting}
                            onClick={handleDelete}
                            onMouseLeave={() => setShowConfirm(false)}
                            className={`p-2 rounded-xl transition-all flex items-center ${
                                showConfirm 
                                    ? 'bg-red-600 text-white' 
                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                            }`}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : showConfirm ? (
                                <span className="text-[10px] font-bold px-1">Confirm Delete?</span>
                            ) : (
                                <Trash2 className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 px-2 py-1 rounded-md">
                            {course.code}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground dark:text-cream line-clamp-1">
                        {course.title}
                    </h3>
                    <p className="text-sm text-foreground/60 dark:text-cream/60 line-clamp-2 h-10 italic">
                        {course.description || 'No description provided.'}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-primary/10 dark:border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-foreground/55">Completion</span>
                        <span className="text-xs font-bold text-secondary">{course.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-background/70 dark:bg-background/20 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress || 0}%` }}
                            className="bg-secondary h-full rounded-full"
                        />
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
