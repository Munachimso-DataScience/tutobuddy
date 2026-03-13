import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import axios from 'axios';
import fs from 'fs';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BUCKET_ID = 'study_materials';
const COLLECTION_QUIZZES = 'quizzes';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateQuiz = async (req: any, res: any) => {
    try {
        const { materialId } = req.body;
        const userId = req.user.$id;

        // 1. Get material file from database to get file_id and course_id
        const material = await databases.getDocument(DATABASE_ID, 'study_materials', materialId);
        
        // 2. Get file content from storage
        const fileContent = await storage.getFileView(BUCKET_ID, material.file_id);
        
        // 3. Prepare for AI service (using FormData from Node 20 or form-data package)
        // Since we are in Node 20, let's use what's available or simple Buffer if AI service supports it.
        // We'll use axios with a Buffer directly if possible, but the AI service expects "file".
        
        const formData = new (require('form-data'))();
        formData.append('file', Buffer.from(fileContent), {
            filename: 'material.pdf', // default extension
            contentType: 'application/pdf',
        });

        // 4. Extract text (using AI service)
        const extractionRes = await axios.post(`${AI_SERVICE_URL}/extract-text`, formData, {
            headers: { ...formData.getHeaders() }
        });
        const text = extractionRes.data.text;

        // 5. Generate Quiz
        const quizRes = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
            text: text,
            num_questions: 5
        });

        const quizData = quizRes.data.quiz;

        // 6. Store in Appwrite
        const quizDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_QUIZZES,
            ID.unique(),
            {
                user_id: userId,
                material_id: materialId,
                course_id: material.course_id,
                content: typeof quizData === 'string' ? quizData : JSON.stringify(quizData),
                created_at: new Date().toISOString()
            }
        );

        res.status(201).json(quizDoc);
    } catch (error: any) {
        console.error('Quiz generation error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getQuizzes = async (req: any, res: any) => {
    try {
        const { materialId } = req.params;
        const userId = req.user.$id;

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_QUIZZES,
            [
                Query.equal('material_id', materialId),
                Query.equal('user_id', userId)
            ]
        );
        
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

