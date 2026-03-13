'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { account } from '@/lib/appwrite';
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
            const response = await axios.get('http://localhost:5000/api/schedules', {
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
            await axios.post('http://localhost:5000/api/schedules', { 
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
            await axios.delete(`http://localhost:5000/api/schedules/${id}`, {
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

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading schedule...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-8 gap-4 overflow-x-auto min-w-[800px]">
                        <div className="pt-12">
                            {hoursArr.map((hour) => (
                                <div key={hour} className="h-20 text-xs font-bold text-gray-400 text-right pr-4 pt-2">
                                    {hour}
                                </div>
                            ))}
                        </div>
                        {days.map((dayName) => (
                            <div key={dayName} className="flex-1">
                                <h3 className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">
                                    {dayName.substring(0, 3)}
                                </h3>
                                <div className="border border-gray-50 dark:border-gray-800 rounded-2xl min-h-[600px] bg-gray-50/30 dark:bg-gray-900/30 relative">
                                    {schedules.filter(s => s.day === dayName).map((s) => {
                                        // Calculate position based on start time (assume 8am is top)
                                        const startHour = parseInt(s.start_time.split(':')[0]);
                                        const startMin = parseInt(s.start_time.split(':')[1]);
                                        const top = (startHour - 8) * 80 + (startMin / 60) * 80 + 48; // adjusted for header

                                        return (
                                            <motion.div 
                                                key={s.$id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute left-1 right-1 bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-600 p-3 rounded-r-xl shadow-sm cursor-pointer group hover:shadow-md transition-all z-10"
                                                style={{ top: `${top}px` }}
                                                onClick={() => {
                                                    if (confirm('Delete this session?')) handleDeleteSchedule(s.$id);
                                                }}
                                            >
                                                <p className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400">{s.start_time} - {s.end_time}</p>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">{s.title}</p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
