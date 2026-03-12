import { Request, Response } from 'express';
import axios from 'axios';
import { databases } from '../lib/appwrite-admin';
import { Query } from 'node-appwrite';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_ACTIVITY = 'activity_logs';

export const getWeaknessAnalysis = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.$id;

        // 1. Fetch recent activity logs involving incorrect answers
        // We'll filter for logs that might have metadata about the quiz/question
        const activity = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ACTIVITY,
            [
                Query.equal('student_id', studentId),
                Query.limit(50) 
            ]
        );

        // Filter for "incorrect" events (assuming we log these types)
        const incorrectData = activity.documents
            .filter(doc => doc.type === 'quiz_incorrect')
            .map(doc => ({
                question: doc.question_text,
                correct_answer: doc.correct_answer
            }));

        // 2. Call AI Service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-weakness`, {
            incorrect_data: incorrectData
        });

        res.status(200).json(aiResponse.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
