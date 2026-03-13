import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
const { InputFile } = require('node-appwrite/file');
import fs from 'fs';
import path from 'path';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_COURSES = 'courses';

const COLLECTION_MATERIALS = 'study_materials';
const BUCKET_ID = process.env.APPWRITE_STORAGE_ID || 'tutorbuddy';

export const createCourse = async (req: any, res: any) => {
    try {
        const { title, description, code } = req.body;
        const studentId = req.user.$id;
        const file = (req as any).file;

        // 1. Create Course
        const course = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_COURSES,
            ID.unique(),
            {
                name: title,
                code,
                student_id: studentId,
                progress: 0
            }
        );

        // 2. If file uploaded, handle it
        if (file) {
            try {
                // Upload to Storage
                const appwriteFile = await storage.createFile(
                    BUCKET_ID,
                    ID.unique(),
                    InputFile.fromPath(file.path, file.originalname)
                );

                // Save Metadata
                await databases.createDocument(
                    DATABASE_ID,
                    COLLECTION_MATERIALS,
                    ID.unique(),
                    {
                        course_id: course.$id,
                        file_id: appwriteFile.$id,
                        title: file.originalname,
                        type: path.extname(file.originalname).substring(1) || 'unknown',
                        uploaded_at: new Date().toISOString()
                    }
                );

                // Remove temp file
                fs.unlinkSync(file.path);
            } catch (fileError: any) {
                console.error('Error uploading initial file:', fileError.message);
                // We still return the course even if file fails
            }
        }

        res.status(201).json(course);
    } catch (error: any) {
        console.error('Create Course Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const getCourses = async (req: any, res: any) => {
    try {
        const studentId = req.user.$id;
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_COURSES,
                [Query.equal('student_id', studentId)]
            );
            res.status(200).json(response.documents);
        } catch (dbError: any) {
            console.error('Database error in getCourses:', dbError.message);
            // Return empty array instead of 500 if collection is empty or attributes missing
            res.status(200).json([]);
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
