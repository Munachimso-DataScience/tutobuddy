import { Request, Response } from 'express';
import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';

type AppwriteDoc = Record<string, any>;

const normalizeText = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
};

async function listAllDocuments(collectionId: string, queries: any[] = []) {
    const documents: AppwriteDoc[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
        const response = await databases.listDocuments(DATABASE_ID, collectionId, [
            ...queries,
            Query.limit(limit),
            Query.offset(offset)
        ]);

        documents.push(...response.documents);
        if (response.documents.length < limit || documents.length >= response.total) {
            break;
        }

        offset += limit;
        if (offset > 5000) {
            break;
        }
    }

    return documents;
}

export const getLecturerCourseOfferings = async (req: Request, res: Response) => {
    try {
        const userId = normalizeText((req as any).user?.$id);
        const userRole = normalizeText((req as any).userRole || (req as any).profile?.role || 'student');

        const docs = await listAllDocuments(COLLECTIONS.COURSE_OFFERINGS, userRole === 'admin'
            ? []
            : [Query.equal('lecturer_id', userId)]);

        return res.status(200).json({
            offerings: docs
        });
    } catch (error: any) {
        console.error('Get lecturer offerings error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const createLecturerCourseOffering = async (req: Request, res: Response) => {
    try {
        const userId = normalizeText((req as any).user?.$id);
        const { title, code, description, department, class_group, term, status, auto_enroll } = req.body || {};

        if (!normalizeText(title) || !normalizeText(code)) {
            return res.status(400).json({ error: 'title and code are required' });
        }

        const offering = await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_OFFERINGS, ID.unique(), {
            title: normalizeText(title),
            code: normalizeText(code),
            description: normalizeText(description),
            department: normalizeText(department),
            class_group: normalizeText(class_group),
            lecturer_id: userId,
            term: normalizeText(term),
            status: normalizeText(status) || 'active',
            created_at: new Date().toISOString()
        });

        let enrolled = 0;
        if (String(auto_enroll).toLowerCase() === 'true' && normalizeText(class_group)) {
            const students = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS, [
                Query.equal('role', 'student'),
                Query.equal('class_group', normalizeText(class_group)),
                Query.limit(100)
            ]);

            for (const student of students.documents) {
                try {
                    await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_ENROLLMENTS, ID.unique(), {
                        student_id: normalizeText(student.user_id || student.$id),
                        offering_id: offering.$id,
                        class_group: normalizeText(class_group),
                        status: 'enrolled',
                        created_at: new Date().toISOString()
                    });
                    enrolled += 1;
                } catch (enrollError: any) {
                    console.warn(`Failed to enroll ${student.$id}:`, enrollError.message);
                }
            }
        }

        return res.status(201).json({
            offering,
            enrolled
        });
    } catch (error: any) {
        console.error('Create lecturer offering error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturerCourseEnrollments = async (req: Request, res: Response) => {
    try {
        const { offeringId } = req.params;
        const enrollments = await listAllDocuments(COLLECTIONS.COURSE_ENROLLMENTS, [
            Query.equal('offering_id', offeringId)
        ]);
        return res.status(200).json({ enrollments });
    } catch (error: any) {
        console.error('Get lecturer enrollments error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
