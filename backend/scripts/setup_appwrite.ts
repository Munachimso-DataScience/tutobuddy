import { Client, Databases, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

async function setup() {
    console.log('Starting Appwrite Setup...');

    try {
        // 1. Create Database if it doesn't exist
        try {
            await databases.get(databaseId);
            console.log(`Database "${databaseId}" already exists.`);
        } catch (e) {
            console.log(`Creating database "${databaseId}"...`);
            await databases.create(databaseId, databaseId);
        }

        const collections = [
            {
                id: 'users_profiles',
                name: 'User Profiles',
                attributes: [
                    { key: 'user_id', type: 'string', size: 255, required: true },
                    { key: 'full_name', type: 'string', size: 255, required: true },
                    { key: 'school', type: 'string', size: 255, required: true },
                    { key: 'course_of_study', type: 'string', size: 255, required: true },
                    { key: 'current_streak', type: 'integer', required: true, default: 0 },
                    { key: 'last_active', type: 'datetime', required: true }
                ]
            },
            {
                id: 'courses',
                name: 'Courses',
                attributes: [
                    { key: 'name', type: 'string', size: 255, required: true },
                    { key: 'code', type: 'string', size: 255, required: true },
                    { key: 'student_id', type: 'string', size: 255, required: true },
                    { key: 'progress', type: 'integer', required: true, default: 0 }
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
                    { key: 'uploaded_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'quizzes',
                name: 'Quizzes',
                attributes: [
                    { key: 'title', type: 'string', size: 255, required: true },
                    { key: 'course_id', type: 'string', size: 255, required: true },
                    { key: 'score', type: 'integer', required: true },
                    { key: 'total_questions', type: 'integer', required: true },
                    { key: 'date_taken', type: 'datetime', required: true }
                ]
            },
            {
                id: 'activity_logs',
                name: 'Activity Logs',
                attributes: [
                    { key: 'user_id', type: 'string', size: 255, required: true },
                    { key: 'type', type: 'string', size: 50, required: true },
                    { key: 'description', type: 'string', size: 1000, required: true },
                    { key: 'timestamp', type: 'datetime', required: true }
                ]
            }
        ];

        for (const col of collections) {
            try {
                await databases.getCollection(databaseId, col.id);
                console.log(`Collection "${col.name}" already exists.`);
            } catch (e) {
                console.log(`Creating collection "${col.name}"...`);
                await databases.createCollection(databaseId, col.id, col.name);

                // Add Attributes
                for (const attr of col.attributes) {
                    console.log(`  Adding attribute "${attr.key}" to "${col.name}"...`);
                    try {
                        if (attr.type === 'string') {
                            await databases.createStringAttribute(
                                databaseId, 
                                col.id, 
                                attr.key, 
                                attr.size!, 
                                attr.required, 
                                attr.default !== undefined ? (attr.default as any) : undefined
                            );
                        } else if (attr.type === 'integer') {
                            await databases.createIntegerAttribute(
                                databaseId, 
                                col.id, 
                                attr.key, 
                                attr.required, 
                                0, 
                                1000000, 
                                attr.default !== undefined ? (attr.default as any) : undefined
                            );
                        } else if (attr.type === 'datetime') {
                            await databases.createDatetimeAttribute(
                                databaseId, 
                                col.id, 
                                attr.key, 
                                attr.required
                            );
                        }
                    } catch (attrErr) {
                        console.error(`  Failed to add attribute "${attr.key}":`, attrErr);
                    }
                }
                console.log(`Successfully set up "${col.name}"`);
            }
        }

        console.log('Appwrite Setup Completed Successfully!');
    } catch (error) {
        console.error('Setup Failed:', error);
    }
}

setup();
