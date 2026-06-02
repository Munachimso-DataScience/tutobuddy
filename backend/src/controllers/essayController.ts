import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import axios from 'axios';

const getAiUrl = () => {
    const envUrl = process.env.AI_SERVICE_URL;
    const isRender = process.env.RENDER === 'true' || process.env.RENDER === '1' || !!process.env.RENDER_SERVICE_ID;

    if (isRender) {
        if (!envUrl || envUrl.includes('onrender.com') || envUrl.includes('localhost')) {
            return 'https://patienceigwe-tutorbuddy-ai.hf.space';
        }
    }
    return envUrl || 'http://localhost:8000';
};

export const evaluateEssay = async (req: any, res: any) => {
    const AI_URL = getAiUrl();
    try {
        const { question, studentAnswer, materialId } = req.body;
        
        // 1. Get material text context
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, materialId);
        
        // Note: In a real scenario, we'd fetch the full extracted text from a storage file or a dedicated field.
        // For now, we'll try to extract the text again or use a placeholder if the text wasn't stored.
        // As an optimization, we should ideally store extracted_text in the study_materials document.
        
        // Since we don't have the text stored in the DB document yet, we'll assume the AI service
        // can handle a simplified evaluation or we provide the material info.
        
        const response = await axios.post(`${AI_URL}/evaluate-essay`, {
            question,
            student_answer: studentAnswer,
            context: material.title // Fallback to title if full text isn't available, but ideally we'd pass text
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Essay evaluation error:', error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
};

import fs from 'fs';

export const evaluateHandwrittenAnswer = async (req: any, res: any) => {
    const AI_URL = getAiUrl();
    try {
        const file = req.file;
        const { question, referenceAnswer } = req.body;
        
        if (!file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        
        // Prepare multipart form data for Python AI service
        const formData = new (require('form-data'))();
        const fileBuffer = fs.readFileSync(file.path);
        
        formData.append('file', fileBuffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });
        
        formData.append('question', question);
        formData.append('reference_answer', referenceAnswer || '');
        
        console.log(`Sending handwritten answer image to AI microservice for OCR & Evaluation...`);
        const response = await axios.post(`${AI_URL}/evaluate-handwritten`, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 180000 
        });
        
        // Clean up temp file
        try {
            fs.unlinkSync(file.path);
        } catch (cleanupErr) {
            console.warn('Failed to delete temp file:', cleanupErr);
        }
        
        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('evaluateHandwrittenAnswer error:', error.response?.data || error.message);
        // Ensure temp file is cleaned up even on failure
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {}
        }
        res.status(500).json({ error: error.message });
    }
};

