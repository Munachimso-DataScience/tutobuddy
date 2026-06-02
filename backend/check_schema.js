const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Hardcoded to avoid .env issues
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function checkSchema() {
    try {
        const collection = await databases.getCollection(
            process.env.APPWRITE_DATABASE_ID || 'tutorbuddy',
            'notifications'
        );
        console.log("Attributes:");
        collection.attributes.forEach(attr => {
            console.log(`- ${attr.key} (${attr.type})`);
        });
    } catch (e) {
        console.error('Schema check failed:', e.message);
    }
}

checkSchema();
