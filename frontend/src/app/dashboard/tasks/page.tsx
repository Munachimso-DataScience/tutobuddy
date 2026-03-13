'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Tag, Trash2, AlertCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { account } from '@/lib/appwrite';
import { toast } from 'react-toastify';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // New Task Form
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { jwt } = await account.createJWT();
            const response = await axios.get('http://localhost:5000/api/tasks', {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { jwt } = await account.createJWT();
            await axios.post('http://localhost:5000/api/tasks', { 
                title, 
                due_date: dueDate, 
                priority 
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success('Task added successfully!');
            setIsModalOpen(false);
            setTitle('');
            setDueDate('');
            setPriority('medium');
            fetchTasks();
        } catch (error) {
            toast.error('Failed to add task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTask = async (task: any) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            const { jwt } = await account.createJWT();
            await axios.patch(`http://localhost:5000/api/tasks/${task.$id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setTasks(tasks.map(t => t.$id === task.$id ? { ...t, status: newStatus } : t));
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            const { jwt } = await account.createJWT();
            await axios.delete(`http://localhost:5000/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setTasks(tasks.filter(t => t.$id !== id));
            toast.success('Task deleted');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your coursework and upcoming deadlines.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    New Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-500">Loading tasks...</p>
                        </div>
                    ) : tasks.length > 0 ? (
                        <AnimatePresence>
                            {tasks.map((task) => (
                                <motion.div
                                    key={task.$id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={`group p-6 rounded-2xl border transition-all duration-200 ${task.status === 'completed'
                                        ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800' 
                                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <button 
                                                onClick={() => toggleTask(task)}
                                                className={`transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                                            >
                                                {task.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                            </button>
                                            <div>
                                                <h3 className={`font-bold transition-all ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                                        task.priority === 'High' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' :
                                                        task.priority === 'Medium' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' :
                                                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                                    }`}>
                                                        {task.priority || 'Medium'}
                                                    </span>
                                                    {task.due_date && (
                                                        <span className="flex items-center text-xs text-gray-400 font-medium">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleDeleteTask(task.$id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                            <p className="text-gray-500">No tasks found. Add a new task to get started!</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-4">Task Summary</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                <div className="flex items-center">
                                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                    <span className="text-sm font-bold text-red-900 dark:text-red-400">High Priority</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">
                                    {tasks.filter(t => t.priority === 'High' && t.status !== 'completed').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                <div className="flex items-center">
                                    <Tag className="h-5 w-5 text-blue-600 mr-2" />
                                    <span className="text-sm font-bold text-blue-900 dark:text-blue-400">Total Pending</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">
                                    {tasks.filter(t => t.status !== 'completed').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Task Modal */}
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
                                <h3 className="text-lg font-bold">Create New Task</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddTask} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Task Title</label>
                                    <input
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                        placeholder="e.g. Finish Calculus Homework"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Due Date</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl transition-all"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Task'}
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
