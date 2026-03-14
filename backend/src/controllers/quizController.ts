import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import axios from 'axios';
import fs from 'fs';
import fetch from 'node-fetch';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const BUCKET_ID = process.env.APPWRITE_STORAGE_ID || 'tutorbuddy';
const COLLECTION_QUIZZES = 'quizzes';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const generateQuiz = async (req: any, res: any) => {
    try {
        const { materialId } = req.body;
        const userId = req.user.$id;

        // 1. Get material file from database to get file_id and course_id
        const material = await databases.getDocument(DATABASE_ID, 'study_materials', materialId);        // 2. Get file content from storage (ArrayBuffer)
        const fileContent = await storage.getFileDownload(BUCKET_ID, material.file_id);
        
        // 3. Prepare for AI service
        const formData = new (require('form-data'))();
        // fileContent is an ArrayBuffer from node-appwrite, convert it directly to Buffer
        const buffer = Buffer.from(fileContent);

        formData.append('file', buffer, {
            filename: `material.${material.type || 'txt'}`,
            contentType: material.type === 'pdf' ? 'application/pdf' : material.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
        });

        // 4. Extract text (using AI service with fetch to avoid Axios buffer issues)
        const extractionRes = await fetch(`${AI_SERVICE_URL}/extract-text`, {
            method: 'POST',
            body: formData as any,
            headers: formData.getHeaders()
        });

        if (!extractionRes.ok) {
            const errText = await extractionRes.text();
            throw new Error(`AI Extraction failed: ${errText}`);
        }

        const extractionData: any = await extractionRes.json();
        const text = extractionData.text;

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
                title: `Quiz: ${material.title || 'Extracted material'}`,
                course_id: material.course_id,
                score: 0,
                total_questions: quizData.questions?.length || 5,
                date_taken: new Date().toISOString(),
                user_id: userId,
                material_id: materialId,
                content: typeof quizData === 'string' ? quizData : JSON.stringify(quizData),
                created_at: new Date().toISOString()
            }
        );

        // 7. Update course completion tracking
        try {
            const course = await databases.getDocument(DATABASE_ID, 'courses', material.course_id);
            const newProgress = Math.min((course.progress || 0) + 5, 100);
            const newReadiness = Math.min((course.exam_readiness || 0) + 5, 100);
            await databases.updateDocument(DATABASE_ID, 'courses', material.course_id, {
                progress: newProgress,
                exam_readiness: newReadiness
            });
        } catch (e) {
            console.warn('Silent skip: Failed to update course progress tracking:', e);
        }

        res.status(201).json(quizDoc);
    } catch (error: any) {
        console.error('Quiz generation error details:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Full Error:', error);
        }
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

