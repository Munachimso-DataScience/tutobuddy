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
                // 409 means session already exists.
                // Note: Appwrite SDK might return code 409 or a specific type.
                if (loginError.code === 409 || loginError.type === 'user_session_already_exists') {
                    console.log('Session already exists, clearing old session...');
                    try {
                        await account.deleteSession('current');
                    } catch (e) {
                        console.warn('Could not delete current session:', e);
                    }
                    await account.createEmailPasswordSession(email, pass);
                    console.log('Session created after clearing');
                } else {
                    console.error('Appwrite login error:', loginError.message, loginError.type, loginError.code);
                    throw error;
                }
            }
            
            // Fix for Appwrite Web SDK localStorage fallback race condition
            // When third-party cookies are blocked, Appwrite uses localStorage.
            // A slight delay ensures the SDK attaches the fallback header to subsequent requests.
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const resolvedRole = await checkUser();
            if (!resolvedRole || resolvedRole === 'student') {
                // Verify user state was actually set, otherwise throw to prevent false positive redirect
                const currentUser = await account.get().catch(() => null);
                if (!currentUser) {
                    throw new Error("Session verification failed. Please try again.");
                }
            }
            return resolvedRole;
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
