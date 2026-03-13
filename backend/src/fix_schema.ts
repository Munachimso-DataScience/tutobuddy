import { Client, Databases, Storage, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

const schema = [
    {
        id: 'users_profiles',
        name: 'User Profiles',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'full_name', type: 'string', size: 255, required: false },
            { key: 'school', type: 'string', size: 255, required: false },
            { key: 'course_of_study', type: 'string', size: 255, required: false },
            { key: 'current_streak', type: 'integer', required: false, default: 0 },
            { key: 'last_active', type: 'datetime', required: false }
        ]
    },
    {
        id: 'courses',
        name: 'Courses',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'description', type: 'string', size: 2048, required: false },
            { key: 'code', type: 'string', size: 50, required: false },
            { key: 'student_id', type: 'string', size: 255, required: false },
            { key: 'progress', type: 'integer', required: false, default: 0 },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: 'materials',
        name: 'Materials',
        attributes: [
            { key: 'title', type: 'string', size: 255, required: false },
            { key: 'file_id', type: 'string', size: 255, required: false },
            { key: 'course_id', type: 'string', size: 255, required: false },
            { key: 'type', type: 'string', size: 50, required: false },
            { key: 'processed', type: 'boolean', required: false, default: false },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: 'quizzes',
        name: 'Quizzes',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'material_id', type: 'string', size: 255, required: false },
            { key: 'content', type: 'string', size: 15000, required: false },
            { key: 'score', type: 'integer', required: false },
            { key: 'total_questions', type: 'integer', required: false },
            { key: 'created_at', type: 'datetime', required: false }
        ]
    },
    {
        id: 'activity_logs',
        name: 'Activity Logs',
        attributes: [
            { key: 'user_id', type: 'string', size: 255, required: false },
            { key: 'type', type: 'string', size: 50, required: false },
            { key: 'details', type: 'string', size: 5000, required: false },
            { key: 'timestamp', type: 'datetime', required: false }
        ]
    }
];

async function fixSchema() {
    console.log('--- Starting Schema Fix ---');
    
    // Ensure Database exists
    try {
        await databases.get(databaseId);
        console.log(`Database "${databaseId}" OK.`);
    } catch (e) {
        console.log(`Creating database "${databaseId}"...`);
        await databases.create(databaseId, databaseId);
    }

    for (const col of schema) {
        let collection;
        try {
            collection = await databases.getCollection(databaseId, col.id);
            console.log(`Collection "${col.id}" exists.`);
        } catch (e) {
            console.log(`Creating collection "${col.id}"...`);
            collection = await databases.createCollection(databaseId, col.id, col.name);
        }

        const existingAttrs = collection.attributes.map((a: any) => a.key);

        for (const attr of col.attributes) {
            if (existingAttrs.includes(attr.key)) {
                console.log(`  Attribute "${attr.key}" already exists in "${col.id}".`);
                continue;
            }

            console.log(`  Adding attribute "${attr.key}" to "${col.id}"...`);
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(databaseId, col.id, attr.key, attr.size!, attr.required, attr.default as string);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(databaseId, col.id, attr.key, attr.required, 0, 1000000, attr.default as number);
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(databaseId, col.id, attr.key, attr.required);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(databaseId, col.id, attr.key, attr.required, attr.default as boolean);
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
