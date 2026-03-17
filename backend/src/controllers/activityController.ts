import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

export const logActivity = async (req: any, res: any) => {
    try {
        const { type, details } = req.body;
        
        if (!req.user || !req.user.$id) {
            console.error('Auth Error: No user in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.$id;

        console.log(`Logging activity: ${type} for user: ${userId}`);
        
        let logDetails = details ? JSON.stringify(details) : '{}';
        if (logDetails.length > 4900) {
            logDetails = logDetails.substring(0, 4900) + '... (truncated)';
        }

        if (!DATABASE_ID || !COLLECTIONS.ACTIVITY) {
            console.error('Configuration Error: DATABASE_ID or COLLECTIONS.ACTIVITY is missing');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const log = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.ACTIVITY,
            ID.unique(),
            {
                user_id: userId,
                type: type || 'activity',
                description: type || 'User activity session',
                details: logDetails,
                timestamp: new Date().toISOString()
            }
        ).catch(err => {
            console.error('Appwrite createDocument Error (Activity):', err.message);
            throw err;
        });

        let finalStreak = 0;
        try {
            const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
            const lastActiveStr = profile.last_active;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let currentStreak = Number(profile.current_streak) || 0;
            let newStreak = currentStreak;
            
            if (lastActiveStr) {
                const lastActiveDate = new Date(lastActiveStr);
                if (!isNaN(lastActiveDate.getTime())) {
                    lastActiveDate.setHours(0, 0, 0, 0);
                    const diffTime = today.getTime() - lastActiveDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        newStreak = currentStreak + 1;
                    } else if (diffDays > 1) {
                        newStreak = 1;
                    }
                } else {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }
            
            finalStreak = newStreak;

            await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
                last_active: new Date().toISOString(),
                current_streak: finalStreak
            });
        } catch (profileError: any) {
            console.warn(`Non-critical profile error: ${profileError.message}`);
        }

        res.status(201).json({ log, streak: finalStreak });
    } catch (error: any) {
        console.error('CRITICAL Activity Log Error:', error);
        res.status(500).json({ 
            error: 'Failed to log activity',
            message: error.message
        });
    }
};

export const getStats = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        let profile;
        try {
            profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
        } catch (e) {
            profile = {
                current_streak: 0,
                last_active: new Date().toISOString()
            };
        }

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const logs = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ACTIVITY,
            [
                Query.equal('user_id', userId),
                Query.greaterThan('timestamp', lastWeek.toISOString()),
                Query.limit(100)
            ]
        );

        // 1. Calculate Study Time (Sum of all 'study_session' durations)
        const studyLogs = logs.documents.filter(log => log.type === 'study_session');
        const totalMinutes = studyLogs.reduce((acc, log) => {
            try {
                const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                return acc + (Number(details?.duration) || 0);
            } catch (e) {
                return acc;
            }
        }, 0);
        const studyTimeStr = totalMinutes >= 60 
            ? `${(totalMinutes / 60).toFixed(1)}h` 
            : `${totalMinutes}m`;

        // 2. Fetch Quiz Scores for Average
        const quizzes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            [
                Query.equal('user_id', userId),
                Query.limit(50)
            ]
        );

        let avgScore = 0;
        if (quizzes.total > 0) {
            const totalScore = quizzes.documents.reduce((acc, q) => acc + (Number(q.score) || 0), 0);
            avgScore = Math.round(totalScore / quizzes.total);
        }

        res.status(200).json({
            streak: profile.current_streak,
            lastActive: profile.last_active,
            activityCount: logs.total,
            recentLogs: logs.documents,
            studyTime: studyTimeStr,
            avgScore: `${avgScore}%`
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
