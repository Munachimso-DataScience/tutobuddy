import { databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_COURSES = 'courses';

export const createCourse = async (req: any, res: any) => {
    try {
        const { title, description, code } = req.body;
        const studentId = req.user.$id; // From auth middleware

        const course = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_COURSES,
            ID.unique(),
            {
                title,
                description,
                code,
                student_id: studentId,
                created_at: new Date().toISOString()
            }
        );

        res.status(201).json(course);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourses = async (req: any, res: any) => {
    try {
        const studentId = req.user.$id;
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_COURSES,
            [Query.equal('student_id', studentId)]
        );
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
