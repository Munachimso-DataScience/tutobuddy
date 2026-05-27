import { Response, NextFunction } from 'express';

export type UserRole = 'student' | 'lecturer' | 'admin';

export const requireRoles = (...allowedRoles: UserRole[]) => {
    return (req: any, res: Response, next: NextFunction) => {
        const userRole: UserRole = req.userRole || req.profile?.role || 'student';

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This route requires one of the following roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

