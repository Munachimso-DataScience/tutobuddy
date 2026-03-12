import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function tryEndpoints() {
    const endpoints = [
        'https://cloud.appwrite.io/v1',
        'https://fra.cloud.appwrite.io/v1'
    ];

    for (const endpoint of endpoints) {
        console.log(`Testing endpoint: ${endpoint}`);
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
            .setKey(process.env.APPWRITE_API_KEY || '');

        const databases = new Databases(client);
        try {
            await databases.list();
            console.log(`SUCCESS with ${endpoint}`);
            return;
        } catch (error: any) {
            console.log(`FAILED with ${endpoint}: ${error.message} (${error.code})`);
        }
    }
}

tryEndpoints();
