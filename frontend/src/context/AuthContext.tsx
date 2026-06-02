'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { account, clearCachedJWT, getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Models } from 'appwrite';

type UserRole = 'student' | 'lecturer' | 'admin';

type UserProfile = {
    role?: UserRole;
    full_name?: string;
    school?: string;
    course_of_study?: string;
    department?: string;
    class_group?: string;
    assigned_courses?: string;
    current_streak?: number;
    last_active?: string;
};

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    profile: UserProfile | null;
    role: UserRole;
    loading: boolean;
    login: (email: string, pass: string) => Promise<UserRole>;
    logout: () => Promise<void>;
    checkUser: () => Promise<UserRole>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [role, setRole] = useState<UserRole>('student');
    const [loading, setLoading] = useState(true);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const checkUser = async (): Promise<UserRole> => {
        try {
            console.log('Checking for active session...');
            const currentUser = await account.get();
            console.log('Active session found for:', currentUser.email);
            setUser(currentUser);
            try {
                const jwt = await getCachedJWT();
                const response = await axios.get(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
                const loadedProfile = response.data?.profile as UserProfile | null;
                const resolvedRole = (response.data?.role || loadedProfile?.role || 'student') as UserRole;
                setProfile(loadedProfile);
                setRole(resolvedRole);
                return resolvedRole;
            } catch (profileError) {
                console.warn('Could not load user profile role from backend, retrying with a fresh JWT:', profileError);
                try {
                    clearCachedJWT();
                    const freshJwt = await getCachedJWT();
                    const response = await axios.get(`${API_URL}/api/auth/me`, {
                        headers: { Authorization: `Bearer ${freshJwt}` }
                    });
                    const loadedProfile = response.data?.profile as UserProfile | null;
                    const resolvedRole = (response.data?.role || loadedProfile?.role || 'student') as UserRole;
                    setProfile(loadedProfile);
                    setRole(resolvedRole);
                    return resolvedRole;
                } catch (retryError) {
                    console.warn('Could not load user profile role from backend after retry, defaulting to student:', retryError);
                    setProfile(null);
                    setRole('student');
                    return 'student';
                }
            }
        } catch (error: unknown) {
            const authError = error as { message?: string };
            console.log('No active session or error:', authError.message);
            setUser(null);
            setProfile(null);
            setRole('student');
            return 'student';
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        console.log('Attempting login for:', email);
        try {
            clearCachedJWT();

            try {
                await account.createEmailPasswordSession(email, pass);
                console.log('Session created successfully');
            } catch (error: unknown) {
                const loginError = error as { code?: number; type?: string; message?: string };
                // 409 = session already exists, 401 = stale/conflicting session
                if (loginError.code === 409 || loginError.code === 401 || loginError.type === 'user_session_already_exists') {
                    console.log('Session conflict detected (code:', loginError.code, '), clearing and retrying...');
                    try {
                        await account.deleteSession('current');
                    } catch (e) {
                        console.warn('Could not delete current session:', e);
                    }
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await account.createEmailPasswordSession(email, pass);
                    console.log('Session created after clearing');
                } else {
                    console.error('Appwrite login error:', loginError.message, loginError.type, loginError.code);
                    throw error;
                }
            }
            
            // Fix for Appwrite Cloud replication lag & localStorage fallback race condition.
            // When a session is created, read replicas can take a few seconds to accept it.
            // Retry longer before giving up so the session has time to settle.
            let resolvedRole: 'student' | 'lecturer' | 'admin' | null = null;
            let retryCount = 0;
            const maxRetries = 10;
            let currentUser = null;
            
            while (retryCount < maxRetries) {
                const delay = Math.min(1000 + retryCount * 500, 3000);
                await sleep(delay);
                console.log(`Verifying session... (Attempt ${retryCount + 1}/${maxRetries})`);
                
                try {
                    currentUser = await account.get();
                    if (currentUser) {
                        resolvedRole = await checkUser();
                        break;
                    }
                } catch (e) {
                    console.log('Session verification pending replica sync...', e);
                }
                retryCount++;
            }

            if (!currentUser) {
                clearCachedJWT();
                throw new Error("Session verification failed after multiple attempts. Please try logging in again.");
            }
            
            return resolvedRole || 'student';
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await account.deleteSession('current');
            console.log('Logged out');
            setUser(null);
            setProfile(null);
            setRole('student');
            clearCachedJWT();
        } catch (error) {
            console.error('Logout error:', error);
            // Even if session delete fails, clear user state
            setUser(null);
            setProfile(null);
            setRole('student');
            clearCachedJWT();
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, role, loading, login, logout, checkUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
