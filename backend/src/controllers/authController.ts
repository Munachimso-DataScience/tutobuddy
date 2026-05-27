import { Request, Response } from 'express';

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user || null;
        const profile = (req as any).profile || null;
        const role = (req as any).userRole || profile?.role || 'student';

        return res.status(200).json({
            user,
            profile,
            role
        });
    } catch (error: any) {
        console.error('Get current user error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

