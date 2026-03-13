import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_ACTIVITY = 'activity_logs';
const COLLECTION_PROFILES = 'users_profiles';

export const logActivity = async (req: any, res: any) => {
    try {
        const { type, details } = req.body;
        const userId = req.user.$id;

        const log = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ACTIVITY,
            ID.unique(),
            {
                user_id: userId,
                type,
                description: JSON.stringify(details),
                timestamp: new Date().toISOString()
            }
        );

        // Update last_active and check streak
        const profile = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, userId);
        const lastActive = new Date(profile.last_active);
        const today = new Date();

        // Simple streak logic: if last active was yesterday, increment. If today, stay. If older, reset.
        const diffTime = Math.abs(today.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newStreak = profile.current_streak;
        if (diffDays === 1) {
            newStreak += 1;
        } else if (diffDays > 1) {
            newStreak = 1;
        }

        await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, userId, {
            last_active: today.toISOString(),
            current_streak: newStreak
        });

        res.status(201).json({ log, streak: newStreak });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getStats = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        let profile;
        try {
            profile = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, userId);
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
            COLLECTION_ACTIVITY,
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
