const { Client, Databases } = require('node-appwrite');
require('dotenv').config({ path: 'backend/.env' });
const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
async function run() {
    try {
        console.log('Adding uploaded_at and category to materials collection...');
        await databases.createDatetimeAttribute(process.env.APPWRITE_DATABASE_ID, 'materials', 'uploaded_at', false, null);
        await databases.createStringAttribute(process.env.APPWRITE_DATABASE_ID, 'materials', 'category', 255, false, null);
        console.log('Attributes added.');
    } catch (e) {
        console.log('Error adding attributes:', e.message);
    }
}
run();
