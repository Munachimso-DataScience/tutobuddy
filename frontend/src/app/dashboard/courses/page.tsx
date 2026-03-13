'use client';

import React, { useState, useEffect } from 'react';
import { account } from '@/lib/appwrite';
import CourseCard from '@/components/courses/CourseCard';
import { Plus, Search, Loader2, X, BookPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function CoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Course Form State
    const [title, setTitle] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const { jwt } = await account.createJWT();
            const response = await axios.get('http://localhost:5000/api/courses', {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { jwt } = await account.createJWT();
            const formData = new FormData();
            formData.append('title', title);
            formData.append('code', code);
            formData.append('description', description);
            if (file) {
                formData.append('file', file);
            }

            await axios.post('http://localhost:5000/api/courses', formData, {
                headers: { 
                    Authorization: `Bearer ${jwt}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('Course added successfully!');
            setIsModalOpen(false);
            fetchCourses();
            // Reset form
            setTitle('');
            setCode('');
            setDescription('');
            setFile(null);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to add course');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage all your academic courses in one place.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    New Course
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by course name or code..."
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 animate-pulse">Loading courses...</p>
                </div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <CourseCard key={course.$id} course={course} />
                    ))}
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 p-20 text-center flex flex-col items-center"
                >
                    <div className="h-20 w-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                        <BookPlus className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">No courses yet</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        Add your first course to start tracking your progress and generating study materials.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-8 text-blue-600 font-bold hover:underline"
                    >
                        Click here to add your first course
                    </button>
                </motion.div>
            )}

            {/* Add Course Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                                <h3 className="text-lg font-bold">Add New Course</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddCourse} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course Name</label>
                                    <input
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        placeholder="e.g. Introduction to Physics"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course Code</label>
                                    <input
                                        required
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        placeholder="e.g. PHY101"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        placeholder="Briefly describe what this course covers..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Initial Study Material (Optional)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            accept=".pdf,.docx,.doc,.txt"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">Supported formats: PDF, DOCX, TXT (Max 10MB)</p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Course'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
