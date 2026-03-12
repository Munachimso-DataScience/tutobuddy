import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function test() {
    console.log('Testing Appwrite Connection...');
    console.log('Endpoint:', process.env.APPWRITE_ENDPOINT);
    console.log('Project ID:', process.env.APPWRITE_PROJECT_ID);
    
    try {
        const response = await databases.list();
        console.log('Connection Successful! Databases found:', response.total);
        response.databases.forEach(db => {
            console.log(`- ${db.name} (ID: ${db.$id})`);
        });
    } catch (error: any) {
        console.error('Connection Failed:', error.message);
        console.error('Error Type:', error.type);
        console.error('Check if your API Key has "databases.read" scope.');
    }
}

test();
