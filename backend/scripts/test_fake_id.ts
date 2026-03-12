import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testFakeProject() {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject('fake_project_id_12345')
        .setKey(process.env.APPWRITE_API_KEY || '');

    const databases = new Databases(client);
    try {
        await databases.list();
    } catch (error: any) {
        console.log(`Fake ID Error: ${error.message} (${error.code}) - Type: ${error.type}`);
    }

    const client2 = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
        .setKey(process.env.APPWRITE_API_KEY || '');
    
    const databases2 = new Databases(client2);
    try {
        await databases2.list();
    } catch (error: any) {
        console.log(`Real ID Error: ${error.message} (${error.code}) - Type: ${error.type}`);
    }
}

testFakeProject();
