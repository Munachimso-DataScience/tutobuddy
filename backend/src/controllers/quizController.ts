import { databases, storage } from '../lib/appwrite-admin';
import { ID } from 'node-appwrite';
import axios from 'axios';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BUCKET_ID = 'study_materials';
const COLLECTION_QUIZZES = 'quizzes';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateQuiz = async (req: any, res: any) => {
    try {
        const { materialId } = req.body;
        const userId = req.user.$id;

        // 1. Get material file from storage
        const fileMetadata = await databases.getDocument(DATABASE_ID, 'study_materials', materialId);
        const fileContent = await storage.getFileView(BUCKET_ID, fileMetadata.file_id);

        // 2. Extract text (using AI service)
        // Note: In a real scenario, we might want to cache the extracted text
        const formData = new FormData();
        const blob = new Blob([fileContent], { type: 'application/pdf' });
        formData.append('file', blob, 'material.pdf');

        const extractionRes = await axios.post(`${AI_SERVICE_URL}/extract-text`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        const text = extractionRes.data.text;

        // 3. Generate Quiz
        const quizRes = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
            text: text,
            num_questions: 5
        });

        const quizData = JSON.parse(quizRes.data.quiz);

        // 4. Store in Appwrite
        const quizDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_QUIZZES,
            ID.unique(),
            {
                user_id: userId,
                material_id: materialId,
                content: JSON.stringify(quizData),
                created_at: new Date().toISOString()
            }
        );

        res.status(201).json(quizDoc);
    } catch (error: any) {
        console.error('Quiz generation error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getQuizzes = async (req: any, res: any) => {
    try {
        const { materialId } = req.params;
        // Fetch quizzes for this material
        // ... implementation
        res.status(200).json({ message: 'Not implemented yet' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
