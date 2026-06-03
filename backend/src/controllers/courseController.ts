import { COLLECTIONS, DATABASE_ID, BUCKET_ID } from '../lib/collections';
import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
const { InputFile } = require('node-appwrite/file');
import fs from 'fs';
import path from 'path';

export const createCourse = async (req: any, res: any) => {
    try {
        const { title, description, code, exam_date, category } = req.body;
        const studentId = req.user.$id;
        const file = (req as any).file;

        // 1. Create Course
        const courseData: any = {
            title: title,
            name: title,
            description: description || '',
            code,
            student_id: studentId,
            progress: 0,
            exam_readiness: 0,
            category: category || 'General',
            created_at: new Date().toISOString()
        };

        if (exam_date) {
            courseData.exam_date = new Date(exam_date).toISOString();
        }

        const course = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.COURSES,
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
                    COLLECTIONS.MATERIALS,
                    ID.unique(),
                    {
                        course_id: course.$id,
                        file_id: appwriteFile.$id,
                        title: file.originalname,
                        type: path.extname(file.originalname).substring(1) || 'unknown',
                        created_at: new Date().toISOString(),
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
                COLLECTIONS.COURSES,
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

export const getStudentClasses = async (req: any, res: any) => {
    try {
        const studentId = req.user.$id;
        
        try {
            // 1. Get enrollments for this student
            const enrollments = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.COURSE_ENROLLMENTS,
                [Query.equal('student_id', studentId)]
            );

            if (enrollments.documents.length === 0) {
                return res.status(200).json([]);
            }

            // 2. Fetch the actual offerings
            const offeringIds = enrollments.documents.map(e => e.offering_id);
            // Deduplicate if needed
            const uniqueOfferingIds = [...new Set(offeringIds)];

            // Appwrite requires multiple equal queries if you want to query an array of IDs, OR we can fetch them individually
            // Since Appwrite array querying can be tricky, we'll fetch them individually or in a loop
            const offerings = [];
            for (const id of uniqueOfferingIds) {
                try {
                    const offering = await databases.getDocument(DATABASE_ID, COLLECTIONS.COURSE_OFFERINGS, id as string);
                    offerings.push(offering);
                } catch (e) {
                    console.warn(`Could not fetch offering ${id}`);
                }
            }

            res.status(200).json(offerings);
        } catch (dbError: any) {
            console.error('Database error in getStudentClasses:', dbError.message);
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
        const course = await databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, id);
        if (course.student_id !== studentId) {
            return res.status(403).json({ error: 'Unauthorized to delete this course' });
        }

        // 2. Cleanup associated materials and storage files
        const materials = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.MATERIALS,
            [Query.equal('course_id', id)]
        );

        for (const material of materials.documents) {
            try {
                // Delete file from storage
                await storage.deleteFile(BUCKET_ID, material.file_id);
                // Delete material record
                await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MATERIALS, material.$id);
            } catch (err) {
                console.warn(`Could not full cleanup material ${material.$id}:`, err);
            }
        }

        // 3. Cleanup associated quizzes
        const quizzes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            [Query.equal('course_id', id)]
        );

        for (const quiz of quizzes.documents) {
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTIONS.QUIZZES, quiz.$id);
            } catch (err) {
                console.warn(`Could not cleanup quiz ${quiz.$id}:`, err);
            }
        }

        // 4. Finally delete the course
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSES, id);

        res.status(200).json({ message: 'Course and all related data deleted successfully' });
    } catch (error: any) {
        console.error('Delete Course Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

