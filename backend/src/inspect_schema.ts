import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

async function inspect() {
    try {
        const collections = await databases.listCollections(DATABASE_ID);
        for (const col of collections.collections) {
            console.log(`\nCollection: ${col.name} (${col.$id})`);
            const details = await databases.getCollection(DATABASE_ID, col.$id);
            for (const attr of details.attributes) {
                console.log(` - ${attr.key}: ${attr.type} (Required: ${attr.required})`);
            }
        }
    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

inspect();
