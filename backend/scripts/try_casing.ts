import { Client, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function tryProjects() {
    const ids = ['tutorbuddy', 'TutorBuddy', 'TUTORBUDDY'];
    const key = process.env.APPWRITE_API_KEY || '';

    for (const id of ids) {
        console.log(`Testing Project ID: ${id}`);
        const client = new Client()
            .setEndpoint('https://fra.cloud.appwrite.io/v1')
            .setProject(id)
            .setKey(key);

        const databases = new Databases(client);
        try {
            await databases.list();
            console.log(`SUCCESS with ${id}`);
            return;
        } catch (error: any) {
            console.log(`FAILED with ${id}: ${error.message} (${error.code})`);
        }
    }
}

tryProjects();
