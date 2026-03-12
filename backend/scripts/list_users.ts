import { Client, Users } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
    .setKey(process.env.APPWRITE_API_KEY || '');

const users = new Users(client);

async function listUsers() {
    console.log('Attempting to list users...');
    try {
        const response = await users.list();
        console.log('Success! Total users:', response.total);
        response.users.forEach(u => console.log(`- ${u.name} (${u.email})`));
    } catch (error: any) {
        console.error('List users failed:', error.message);
        console.error('Error Code:', error.code);
    }
}

listUsers();
