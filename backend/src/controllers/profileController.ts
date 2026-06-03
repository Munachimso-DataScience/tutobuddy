import { Request, Response } from 'express';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { Query, ID } from 'node-appwrite';

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.$id;
        const { department, class_group } = req.body;

        // We'll update only the provided fields
        const updateData: any = {};
        if (department !== undefined) {
            updateData.department = department;
        }
        if (class_group !== undefined) {
            updateData.class_group = class_group;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId,
            updateData
        );

        // Fetch the updated profile to return
        const updatedProfile = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            userId
        );

        // Retroactive Auto-Enrollment
        if (updatedProfile.role === 'student' && (department !== undefined || class_group !== undefined)) {
            try {
                const offeringsResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_OFFERINGS);
                const enrollmentsResponse = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSE_ENROLLMENTS, [
                    Query.equal('student_id', userId)
                ]);
                const enrolledOfferingIds = new Set(enrollmentsResponse.documents.map(doc => doc.offering_id));

                const now = new Date().toISOString();
                const newDepartment = (updatedProfile.department || '').toLowerCase();
                const newClassGroup = (updatedProfile.class_group || '').toLowerCase();

                for (const offering of offeringsResponse.documents) {
                    if (enrolledOfferingIds.has(offering.$id)) continue;

                    const offeringDept = (offering.department || '').toLowerCase();
                    const offeringClass = (offering.class_group || '').toLowerCase();

                    if (!offeringDept && !offeringClass) continue;

                    const matchesDept = offeringDept ? offeringDept === newDepartment : true;
                    const matchesClass = offeringClass ? offeringClass === newClassGroup : true;

                    if (matchesDept && matchesClass) {
                        // Enroll student
                        await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_ENROLLMENTS, ID.unique(), {
                            offering_id: offering.$id,
                            student_id: userId,
                            status: 'enrolled',
                            enrolled_at: now
                        });

                        // Replicate Course for Private Workspace
                        const course = await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSES, ID.unique(), {
                            title: offering.title,
                            name: offering.title,
                            description: offering.description,
                            code: offering.code,
                            student_id: userId,
                            progress: 0,
                            exam_readiness: 0,
                            category: offering.department || 'General',
                            created_at: now
                        });

                        // Replicate Material if exists on offering
                        if (offering.file_id) {
                            await databases.createDocument(DATABASE_ID, COLLECTIONS.MATERIALS, ID.unique(), {
                                course_id: course.$id,
                                file_id: offering.file_id,
                                title: offering.file_name || 'Material',
                                type: offering.file_type || 'unknown',
                                created_at: now,
                                uploaded_at: now
                            });
                        }
                    }
                }
            } catch (autoEnrollError) {
                console.error('Failed to retroactively auto-enroll student after profile update:', autoEnrollError);
            }
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error: any) {
        console.error('Update profile error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
