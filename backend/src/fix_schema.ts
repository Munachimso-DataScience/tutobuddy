import { Client, Databases, Storage, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
import { COLLECTIONS, DATABASE_ID } from './lib/collections';

const schema = [
    {
        id: COLLECTIONS.USERS,
        name: 'User Profiles',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'full_name', type: 'string', size: 255, required: false },
            { key: 'school', type: 'string', size: 255, required: false },
            { key: 'course_of_study', type: 'string', size: 255, required: false },
            { key: 'role', type: 'string', size: 50, required: false, default: 'student' },
            { key: 'department', type: 'string', size: 255, required: false, default: '' },
            { key: 'class_group', type: 'string', size: 255, required: false, default: '' },
            { key: 'assigned_courses', type: 'string', size: 5000, required: false, default: '' },
            { key: 'current_streak', type: 'integer', required: false, default: 0 },
            { key: 'last_active', type: 'datetime', required: false },
            { key: 'study_minutes_total', type: 'integer', required: false, default: 0 },
            { key: 'study_minutes_today', type: 'integer', required: false, default: 0 },
            { key: 'last_study_minutes', type: 'integer', required: false, default: 0 },
            { key: 'recent_content_covered', type: 'string', size: 5000, required: false, default: '' },
            { key: 'last_study_session_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.COURSES,
        name: 'Courses',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'name', type: 'string', size: 255, required: false },
            { key: 'description', type: 'string', size: 5000, required: false },
            { key: 'code', type: 'string', size: 50, required: false },
            { key: 'student_id', type: 'string', size: 255, required: false },
            { key: 'progress', type: 'integer', required: false, default: 0 },
            { key: 'exam_readiness', type: 'integer', required: false, default: 0 },
            { key: 'category', type: 'string', size: 255, required: false, default: 'General' },
            { key: 'exam_date', type: 'datetime', required: false },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.MATERIALS,
        name: 'Materials',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'file_id', type: 'string', size: 255, required: false },
            { key: 'course_id', type: 'string', size: 255, required: false },
            { key: 'type', type: 'string', size: 50, required: false },
            { key: 'content', type: 'string', size: 65000, required: false },
            { key: 'category', type: 'string', size: 255, required: false, default: 'General' },
            { key: 'processed', type: 'boolean', required: false, default: false },
            { key: 'created_at', type: 'datetime', required: false },
            { key: 'uploaded_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.QUIZZES,
        name: 'Quizzes',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'material_id', type: 'string', size: 255, required: false },
            { key: 'course_id', type: 'string', size: 255, required: false },
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'content', type: 'string', size: 65000, required: false },
            { key: 'score', type: 'integer', required: false, default: 0 },
            { key: 'total_questions', type: 'integer', required: false, default: 0 },
            { key: 'date_taken', type: 'datetime', required: false },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.ACTIVITY,
        name: 'Activity Logs',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'type', type: 'string', size: 50, required: false },
            { key: 'description', type: 'string', size: 255, required: false },
            { key: 'details', type: 'string', size: 5000, required: false },
            { key: 'timestamp', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.STUDY_SNAPSHOTS,
        name: 'Study Snapshots',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'summary_text', type: 'string', size: 5000, required: false, default: '' },
            { key: 'recent_content_covered', type: 'string', size: 5000, required: false, default: '' },
            { key: 'weekly_weaknesses', type: 'string', size: 5000, required: false, default: '' },
            { key: 'total_minutes', type: 'integer', required: false, default: 0 },
            { key: 'study_sessions', type: 'integer', required: false, default: 0 },
            { key: 'last_study_minutes', type: 'integer', required: false, default: 0 },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.NOTIFICATIONS,
        name: 'Notifications',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'message', type: 'string', size: 5000, required: false },
            { key: 'link', type: 'string', size: 500, required: false },
            { key: 'type', type: 'string', size: 50, required: false, default: 'system' },
            { key: 'source', type: 'string', size: 50, required: false, default: 'app' },
            { key: 'is_read', type: 'boolean', required: false, default: false },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.TASKS,
        name: 'Tasks',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'status', type: 'string', size: 50, required: false, default: 'pending' },
            { key: 'priority', type: 'string', size: 50, required: false, default: 'medium' },
            { key: 'due_date', type: 'datetime', required: false }
        ]
    },
    {
        id: COLLECTIONS.SCHEDULES,
        name: 'Schedules',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'day', type: 'string', size: 20, required: false },
            { key: 'start_time', type: 'string', size: 20, required: false },
            { key: 'end_time', type: 'string', size: 20, required: false }
        ]
    },
    {
        id: COLLECTIONS.QUESTION_TEMPLATES,
        name: 'Question Templates',
        attributes: [
            { key: 'name', type: 'string', size: 255, required: false },
            { key: 'difficulty', type: 'string', size: 50, required: false, default: 'medium' },
            { key: 'prompt_text', type: 'string', size: 65000, required: false, default: '' },
            { key: 'essay_prompt_style', type: 'string', size: 255, required: false, default: '' },
            { key: 'explanation_style', type: 'string', size: 255, required: false, default: '' },
            { key: 'is_active', type: 'boolean', required: false, default: true }
        ]
    },
    {
        id: COLLECTIONS.SYSTEM_METRICS,
        name: 'System Metrics',
        attributes: [
            { key: 'timestamp', type: 'datetime', required: false },
            { key: 'total_ai_requests', type: 'integer', required: false, default: 0 },
            { key: 'quiz_generation_success_rate', type: 'double', required: false, default: 0.0 },
            { key: 'notification_sends', type: 'integer', required: false, default: 0 },
            { key: 'daily_active_users', type: 'integer', required: false, default: 0 },
            { key: 'avg_response_time', type: 'double', required: false, default: 0.0 }
        ]
    },
    {
        id: COLLECTIONS.CLASS_GROUPS,
        name: 'Class Groups',
        attributes: [
            { key: 'name', type: 'string', size: 255, required: false },
            { key: 'department', type: 'string', size: 255, required: false },
            { key: 'lecturer_id', type: 'string', size: 255, required: false },
            { key: 'course_list', type: 'string', size: 5000, required: false, default: '[]' },
            { key: 'student_list', type: 'string', size: 5000, required: false, default: '[]' }
        ]
    }
];

async function fixSchema() {
    console.log('--- Starting Schema Fix ---');

    // Ensure Database exists
    try {
        await databases.get(DATABASE_ID);
        console.log(`Database "${DATABASE_ID}" OK.`);
    } catch (e) {
        console.log(`Creating database "${DATABASE_ID}"...`);
        await databases.create(DATABASE_ID, DATABASE_ID);
    }

    for (const col of schema) {
        let collection;
        try {
            collection = await databases.getCollection(DATABASE_ID, col.id);
            console.log(`Collection "${col.id}" exists.`);
        } catch (e) {
            console.log(`Creating collection "${col.id}"...`);
            collection = await databases.createCollection(DATABASE_ID, col.id, col.name);
        }

        const attributes = collection.attributes;
        const existingAttrMap = attributes.reduce((acc: any, attr: any) => {
            acc[attr.key] = attr;
            return acc;
        }, {});

        for (const attr of col.attributes) {
            const existing = existingAttrMap[attr.key];

            if (existing) {
                // Check if we need to update size
                if (attr.type === 'string' && attr.size && existing.size < attr.size) {
                    console.log(`  Attribute "${attr.key}" size is too small (${existing.size} < ${attr.size}). RE-CREATING...`);
                    try {
                        // Delete first
                        await databases.deleteAttribute(DATABASE_ID, col.id, attr.key);
                        // Wait for deletion to propagate
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        // Re-create with new size
                        await databases.createStringAttribute(DATABASE_ID, col.id, attr.key, attr.size, attr.required, attr.default as any, false);
                        console.log(`  Attribute "${attr.key}" re-created with size ${attr.size}.`);
                    } catch (err: any) {
                        console.error(`  Failed to re-create "${attr.key}": ${err.message}`);
                    }
                }
                continue;
            }

            console.log(`  Adding attribute "${attr.key}" to "${col.id}"...`);
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DATABASE_ID, col.id, attr.key, attr.size!, attr.required, attr.default as any, false);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DATABASE_ID, col.id, attr.key, attr.required, 0, 1000000, attr.default as any, false);
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(DATABASE_ID, col.id, attr.key, attr.required, undefined, false);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(DATABASE_ID, col.id, attr.key, attr.required, attr.default as any, false);
                }

                // Wait a bit for Appwrite to process
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err: any) {
                console.error(`  Failed to add "${attr.key}": ${err.message}`);
            }
        }
    }

    console.log('--- Schema Fix Completed ---');
}

fixSchema();
