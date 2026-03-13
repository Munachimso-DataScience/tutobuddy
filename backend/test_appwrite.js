const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);

async function test() {
    console.log('Testing Appwrite connection...');
    try {
        const db = await databases.get(process.env.APPWRITE_DATABASE_ID);
        console.log('Success! Database found:', db.name);
    } catch (e) {
        console.error('Failed:', e.message);
    }
}

test();
