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
        const { title, description, code, exam_date, category } = req.body;
        const studentId = req.user.$id;
        const file = (req as any).file;

        // 1. Create Course
        const courseData: any = {
            name: title,
            code,
            student_id: studentId,
            progress: 0,
            exam_readiness: 0,
            category: category || 'General'
        };

        if (exam_date) {
            courseData.exam_date = new Date(exam_date).toISOString();
        }

        const course = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_COURSES,
            ID.unique(),
            courseData
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

export const deleteCourse = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const studentId = req.user.$id;

        // 1. Verify ownership
        const course = await databases.getDocument(DATABASE_ID, COLLECTION_COURSES, id);
        if (course.student_id !== studentId) {
            return res.status(403).json({ error: 'Unauthorized to delete this course' });
        }

        // 2. Cleanup associated materials and storage files
        const materials = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_MATERIALS,
            [Query.equal('course_id', id)]
        );

        for (const material of materials.documents) {
            try {
                // Delete file from storage
                await storage.deleteFile(BUCKET_ID, material.file_id);
                // Delete material record
                await databases.deleteDocument(DATABASE_ID, COLLECTION_MATERIALS, material.$id);
            } catch (err) {
                console.warn(`Could not full cleanup material ${material.$id}:`, err);
            }
        }

        // 3. Cleanup associated quizzes
        const quizzes = await databases.listDocuments(
            DATABASE_ID,
            'quizzes',
            [Query.equal('course_id', id)]
        );

        for (const quiz of quizzes.documents) {
            try {
                await databases.deleteDocument(DATABASE_ID, 'quizzes', quiz.$id);
            } catch (err) {
                console.warn(`Could not cleanup quiz ${quiz.$id}:`, err);
            }
        }

        // 4. Finally delete the course
        await databases.deleteDocument(DATABASE_ID, COLLECTION_COURSES, id);

        res.status(200).json({ message: 'Course and all related data deleted successfully' });
    } catch (error: any) {
        console.error('Delete Course Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

