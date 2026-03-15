import { Request, Response } from 'express';
import axios from 'axios';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { Query } from 'node-appwrite';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getWeaknessAnalysis = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user.$id;

        // 1. Fetch recent activity logs involving incorrect answers
        let activity;
        try {
            activity = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ACTIVITY,
                [
                    Query.equal('user_id', studentId),
                    Query.limit(50) 
                ]
            );
        } catch (dbError: any) {
            console.error('Database error in getWeaknessAnalysis:', dbError.message);
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
                    const details = JSON.parse(doc.details || '{}');
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
        try {
            const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-weakness`, {
                incorrect_data: incorrectData
            });
            res.status(200).json(aiResponse.data);
        } catch (aiError: any) {
            console.error('AI Service error in getWeaknessAnalysis:', aiError.message);
            res.status(200).json({
                weaknesses: [],
                recommendations: ["AI service is currently busy. Please try again later."]
            });
        }
    } catch (error: any) {
        console.error('General error in getWeaknessAnalysis:', error.message);
        res.status(500).json({ error: error.message });
    }
};
