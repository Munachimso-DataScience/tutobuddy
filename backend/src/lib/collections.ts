export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';
export const BUCKET_ID = process.env.APPWRITE_STORAGE_ID || 'tutorbuddy';

export const COLLECTIONS: {
    USERS: string;
    COURSES: string;
    MATERIALS: string;
    QUIZZES: string;
    ACTIVITY: string;
    NOTIFICATIONS: string;
    TASKS: string;
    SCHEDULES: string;
} = {
    USERS: 'users_profiles',
    COURSES: 'courses',
    MATERIALS: 'study_materials',
    QUIZZES: 'quizzes',
    ACTIVITY: 'activity_logs',
    NOTIFICATIONS: 'notifications',
    TASKS: 'tasks',
    SCHEDULES: 'schedules'
};
