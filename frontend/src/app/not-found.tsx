'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617] p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 dark:bg-teal-600/10 rounded-full blur-3xl" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-2xl w-full text-center"
            >
                {/* 404 Floating Numbers */}
                <div className="relative mb-8 flex justify-center items-center">
                    <motion.h1 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                        className="text-[12rem] md:text-[16rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-teal-400 dark:from-blue-400 dark:to-teal-300 opacity-20 select-none"
                    >
                        404
                    </motion.h1>
                    <div className="absolute inset-0 flex items-center justify-center flex-col mt-8">
                        <div className="h-20 w-20 bg-white dark:bg-[#10161d] rounded-3xl shadow-xl flex items-center justify-center mb-6 rotate-12">
                            <Search className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Page Not Found
                        </h2>
                    </div>
                </div>

                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
                    Oops! It looks like you've wandered into unknown territory. The page you are looking for doesn't exist or has been moved.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold transition-all bg-white dark:bg-surface-2 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 shadow-sm flex items-center justify-center group"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        Go Back
                    </button>
                    
                    <Link href="/" className="w-full sm:w-auto">
                        <button className="w-full px-8 py-4 rounded-2xl font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 flex items-center justify-center group">
                            <Home className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                            Return Home
                        </button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
