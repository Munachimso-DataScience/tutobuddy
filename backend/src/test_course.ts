import { Client, Databases, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';
const COLLECTIONS_COURSES = 'courses';

async function testCreateCourse() {
    console.log('--- Testing Course Creation with Long Description ---');
    const longDescription = 'A'.repeat(3000); // 3000 chars, more than 2048
    
    try {
        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS_COURSES,
            ID.unique(),
            {
                title: 'Test Course Long Description',
                name: 'Test Course Long Description',
                description: longDescription,
                code: 'TEST101',
                student_id: 'test_user_id',
                progress: 0,
                exam_readiness: 0,
                category: 'Science',
                created_at: new Date().toISOString()
            }
        );
        console.log('SUCCESS! Course created with ID:', doc.$id);
        
        // Cleanup
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS_COURSES, doc.$id);
        console.log('Cleanup: Test document deleted.');
    } catch (e: any) {
        console.error('FAILED!', e.message);
    }
}

testCreateCourse();
