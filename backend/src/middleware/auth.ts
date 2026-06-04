import { Client, Account, Databases } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases as adminDatabases } from '../lib/appwrite-admin';

export const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers['authorization'];
        const sessionHeader = req.headers['x-appwrite-session'];
        
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT!)
            .setProject(process.env.APPWRITE_PROJECT_ID!);

        if (authHeader?.startsWith('Bearer ')) {
            const jwt = authHeader.split(' ')[1];
            client.setJWT(jwt);
            console.log('Using JWT auth, token length:', jwt.length);
        } else if (sessionHeader) {
            client.setSession(sessionHeader);
            console.log('Using session auth');
        } else {
            console.log('No auth header found');
            return res.status(401).json({ error: 'Unauthorized: No session or token provided' });
        }

        const account = new Account(client);
        const databases = new Databases(client);
        console.log('Calling account.get()...');
        const user = await account.get();
        console.log('Auth success for:', user.email);
        req.user = user;
        try {
            const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
            req.profile = profile;
            req.userRole = profile.role || 'student';
        } catch (profileError: any) {
            console.warn('Profile missing for user, creating default profile:', profileError?.message || profileError);
            try {
                const defaultProfile = await adminDatabases.createDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id, {
                    user_id: user.$id,
                    full_name: user.name || user.email || 'User',
                    school: '',
                    course_of_study: '',
                    role: 'student',
                    department: '',
                    class_group: '',
                    assigned_courses: '',
                    current_streak: 0,
                    last_active: new Date().toISOString(),
                    study_minutes_total: 0,
                    study_minutes_today: 0,
                    last_study_minutes: 0,
                    recent_content_covered: '',
                    last_study_session_at: new Date().toISOString(),
                    Email: user.email || ''
                });
                req.profile = defaultProfile;
                req.userRole = defaultProfile.role || 'student';
            } catch (createError: any) {
                console.error('Failed to auto-create missing profile:', createError.message);
                req.profile = null;
                req.userRole = 'student';
            }
        }
        next();
    } catch (error: any) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid session or token', details: error.message });
    }
};
