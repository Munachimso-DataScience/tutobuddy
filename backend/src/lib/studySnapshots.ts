import { ID, Query } from 'node-appwrite';
import { databases } from '../lib/appwrite-admin';
import { COLLECTIONS, DATABASE_ID } from './collections';

export type StudySnapshotInput = {
    userId: string;
    summaryText?: string;
    recentContentCovered?: string;
    weeklyWeaknesses?: string;
    totalMinutes?: number;
    studySessions?: number;
    lastStudyMinutes?: number;
};

export type StudySnapshot = {
    summary_text?: string;
    recent_content_covered?: string;
    weekly_weaknesses?: string;
    total_minutes?: number;
    study_sessions?: number;
    last_study_minutes?: number;
    created_at?: string;
};

export const saveStudySnapshot = async (input: StudySnapshotInput) => {
    try {
        await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.STUDY_SNAPSHOTS,
            ID.unique(),
            {
                user_id: input.userId,
                summary_text: input.summaryText || '',
                recent_content_covered: input.recentContentCovered || '',
                weekly_weaknesses: input.weeklyWeaknesses || '',
                total_minutes: Number(input.totalMinutes) || 0,
                study_sessions: Number(input.studySessions) || 0,
                last_study_minutes: Number(input.lastStudyMinutes) || 0,
                created_at: new Date().toISOString()
            }
        );
    } catch (error: any) {
        console.warn(`Failed to save study snapshot for ${input.userId}:`, error.message);
    }
};

export const getLatestStudySnapshot = async (userId: string): Promise<StudySnapshot | null> => {
    try {
        const snapshots = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.STUDY_SNAPSHOTS,
            [
                Query.equal('user_id', userId),
                Query.orderDesc('created_at'),
                Query.limit(1)
            ]
        );

        return (snapshots.documents[0] as StudySnapshot) || null;
    } catch (error: any) {
        console.warn(`Failed to load latest study snapshot for ${userId}:`, error.message);
        return null;
    }
};
