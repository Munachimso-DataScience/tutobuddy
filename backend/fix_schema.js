const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const databaseId = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

async function fix() {
    console.log('Synchronizing Appwrite Schema and Indexes...');
    try {
        const collections = [
            {
                id: 'courses',
                indexes: [{ key: 'student_id', type: 'key', attributes: ['student_id'] }]
            },
            {
                id: 'study_materials',
                indexes: [{ key: 'course_id', type: 'key', attributes: ['course_id'] }]
            },
            {
                id: 'activity_logs',
                indexes: [
                    { key: 'user_id', type: 'key', attributes: ['user_id'] },
                    { key: 'timestamp', type: 'key', attributes: ['timestamp'] }
                ]
            },
            {
                id: 'materials', // Alias just in case
                indexes: [{ key: 'course_id', type: 'key', attributes: ['course_id'] }]
            }
        ];

        for (const col of collections) {
            console.log(`Processing collection ${col.id}...`);
            for (const index of col.indexes) {
                try {
                    await databases.createIndex(
                        databaseId,
                        col.id,
                        index.key,
                        index.type,
                        index.attributes
                    );
                    console.log(`  Added index ${index.key} to ${col.id}`);
                } catch (e) {
                    if (e.message.includes('already exists')) {
                        console.log(`  Index ${index.key} already exists.`);
                    } else {
                        console.log(`  Failed to add index ${index.key}: ${e.message}`);
                    }
                }
            }
        }

        console.log('All updates complete.');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

fix();
