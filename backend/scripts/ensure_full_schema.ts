import { Client, Databases, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

interface Attribute {
    key: string;
    type: 'string' | 'integer' | 'datetime' | 'boolean';
    size?: number;
    required: boolean;
    default?: any;
}

interface Collection {
    id: string;
    name: string;
    attributes: Attribute[];
}

const collections: Collection[] = [
    {
        id: 'users_profiles',
        name: 'User Profiles',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'full_name', type: 'string', size: 255, required: true },
            { key: 'school', type: 'string', size: 255, required: true },
            { key: 'course_of_study', type: 'string', size: 255, required: true },
            { key: 'current_streak', type: 'integer', required: false, default: 0 },
            { key: 'last_active', type: 'string', size: 50, required: false } // Use string for ISO dates if datetime is picky
        ]
    },
    {
        id: 'courses',
        name: 'Courses',
        attributes: [
            { key: 'name', type: 'string', size: 255, required: true },
            { key: 'code', type: 'string', size: 255, required: true },
            { key: 'student_id', type: 'string', size: 255, required: true },
            { key: 'progress', type: 'integer', required: false, default: 0 },
            { key: 'exam_readiness', type: 'integer', required: false, default: 0 },
            { key: 'exam_date', type: 'string', size: 50, required: false }
        ]
    },
    {
        id: 'study_materials',
        name: 'Study Materials',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'file_id', type: 'string', size: 255, required: true },
            { key: 'course_id', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 50, required: true },
            { key: 'uploaded_at', type: 'string', size: 50, required: false }
        ]
    },
    {
        id: 'quizzes',
        name: 'Quizzes',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'material_id', type: 'string', size: 255, required: true },
            { key: 'course_id', type: 'string', size: 255, required: false },
            { key: 'content', type: 'string', size: 10000, required: true },
            { key: 'created_at', type: 'string', size: 50, required: false },
            { key: 'score', type: 'integer', required: false, default: 0 }
        ]
    },
    {
        id: 'activity_logs',
        name: 'Activity Logs',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'type', type: 'string', size: 50, required: true },
            { key: 'description', type: 'string', size: 2000, required: true },
            { key: 'timestamp', type: 'string', size: 50, required: false }
        ]
    },
    {
        id: 'tasks',
        name: 'Tasks',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'due_date', type: 'string', size: 50, required: false },
            { key: 'priority', type: 'string', size: 20, required: false, default: 'medium' },
            { key: 'status', type: 'string', size: 20, required: false, default: 'pending' }
        ]
    },
    {
        id: 'schedules',
        name: 'Schedules',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: true },
            { key: 'title', type: 'string', size: 255, required: true },
            { key: 'day', type: 'string', size: 20, required: true },
            { key: 'start_time', type: 'string', size: 20, required: true },
            { key: 'end_time', type: 'string', size: 20, required: true }
        ]
    }
];

async function ensureSchema() {
    console.log('Ensuring Full Appwrite Schema...');

    try {
        // Create Database
        try {
            await databases.create(databaseId, databaseId);
            console.log(`Created database: ${databaseId}`);
        } catch (e) {}

        for (const col of collections) {
            console.log(`Checking collection: ${col.id}...`);
            try {
                await databases.getCollection(databaseId, col.id);
            } catch (e) {
                console.log(`Creating collection: ${col.id}...`);
                await databases.createCollection(databaseId, col.id, col.name);
            }

            // Get existing attributes
            const currentCollection = await databases.getCollection(databaseId, col.id);
            const existingKeys = (currentCollection.attributes as any[]).map(a => a.key);

            for (const attr of col.attributes) {
                if (existingKeys.includes(attr.key)) {
                    // console.log(`  Attribute ${attr.key} already exists.`);
                    continue;
                }

                console.log(`  Adding attribute: ${attr.key}...`);
                try {
                    switch (attr.type) {
                        case 'string':
                            await databases.createStringAttribute(databaseId, col.id, attr.key, attr.size || 255, attr.required, attr.default);
                            break;
                        case 'integer':
                            await databases.createIntegerAttribute(databaseId, col.id, attr.key, attr.required, 0, 1000000, attr.default);
                            break;
                        case 'datetime':
                            await databases.createDatetimeAttribute(databaseId, col.id, attr.key, attr.required);
                            break;
                        case 'boolean':
                            await databases.createBooleanAttribute(databaseId, col.id, attr.key, attr.required, attr.default);
                            break;
                    }
                } catch (attrErr: any) {
                    console.error(`  Failed to add ${attr.key}: ${attrErr.message}`);
                }
            }
        }

        console.log('Schema verification complete.');
    } catch (error: any) {
        console.error('Schema Sync Failed:', error.message);
    }
}

ensureSchema();
