import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_TASKS = 'tasks';

export const getTasks = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_TASKS,
            [Query.equal('user_id', userId)]
        );
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createTask = async (req: any, res: any) => {
    try {
        const userId = req.user.$id;
        const { title, due_date, priority } = req.body;

        const task = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_TASKS,
            ID.unique(),
            {
                user_id: userId,
                title,
                due_date,
                priority: priority || 'medium',
                status: 'pending'
            }
        );
        res.status(201).json(task);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTaskStatus = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const response = await databases.updateDocument(
            DATABASE_ID,
            COLLECTION_TASKS,
            taskId,
            { status }
        );
        res.status(200).json(response);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteTask = async (req: any, res: any) => {
    try {
        const { taskId } = req.params;
        await databases.deleteDocument(DATABASE_ID, COLLECTION_TASKS, taskId);
        res.status(204).send();
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
