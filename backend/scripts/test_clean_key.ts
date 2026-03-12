import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testCleanKey() {
    const rawKey = process.env.APPWRITE_API_KEY || '';
    const cleanKey = rawKey.replace('standard_', '');
    
    console.log('Testing with clean key (removed standard_)...');
    console.log('Clean key start:', cleanKey.substring(0, 10));

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
        .setKey(cleanKey);

    const databases = new Databases(client);
    try {
        await databases.list();
        console.log('SUCCESS with clean key!');
    } catch (error: any) {
        console.log(`FAILED with clean key: ${error.message} (${error.code})`);
    }
}

testCleanKey();
