import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

export const getSchedules = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.SCHEDULES,
            [Query.equal('user_id', userId)]
        );
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createSchedule = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        const { title, day, start_time, end_time } = req.body;

        const schedule = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.SCHEDULES,
            ID.unique(),
            {
                user_id: userId,
                title,
                day,
                start_time,
                end_time
            }
        );
        res.status(201).json(schedule);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteSchedule = async (req: any, res: any) => {
    try {
        const { scheduleId } = req.params;
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.SCHEDULES, scheduleId);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
