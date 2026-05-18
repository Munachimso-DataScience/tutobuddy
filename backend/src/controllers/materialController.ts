import { COLLECTIONS, DATABASE_ID, BUCKET_ID } from '../lib/collections';
import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
const { InputFile } = require('node-appwrite/file');
import fs from 'fs';
import path from 'path';

export const uploadMaterial = async (req: any, res: any) => {
    try {
        const { courseId, title, content, category } = req.body;
        const file = (req as any).file;

        let materialData: any = {
            course_id: courseId,
            title: title || (file ? file.originalname : 'Pasted Note'),
            category: category || 'General',
            created_at: new Date().toISOString(),
            uploaded_at: new Date().toISOString(),
            type: file ? (path.extname(file.originalname).substring(1) || 'unknown') : 'note'
        };

        if (file) {
            // Upload to Appwrite Storage
            const appwriteFile = await storage.createFile(
                BUCKET_ID,
                ID.unique(),
                InputFile.fromPath(file.path, file.originalname)
            );
            materialData.file_id = appwriteFile.$id;
            fs.unlinkSync(file.path); // Remove temp file
        } else if (content) {
            // If it's pasted text, we store it in content and use a dummy file_id
            materialData.content = content;
            materialData.file_id = 'pasted_text';
        } else {
            return res.status(400).json({ error: 'No file or text content provided' });
        }

        // Save Metadata to Database
        const material = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.MATERIALS,
            ID.unique(),
            materialData
        );

        res.status(201).json(material);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMaterials = async (req: any, res: any) => {
    try {
        const { courseId } = req.params;
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.MATERIALS,
            [Query.equal('course_id', courseId)]
        );
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
export const deleteMaterial = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        // 1. Get material to find file_id
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
        
        // 2. Delete file from storage if it exists and isn't 'pasted_text'
        if (material.file_id && material.file_id !== 'pasted_text') {
            try {
                await storage.deleteFile(BUCKET_ID, material.file_id);
            } catch (storageErr) {
                console.warn('Storage file deletion failed (maybe already gone):', storageErr);
            }
        }
        
        // 3. Delete document from database
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
        
        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const getAiUrl = () => {
    let envUrl = process.env.AI_SERVICE_URL;
    if (envUrl && envUrl.endsWith('/')) {
        envUrl = envUrl.slice(0, -1);
    }
    const isRender = process.env.RENDER === 'true' || process.env.RENDER === '1' || !!process.env.RENDER_SERVICE_ID;
    if (isRender) {
        if (!envUrl || envUrl.includes('onrender.com') || envUrl.includes('localhost')) {
            return 'http://tutobuddy-ai:8000';
        }
    }
    return envUrl || 'http://localhost:8000';
};

import axios from 'axios';

const extractTextFromMaterial = async (material: any): Promise<string> => {
    if (material.content) {
        return material.content;
    }

    if (!material.file_id || material.file_id === 'pasted_text') {
        throw new Error('No content or file found for this material');
    }

    const AI_URL = getAiUrl();
    console.log(`Downloading file ${material.file_id} from Appwrite for text extraction...`);
    const fileContent = await storage.getFileDownload(BUCKET_ID, material.file_id);
    
    const formData = new (require('form-data'))();
    const buffer = Buffer.from(fileContent);

    formData.append('file', buffer, {
        filename: `material.${material.type || 'txt'}`,
        contentType: material.type === 'pdf' ? 'application/pdf' : material.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
    });

    console.log(`Sending file to AI for extraction...`);
    const extractionRes = await axios.post(`${AI_URL}/extract-text`, formData, {
        headers: { ...formData.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 180000 
    });
    
    const text = extractionRes.data.text;
    
    // Cache the extracted text back into the Appwrite document to avoid subsequent slow requests!
    try {
        console.log(`Caching extracted text back into Appwrite for material ${material.$id}...`);
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.MATERIALS, material.$id, {
            content: text.substring(0, 64000)
        });
    } catch (dbErr: any) {
        console.warn(`Failed to cache extracted text: ${dbErr.message}`);
    }

    return text;
};

export const getMaterialText = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
        
        const text = await extractTextFromMaterial(material);
        
        res.status(200).json({ text });
    } catch (error: any) {
        console.error('getMaterialText error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const summarizeMaterial = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
        
        const text = await extractTextFromMaterial(material);
        
        const AI_URL = getAiUrl();
        console.log(`Requesting summary from AI...`);
        const summaryRes = await axios.post(`${AI_URL}/summarize`, {
            text: text
        }, { timeout: 180000 });
        
        res.status(200).json({ summary: summaryRes.data.summary });
    } catch (error: any) {
        console.error('summarizeMaterial error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

