import { Request, Response } from 'express';
import axios from 'axios';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { Query } from 'node-appwrite';

const getAiUrl = () => {
    const url = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return url.startsWith('http') ? url : `http://${url}`;
};

export const getWeaknessAnalysis = async (req: Request, res: Response) => {
    const AI_URL = getAiUrl();
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
        const normalizeText = (value: unknown) => {
            if (typeof value !== 'string') return '';
            const trimmed = value.trim();
            if (!trimmed) return '';

            const generic = new Set([
                'unknown',
                'unknown question',
                'n/a',
                'na',
                'question',
                'answer'
            ]);

            return generic.has(trimmed.toLowerCase()) ? '' : trimmed;
        };

        const incorrectData = activity.documents
            .filter(doc => doc.type === 'quiz_incorrect')
            .map(doc => {
                try {
                    const details = JSON.parse(doc.details || '{}');
                    const question = normalizeText(
                        details.question_text ||
                        details.question ||
                        details.prompt ||
                        details.questionTitle ||
                        details.question_text_content
                    );
                    const correctAnswer = normalizeText(
                        details.correct_answer ||
                        details.correctAnswer ||
                        details.answer ||
                        details.expected_answer
                    );

                    if (!question && !correctAnswer) {
                        return null;
                    }

                    return {
                        question: question || 'Study concept',
                        correct_answer: correctAnswer || 'Review this concept'
                    };
                } catch (e) {
                    return null;
                }
            })
            .filter((item): item is { question: string; correct_answer: string } => item !== null);

        // 2. Call AI Service
        try {
            const aiResponse = await axios.post(`${AI_URL}/analyze-weakness`, {
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
