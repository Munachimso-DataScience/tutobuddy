import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function listAttributes() {
    try {
        const collection = await databases.getCollection(process.env.APPWRITE_DATABASE_ID!, 'users_profiles');
        console.log('Attributes in users_profiles:');
        collection.attributes.forEach((a: any) => {
            console.log(`- ${a.key} (${a.type} / ${a.status})`);
        });
    } catch (e: any) {
        console.error('Failed to list attributes:', e.message);
    }
}

listAttributes();
