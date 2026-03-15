import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

export const logActivity = async (req: any, res: any) => {
    try {
        const { type, details } = req.body;
        const userId = req.user.$id;

        console.log(`Logging activity: ${type} for user: ${userId}`);
        
        // Truncate details if they are too long for the 5000 character limit in DB
        let logDetails = JSON.stringify(details);
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
                type,
                details: logDetails,
                timestamp: new Date().toISOString()
            }
        ).catch(err => {
            console.error('Appwrite createDocument Error (Activity):', err.message);
            throw err;
        });

        console.log(`Activity logged with ID: ${log.$id}`);

        let finalStreak = 0;
        // Update last_active and check streak
        try {
            const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
            
            const lastActiveStr = profile.last_active;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let currentStreak = Number(profile.current_streak);
            if (isNaN(currentStreak)) currentStreak = 0;

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
            console.log(`Streak updated: ${finalStreak}`);
        } catch (profileError: any) {
            console.warn(`Non-critical profile error: ${profileError.message}`);
        }

        res.status(201).json({ log, streak: finalStreak });
    } catch (error: any) {
        console.error('CRITICAL Activity Log Error:', error);
        res.status(500).json({ 
            error: 'Failed to log activity',
            message: error.message,
            stack: error.stack,
            at: new Date().toISOString()
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
            // Default profile if not found
            profile = {
                current_streak: 0,
                last_active: new Date().toISOString()
            };
        }

        // Get activity counts for the last 7 days
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const logs = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.ACTIVITY,
            [
                Query.equal('user_id', userId),
                Query.greaterThan('timestamp', lastWeek.toISOString())
            ]
        );

        res.status(200).json({
            streak: profile.current_streak,
            lastActive: profile.last_active,
            activityCount: logs.total,
            recentLogs: logs.documents
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
