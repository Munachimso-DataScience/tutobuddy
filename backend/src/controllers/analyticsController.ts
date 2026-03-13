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
        let activity;
        try {
            activity = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ACTIVITY,
                [
                    Query.equal('user_id', studentId),
                    Query.limit(50) 
                ]
            );
        } catch (dbError) {
            console.error('Database error in getWeaknessAnalysis:', dbError);
            return res.status(200).json({ 
                weaknesses: [], 
                recommendations: ["Complete more quizzes to see your weakness analysis."] 
            });
        }

        // Filter for "incorrect" events and parse details
        const incorrectData = activity.documents
            .filter(doc => doc.type === 'quiz_incorrect')
            .map(doc => {
                try {
                    const details = JSON.parse(doc.description || '{}');
                    return {
                        question: details.question_text || 'Unknown question',
                        correct_answer: details.correct_answer || 'N/A'
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter(item => item !== null);

        // 2. Call AI Service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-weakness`, {
            incorrect_data: incorrectData
        });

        res.status(200).json(aiResponse.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
