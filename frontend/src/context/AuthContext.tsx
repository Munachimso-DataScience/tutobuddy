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
        // 1. Check if we have a mock session in local storage
        const mockSession = typeof window !== 'undefined' ? localStorage.getItem('dev_mock_user') : null;
        if (mockSession) {
            setUser(JSON.parse(mockSession));
            setLoading(false);
            return;
        }

        try {
            const currentUser = await account.get();
            setUser(currentUser);
        } catch (error) {
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
        try {
            // DEVELOPER MOCK BYPASS
            if (email === 'peterkehindeademola@gmail.com' && pass === 'kehinde5@') {
                const mockUser: any = {
                    $id: 'mock_123',
                    name: 'Peter Kehinde Ademola',
                    email: email,
                    prefs: {},
                    registration: new Date().toISOString(),
                    status: true,
                    labels: ['mock']
                };
                localStorage.setItem('dev_mock_user', JSON.stringify(mockUser));
                setUser(mockUser);
                setLoading(false);
                return;
            }

            await account.createEmailPasswordSession(email, pass);
            await checkUser();
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            localStorage.removeItem('dev_mock_user');
            // Try to delete Appwrite session if it exists, otherwise ignore error
            try {
                await account.deleteSession('current');
            } catch (e) {}
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
