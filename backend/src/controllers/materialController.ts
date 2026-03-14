import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
const { InputFile } = require('node-appwrite/file');
import fs from 'fs';
import path from 'path';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_MATERIALS = 'study_materials';
const BUCKET_ID = process.env.APPWRITE_STORAGE_ID || 'tutorbuddy';

export const uploadMaterial = async (req: any, res: any) => {
    try {
        const { courseId, title, content, category } = req.body;
        const file = (req as any).file;

        let materialData: any = {
            course_id: courseId,
            title: title || (file ? file.originalname : 'Pasted Note'),
            category: category || 'General',
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
            COLLECTION_MATERIALS,
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
            COLLECTION_MATERIALS,
            [Query.equal('course_id', courseId)]
        );
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
