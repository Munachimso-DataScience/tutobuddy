/** Ironclad Version: 2.1 - Retries & Warm-up Enabled **/
import { COLLECTIONS, DATABASE_ID, BUCKET_ID } from '../lib/collections';
import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import axios from 'axios';
import fs from 'fs';
import fetch from 'node-fetch';

const getAiUrl = () => {
    // 1. Priority: Explicitly set URL (Dashboard or Local .env)
    if (process.env.AI_SERVICE_URL && process.env.AI_SERVICE_URL !== 'http://tutobuddy-ai:8000') {
        const url = process.env.AI_SERVICE_URL;
        const finalUrl = url.startsWith('http') ? url : `http://${url}`;
        console.log(`AI Service URL: ${finalUrl} (source: AI_SERVICE_URL env)`);
        return finalUrl;
    }

    // 2. Fallback: If on Render, try to form a URL from common patterns
    if (process.env.RENDER === 'true') {
        // Try internal name first as fallback, but add .onrender.com which sometimes resolves better internally
        const internalUrl = 'https://tutobuddy-ai.onrender.com'; 
        console.log(`AI Service URL: ${internalUrl} (source: Render public fallback)`);
        return internalUrl;
    }
    
    // 3. Last fallback: Localhost
    const localUrl = 'http://localhost:8000';
    console.log(`AI Service URL: ${localUrl} (source: default local)`);
    return localUrl;
};

export const generateQuiz = async (req: any, res: any) => {
    const AI_URL = getAiUrl();
    try {
        const { materialId } = req.body;
        const userId = req.user.$id;

        console.log(`Using Database: ${DATABASE_ID}, Quiz Collection: ${COLLECTIONS.QUIZZES}`);
        
        // 1. Get material file from database to get file_id and course_id
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, materialId);
        let text = '';

        if (material.content) {
            // Use pasted text directly
            text = material.content;
        } else if (material.file_id && material.file_id !== 'pasted_text') {
            // 2. WARM UP: Ping AI health check first (Render Free Tier can take 30s to wake up)
            console.log('Waking up AI service...');
            try {
                // First ping to wake it up
                await axios.get(`${AI_URL}/health`, { timeout: 30000 }).catch(() => {});
            } catch (hwError) {}

            // 3. Get file content from storage (ArrayBuffer)
            console.log(`Downloading file ${material.file_id} from Appwrite...`);
            const fileContent = await storage.getFileDownload(BUCKET_ID, material.file_id);
            
            // 4. Prepare for AI service
            const formData = new (require('form-data'))();
            const buffer = Buffer.from(fileContent);

            formData.append('file', buffer, {
                filename: `material.${material.type || 'txt'}`,
                contentType: material.type === 'pdf' ? 'application/pdf' : material.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
            });

            // 5. Extract text with RETRY logic
            let retries = 2;
            while (retries >= 0) {
                try {
                    console.log(`Sending file to AI for extraction (Retries left: ${retries})...`);
                    const extractionRes = await axios.post(`${AI_URL}/extract-text`, formData, {
                        headers: { ...formData.getHeaders() },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        timeout: 180000 // Increased from 120s to 180s
                    });
                    text = extractionRes.data.text;
                    console.log(`Extraction successful. Received ${text.length} characters.`);
                    break;
                } catch (extErr: any) {
                    if (retries === 0) {
                        console.error('AI EXTRACTION FAILED PERMANENTLY:', extErr.message);
                        throw new Error(`AI Extraction failed: ${extErr.response?.data?.detail || extErr.message} (Timeout set to 180s)`);
                    }
                    console.warn(`Extraction failed, retrying... (${extErr.message})`);
                    retries--;
                    await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry
                }
            }
        } else {
            throw new Error('No content or file found for this material');
        }

        if (!text || text.trim().length < 50) {
            console.warn(`Insufficient text for quiz: ${text?.length} chars`);
            throw new Error(`The study material is too short to generate a high-quality quiz (found ${text?.length || 0} characters). Please provide more content.`);
        }

        console.log(`Requesting 30 MCQs and 5 Essays from AI for ${text.length} chars...`);

        // 6. Generate Quiz (Higher timeout for larger question set: 5 minutes)
        const quizRes = await axios.post(`${AI_URL}/generate-quiz`, {
            text: text,
            num_mcq: 30,
            num_essay: 5,
            num_questions: 35
        }, { timeout: 300000 }); 

        const quizData = quizRes.data.quiz;

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.error('AI Service Error Data:', quizRes.data);
            throw new Error('AI Service failed to generate any valid questions. Try again with more content.');
        }

        // 7. Store in Appwrite
        console.log(`Saving quiz with ${quizData.questions.length} questions to collection: ${COLLECTIONS.QUIZZES}...`);
        const quizDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            ID.unique(),
            {
                title: `Comprehensive Quiz: ${material.title || 'Extracted material'}`,
                course_id: material.course_id,
                score: 0,
                total_questions: quizData.questions?.length || 35,
                date_taken: new Date().toISOString(),
                user_id: userId,
                material_id: materialId,
                content: typeof quizData === 'string' ? quizData : JSON.stringify(quizData),
                created_at: new Date().toISOString()
            }
        ).catch(dbErr => {
            console.error('Appwrite Quiz Save Failure:', dbErr.message);
            throw new Error(`Database rejected the quiz: ${dbErr.message}`);
        });

        // 8. Update course completion tracking
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

