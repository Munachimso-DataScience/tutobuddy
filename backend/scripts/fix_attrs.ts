import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function fixAttributes() {
    const databaseId = process.env.APPWRITE_DATABASE_ID!;
    try {
        console.log('Adding missing current_streak attribute...');
        await databases.createIntegerAttribute(databaseId, 'users_profiles', 'current_streak', false, 0, 1000000, 0);
        
        console.log('Adding missing progress attribute to Courses...');
        await databases.createIntegerAttribute(databaseId, 'courses', 'progress', false, 0, 100, 0);
        
        console.log('Done fixing attributes.');
    } catch (e: any) {
        console.error('Fix failed:', e.message);
    }
}

fixAttributes();
