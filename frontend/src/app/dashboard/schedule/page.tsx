'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { account } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { toast } from 'react-toastify';

export default function SchedulePage() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hoursArr = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [day, setDay] = useState('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:30');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            const { jwt } = await account.createJWT();
            const response = await axios.get(`${API_URL}/api/schedules`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setSchedules(response.data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { jwt } = await account.createJWT();
            await axios.post(`${API_URL}/api/schedules`, { 
                title, day, start_time: startTime, end_time: endTime 
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success('Schedule added!');
            setIsModalOpen(false);
            setTitle('');
            fetchSchedules();
        } catch (error) {
            toast.error('Failed to add schedule');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        try {
            const { jwt } = await account.createJWT();
            await axios.delete(`${API_URL}/api/schedules/${id}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setSchedules(schedules.filter(s => s.$id !== id));
            toast.success('Schedule removed');
        } catch (error) {
            toast.error('Failed to remove schedule');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Study Schedule</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Plan your study sessions and stay on track.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Session
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {days.map((dayName) => {
                    const sessions = schedules.filter(s => s.day === dayName);
                    return (
                        <div key={dayName} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-lg">{dayName}</h3>
                                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black py-1 rounded-full px-3">
                                    {sessions.length} SESSIONS
                                </span>
                            </div>

                            <div className="space-y-4 flex-1">
                                {sessions.length > 0 ? (
                                    sessions.map((s) => (
                                        <motion.div 
                                            key={s.$id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="group relative p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-default"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {s.start_time} - {s.end_time}
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2">{s.title}</h4>
                                                </div>
                                                <button 
                                                    onClick={() => {
                                                        if (confirm('Delete this session?')) handleDeleteSchedule(s.$id);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 transition-all rounded-lg hover:bg-red-50"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-24 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center">
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Rest Day</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => {
                                    setDay(dayName);
                                    setIsModalOpen(true);
                                }}
                                className="mt-6 w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
                            >
                                <Plus size={14} className="group-hover:scale-125 transition-transform" />
                                Add Session
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* New Schedule Modal */}
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
                                <h3 className="text-lg font-bold">Add Study Session</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddSchedule} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Session Title</label>
                                    <input
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        placeholder="e.g. Physics Review"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Day</label>
                                        <select
                                            value={day}
                                            onChange={(e) => setDay(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        >
                                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Time</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Time</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Save Session'}
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
