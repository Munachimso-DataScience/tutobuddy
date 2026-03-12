import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testKeyVariant() {
    const rawKey = process.env.APPWRITE_API_KEY || '';
    const cleanKey = rawKey.endsWith('s') ? rawKey.slice(0, -1) : rawKey;
    
    console.log('Testing key without trailing "s"...');
    console.log('Original length:', rawKey.length);
    console.log('Clean length:', cleanKey.length);

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
        .setKey(cleanKey);

    const databases = new Databases(client);
    try {
        await databases.list();
        console.log('SUCCESS! The trailing "s" was the problem.');
    } catch (error: any) {
        console.log(`FAILED with clean key: ${error.message} (${error.code})`);
    }
}

testKeyVariant();
