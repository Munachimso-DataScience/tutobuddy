import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import axios from 'axios';

const getAiUrl = () => {
    const url = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    return url.startsWith('http') ? url : `http://${url}`;
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
