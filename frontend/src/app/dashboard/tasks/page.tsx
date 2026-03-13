'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Tag, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TasksPage() {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Complete Physics Assignment', course: 'PHY101', deadline: 'Today', priority: 'High', completed: false },
        { id: 2, title: 'Read Chapter 4 of Sociology', course: 'SOC202', deadline: 'Tomorrow', priority: 'Medium', completed: true },
        { id: 3, title: 'Draft Lab Report', course: 'CHE303', deadline: 'Friday', priority: 'High', completed: false },
        { id: 4, title: 'Calculus Quiz Prep', course: 'MAT101', deadline: 'Monday', priority: 'Low', completed: false },
    ]);

    const toggleTask = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: number) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Active Tasks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your coursework and upcoming deadlines.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                    <Plus className="mr-2 h-5 w-5" />
                    New Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group p-6 rounded-2xl border transition-all duration-200 ${task.completed 
                                    ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800' 
                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button 
                                            onClick={() => toggleTask(task.id)}
                                            className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-blue-500'}`}
                                        >
                                            {task.completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                                        </button>
                                        <div>
                                            <h3 className={`font-bold transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                {task.title}
                                            </h3>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                    {task.course}
                                                </span>
                                                <span className="flex items-center text-xs text-gray-400 font-medium">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {task.deadline}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => deleteTask(task.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
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
                                <span className="text-lg font-bold text-red-600">2</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                <div className="flex items-center">
                                    <Tag className="h-5 w-5 text-blue-600 mr-2" />
                                    <span className="text-sm font-bold text-blue-900 dark:text-blue-400">Total Tasks</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{tasks.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
