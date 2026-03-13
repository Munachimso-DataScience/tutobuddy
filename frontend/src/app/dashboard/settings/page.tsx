'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Shield, Bell, Moon, Sun, Monitor, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and system settings.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <User className="h-5 w-5 mr-2 text-blue-600" />
                            Profile Information
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                    <input 
                                        type="text" 
                                        defaultValue={user?.name || ''} 
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                                    <input 
                                        type="email" 
                                        defaultValue={user?.email || ''} 
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl text-gray-400 cursor-not-allowed font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* App Settings */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-lg font-bold mb-6 flex items-center">
                            <Monitor className="h-5 w-5 mr-2 text-purple-600" />
                            Appearance
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">Dark Mode</p>
                                <p className="text-xs text-gray-500 mt-0.5">Adjust the interface theme to your preference.</p>
                            </div>
                            <div className="flex bg-white dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                                <button className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-md">
                                    <Sun className="h-4 w-4" />
                                </button>
                                <button className="p-2 text-gray-400">
                                    <Moon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="font-bold mb-2">Save Changes</h3>
                        <p className="text-blue-100 text-xs mb-4">You have unsaved changes in your profile information.</p>
                        <button 
                            className="w-full bg-white text-blue-600 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-blue-50 transition-all flex items-center justify-center"
                            onClick={() => toast.info("Settings saved successfully!")}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
