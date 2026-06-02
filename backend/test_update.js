const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: '.env' });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function testUpdate() {
    try {
        const notifications = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID || 'tutobuddy',
            'notifications'
        );
        
        console.log(`Found ${notifications.total} notifications`);
        if (notifications.total > 0) {
            const first = notifications.documents[0];
            console.log(`Testing update on ${first.$id}, currently is_read = ${first.is_read}`);
            
            await databases.updateDocument(
                process.env.APPWRITE_DATABASE_ID || 'tutobuddy',
                'notifications',
                first.$id,
                { is_read: true }
            );
            console.log('Update succeeded!');
        }
    } catch (e) {
        console.error('Update failed:', e.message);
    }
}

testUpdate();
