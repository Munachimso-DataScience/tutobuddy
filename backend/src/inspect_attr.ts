import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function inspect() {
    try {
        const col = await databases.getCollection('tutorbuddy', 'courses');
        console.log('--- Attributes for COURSES ---');
        col.attributes.forEach((attr: any) => {
            if (attr.key === 'description') {
                console.log(`Attribute: ${attr.key}, Type: ${attr.type}, Size: ${attr.size}`);
            }
        });
    } catch (e: any) {
        console.error(e.message);
    }
}

inspect();
