import { COLLECTIONS, DATABASE_ID, BUCKET_ID } from '../lib/collections';
import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import axios from 'axios';
import fs from 'fs';
import fetch from 'node-fetch';

const getAiUrl = () => {
    // Priority: 1. Internal Render Networking 2. Public URL 3. Localhost
    // If running on Render, use the service name 'tutobuddy-ai'
    if (process.env.RENDER === 'true') return 'http://tutobuddy-ai:8000';
    
    const url = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return url.startsWith('http') ? url : `http://${url}`;
};

export const generateQuiz = async (req: any, res: any) => {
    const AI_URL = getAiUrl();
    try {
        const { materialId } = req.body;
        const userId = req.user.$id;

        console.log(`Using Database: ${DATABASE_ID}, Quiz Collection: ${COLLECTIONS.QUIZZES}`);
        console.log(`Generating quiz for material: ${materialId} using AI at ${AI_URL}`);

        // 1. Get material file from database to get file_id and course_id
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, materialId);
        
        let text = '';

        if (material.content) {
            // Use pasted text directly
            text = material.content;
        } else if (material.file_id && material.file_id !== 'pasted_text') {
            // 2. Get file content from storage (ArrayBuffer)
            const fileContent = await storage.getFileDownload(BUCKET_ID, material.file_id);
            
            // 3. Prepare for AI service
            const formData = new (require('form-data'))();
            const buffer = Buffer.from(fileContent);

            formData.append('file', buffer, {
                filename: `material.${material.type || 'txt'}`,
                contentType: material.type === 'pdf' ? 'application/pdf' : material.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
            });

            // 4. Extract text (using AI service with fetch)
            const extractionRes = await fetch(`${AI_URL}/extract-text`, {
                method: 'POST',
                body: formData as any,
                headers: formData.getHeaders()
            });

            if (!extractionRes.ok) {
                const errText = await extractionRes.text();
                throw new Error(`AI Extraction failed: ${errText}`);
            }

            const extractionData: any = await extractionRes.json();
            text = extractionData.text;
        } else {
            throw new Error('No content or file found for this material');
        }

        if (!text || text.trim().length < 50) {
            console.warn(`Insufficient text for quiz: ${text?.length} chars`);
            throw new Error(`The study material is too short to generate a high-quality quiz (found ${text?.length || 0} characters). Please provide more content.`);
        }

        console.log(`Sending ${text.length} characters of text to AI for quiz generation...`);

        // 5. Generate Quiz
        const quizRes = await axios.post(`${AI_URL}/generate-quiz`, {
            text: text,
            num_questions: 5
        }, { timeout: 60000 }); // Increase timeout for complex docs or cold starts

        const quizData = quizRes.data.quiz;

        if (!quizData || !quizData.questions) {
            throw new Error('AI Service returned invalid quiz data format');
        }

        // 6. Store in Appwrite
        const quizDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
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
            const course = await databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, material.course_id);
            const newProgress = Math.min((course.progress || 0) + 5, 100);
            const newReadiness = Math.min((course.exam_readiness || 0) + 5, 100);
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, material.course_id, {
                progress: newProgress,
                exam_readiness: newReadiness
            });
        } catch (e) {
            console.warn('Silent skip: Failed to update course progress tracking:', e);
        }

        res.status(201).json(quizDoc);
    } catch (error: any) {
        console.error('Quiz Generation CRITICAL FAILURE:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate quiz',
            message: error.message,
            ai_status: error.response?.status,
            ai_data: error.response?.data,
            hint: 'Ensure AI_SERVICE_URL is set to http://tutobuddy-ai:8000 for internal Render networking'
        });
    }
};

export const getQuizzes = async (req: any, res: any) => {
    try {
        const { materialId } = req.params;
        const userId = req.user.$id;

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
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

