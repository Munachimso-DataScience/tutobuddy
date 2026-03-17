'use client';

import React from 'react';
import { 
    Trophy, 
    Target, 
    Zap, 
    Star, 
    ArrowLeft,
    Clock,
    CheckCircle2,
    GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const SuccessStory = ({ name, quote, achievement, avatar }: any) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {name[0]}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
                <p className="text-xs text-blue-600 font-bold uppercase">{achievement}</p>
            </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 italic text-sm">"{quote}"</p>
    </div>
);

const TipCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="flex space-x-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all cursor-default group">
        <div className={`p-3 rounded-xl ${color} h-fit text-white group-hover:scale-110 transition-transform`}>
            <Icon size={20} />
        </div>
        <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default function SuccessTipsPage() {
    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-blue-600 mb-8 transition-colors group">
                <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm">Back to Dashboard</span>
            </Link>

            <div className="mb-12">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                    The Path to <span className="text-blue-600">A+ Performance</span> 🚀
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Thousands of students use TutorBuddy to turn their study materials into success stories. Here is how you can do it too.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Study Tips */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                        <Target className="mr-2 text-blue-600" /> Mastery Habits
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-4 border border-gray-100 dark:border-gray-800">
                        <TipCard 
                            icon={Clock} 
                            title="The Pomodoro Power" 
                            desc="Study for 25 minutes, then take a 5-minute break. This keeps your brain fresh and prevents burnout."
                            color="bg-red-500"
                        />
                        <TipCard 
                            icon={Zap} 
                            title="Active Recall" 
                            desc="Don't just read. Generate a quiz every 15 minutes to test what you just learned. Testing is 3x more effective than re-reading."
                            color="bg-yellow-500"
                        />
                        <TipCard 
                            icon={CheckCircle2} 
                            title="Spaced Repetition" 
                            desc="Review your weakest topics 24 hours later, then 3 days later, then 1 week later. This moves info to long-term memory."
                            color="bg-green-500"
                        />
                        <TipCard 
                            icon={Star} 
                            title="Teach the AI" 
                            desc="Write your essays as if you are teaching someone. The AI evaluation will show you exactly what details you missed."
                            color="bg-purple-500"
                        />
                    </div>
                </div>

                {/* Success Stories */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                        <Trophy className="mr-2 text-orange-500" /> Success Stories
                    </h3>
                    <div className="grid gap-4">
                        <SuccessStory 
                            name="Sarah J."
                            achievement="GPA Improved 3.2 → 3.9"
                            quote="TutorBuddy's essay feedback helped me realize I was missing technical terms in my Biology finals. I finally got an A!"
                        />
                        <SuccessStory 
                            name="Marcus T."
                            achievement="Passed Bar Exam on First Try"
                            quote="I uploaded 500 pages of law notes. Being able to generate instant MCQs on my phone while on the bus changed everything."
                        />
                        <SuccessStory 
                            name="Emeka O."
                            achievement="Top of Medicine Class"
                            quote="The 'Study 30 Minutes' tip is real. I stopped cramming for 10 hours and started studying 30 mins with the AI. It works."
                        />
                    </div>
                </div>
            </div>

            {/* Final Call to Action */}
            <div className="mt-16 bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white text-center shadow-xl shadow-blue-500/20">
                <GraduationCap size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-black mb-4">Your Success is Next.</h2>
                <p className="text-blue-100 mb-8 max-w-lg mx-auto">
                    Today's 30-minute session is the difference between passing and excelling. 
                    Choose a course, upload your material, and let's get to work.
                </p>
                <Link href="/dashboard/courses">
                    <button className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-all hover:scale-105 shadow-xl">
                        Start Studying Now
                    </button>
                </Link>
            </div>
        </div>
    );
}
