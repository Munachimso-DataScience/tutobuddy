'use client';

import React, { useState } from 'react';
import { 
    Trophy, 
    Medal, 
    Crown, 
    TrendingUp, 
    Search,
    ArrowLeft,
    Star,
    Zap,
    Flame
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const RankCard = ({ rank, name, xp, courses, streak, isUser }: any) => (
    <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center p-5 rounded-3xl mb-4 transition-all ${
            isUser 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105 z-10' 
                : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
        }`}
    >
        <div className="w-12 flex justify-center font-black text-xl italic">
            {rank === 1 ? <Crown className="text-yellow-400" /> : rank === 2 ? <Medal className="text-gray-300" /> : rank === 3 ? <Medal className="text-orange-400" /> : `#${rank}`}
        </div>
        
        <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-6 overflow-hidden">
            <div className={`h-full w-full flex items-center justify-center font-bold text-lg ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {name[0]}
            </div>
        </div>

        <div className="flex-1">
            <h4 className="font-black text-sm md:text-base tracking-tight">{name} {isUser && "(You)"}</h4>
            <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest mt-1 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
                <span>{courses} Courses</span>
                <span className="flex items-center text-orange-500"><Flame size={12} className="mr-1" /> {streak}d</span>
            </div>
        </div>

        <div className="text-right">
            <div className="text-lg font-black tracking-tighter">{xp.toLocaleString()}</div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${isUser ? 'text-blue-100' : 'text-blue-600'}`}>Total XP</div>
        </div>
    </motion.div>
);

export default function LeaderboardPage() {
    const [mockUsers] = useState([
        { rank: 1, name: "Chinedu Okechi", xp: 12450, courses: 14, streak: 28 },
        { rank: 2, name: "Aisha Mohammed", xp: 11200, courses: 9, streak: 15 },
        { rank: 3, name: "Blessing Eze", xp: 9800, courses: 12, streak: 42 },
        { rank: 4, name: "You", xp: 8450, courses: 5, streak: 7, isUser: true },
        { rank: 5, name: "Samuel Okoro", xp: 7900, courses: 8, streak: 4 },
        { rank: 6, name: "Tunde Bakare", xp: 7100, courses: 6, streak: 12 },
    ]);

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-blue-600 mb-4 transition-colors group">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Dashboard</span>
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                        Global <span className="text-blue-600">Leaderboard</span> 🏆
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">See how you rank against students across the country.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-3xl border border-orange-100 dark:border-orange-900 flex items-center gap-4">
                        <div className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Global Rank</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">#245</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* League Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {['Titan League', 'Gold League', 'Freshman'].map((league, i) => (
                    <button key={league} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                        i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-900 text-gray-500 border border-gray-100 dark:border-gray-800'
                    }`}>
                        {league}
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-[2.5rem] p-4 md:p-8 border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-8 px-4">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">Top Scholars</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                            placeholder="Find student..."
                            className="pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none w-40 md:w-64"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    {mockUsers.map((u) => (
                        <RankCard key={u.rank} {...u} />
                    ))}
                </div>

                <div className="mt-12 text-center p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-dashed border-blue-200 dark:border-blue-800">
                    <Star className="mx-auto mb-4 text-blue-600" size={32} />
                    <h4 className="font-black text-gray-900 dark:text-white mb-2 italic">Want to climb faster?</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                        Complete your **Daily Quests** to earn bonus XP and move up to the Gold League!
                    </p>
                    <Link href="/dashboard" className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">
                        Go to Quests
                    </Link>
                </div>
            </div>
        </div>
    );
}
