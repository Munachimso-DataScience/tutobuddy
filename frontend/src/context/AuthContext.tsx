'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { Models } from 'appwrite';

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    checkUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);

    const checkUser = async () => {
        try {
            console.log('Checking for active session...');
            const currentUser = await account.get();
            console.log('Active session found for:', currentUser.email);
            setUser(currentUser);
        } catch (error: any) {
            console.log('No active session or error:', error.message);
            setUser(null);
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
            try {
                await account.createEmailPasswordSession(email, pass);
                console.log('Session created successfully');
            } catch (error: any) {
                // 409 means session already exists.
                // Note: Appwrite SDK might return code 409 or a specific type.
                if (error.code === 409 || error.type === 'user_session_already_exists') {
                    console.log('Session already exists, clearing old session...');
                    try {
                        await account.deleteSession('current');
                    } catch (e) {
                        console.warn('Could not delete current session:', e);
                    }
                    await account.createEmailPasswordSession(email, pass);
                    console.log('Session created after clearing');
                } else {
                    console.error('Appwrite login error:', error.message, error.type, error.code);
                    throw error;
                }
            }
            await checkUser();
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
        } catch (error) {
            console.error('Logout error:', error);
            // Even if session delete fails, clear user state
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkUser }}>
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
