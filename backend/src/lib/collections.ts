export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';
export const BUCKET_ID = process.env.APPWRITE_STORAGE_ID || 'tutorbuddy';

export const COLLECTIONS: {
    USERS: string;
    COURSES: string;
    MATERIALS: string;
    QUIZZES: string;
    ACTIVITY: string;
    NOTIFICATIONS: string;
    STUDY_SNAPSHOTS: string;
    TASKS: string;
    SCHEDULES: string;
    QUESTION_TEMPLATES: string;
    SYSTEM_METRICS: string;
    CLASS_GROUPS: string;
} = {
    USERS: 'users_profiles',
    COURSES: 'courses',
    MATERIALS: 'study_materials',
    QUIZZES: 'quizzes',
    ACTIVITY: 'activity_logs',
    NOTIFICATIONS: 'notifications',
    STUDY_SNAPSHOTS: 'study_snapshots',
    TASKS: 'tasks',
    SCHEDULES: 'schedules',
    QUESTION_TEMPLATES: 'question_templates',
    SYSTEM_METRICS: 'system_metrics',
    CLASS_GROUPS: 'class_groups'
};
