'use client';

import React, { useState } from 'react';
import { account, databases } from '@/lib/appwrite';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { User, Mail, Lock, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { ID as AppwriteID } from 'appwrite';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [school, setSchool] = useState('');
    const [course, setCourse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Create Appwrite Account
            const userAccount = await account.create(AppwriteID.unique(), email, password, fullName);

            // 2. Login (Handle active sessions)
            try {
                await account.createEmailPasswordSession(email, password);
            } catch (error: any) {
                if (error.code === 401 || error.type === 'general_session_already_exists') {
                    try { await account.deleteSession('current'); } catch (e) {}
                    await account.createEmailPasswordSession(email, password);
                } else {
                    throw error;
                }
            }

            // 3. Create Profile in Database
            await databases.createDocument(
                process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS!,
                userAccount.$id,
                {
                    user_id: userAccount.$id,
                    full_name: fullName,
                    school: school,
                    course_of_study: course,
                    current_streak: 0,
                    last_active: new Date().toISOString()
                }
            );

            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Registration Error:', error);
            if (error?.code === 409) {
                toast.error('An account with this email already exists. Please login instead.');
            } else if (error?.code === 400) {
                toast.error('Invalid registration data. Please check your inputs.');
            } else {
                toast.error(error.message || 'Registration failed. Please check your connection.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl"
            >
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Create Your Account
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Join thousands of students studying smarter
                    </p>
                </div>

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Full Name"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div className="relative">
                            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={school}
                                onChange={(e) => setSchool(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="University Name"
                            />
                        </div>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={course}
                                onChange={(e) => setCourse(e.target.value)}
                                className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Course of Study"
                            />
                        </div>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none rounded-lg relative block w-full pl-10 px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Password (min 8 chars)"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </a>
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
