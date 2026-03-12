import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query, InputFile } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_MATERIALS = 'materials';
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'study_materials';

export const uploadMaterial = async (req: any, res: any) => {
    try {
        const { courseId, title } = req.body;
        const file = (req as any).file; // Assuming multer or similar is used for temp file handling

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Upload to Appwrite Storage
        const appwriteFile = await storage.createFile(
            BUCKET_ID,
            ID.unique(),
            InputFile.fromPath(file.path, file.originalname)
        );

        // 2. Save Metadata to Database
        const material = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_MATERIALS,
            ID.unique(),
            {
                course_id: courseId,
                file_id: appwriteFile.$id,
                title: title || file.originalname,
                processed: false,
                created_at: new Date().toISOString()
            }
        );

        // Remove temp file
        fs.unlinkSync(file.path);

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
