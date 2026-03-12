'use client';

import { useEffect, useRef } from 'react';
import axios from 'axios';

export const useStudyHeartbeat = (courseId: string) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!courseId) return;

        const logSession = async () => {
            try {
                const token = localStorage.getItem('appwrite_session');
                await axios.post('http://localhost:5000/api/activity/log', {
                    type: 'study_session',
                    details: { courseId, duration: 5 } // Log in 5-minute increments
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Heartbeat error:', error);
            }
        };

        // Initial log
        logSession();

        // Repeat every 5 minutes
        timerRef.current = setInterval(logSession, 5 * 60 * 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [courseId]);
};
