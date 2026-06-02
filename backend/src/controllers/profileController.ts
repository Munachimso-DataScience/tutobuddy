import { Request, Response } from 'express';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';

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

        return res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile
        });
    } catch (error: any) {
        console.error('Update profile error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
