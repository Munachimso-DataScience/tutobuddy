const axios = require('axios');
require('dotenv').config({ path: 'backend/.env' });

async function testUpdateRest() {
    try {
        const projectId = process.env.APPWRITE_PROJECT_ID;
        const apiKey = process.env.APPWRITE_API_KEY;
        const databaseId = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';
        const collectionId = 'notifications';
        
        // 1. Fetch documents
        const listRes = await axios.get(`https://cloud.appwrite.io/v1/databases/${databaseId}/collections/${collectionId}/documents`, {
            headers: {
                'X-Appwrite-Project': projectId,
                'X-Appwrite-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        const docs = listRes.data.documents;
        console.log(`Found ${docs.length} notifications`);
        
        if (docs.length > 0) {
            const first = docs[0];
            console.log(`Testing update on ${first.$id}, currently is_read = ${first.is_read}`);
            
            // 2. Update document
            const updateRes = await axios.patch(`https://cloud.appwrite.io/v1/databases/${databaseId}/collections/${collectionId}/documents/${first.$id}`, {
                data: { is_read: true }
            }, {
                headers: {
                    'X-Appwrite-Project': projectId,
                    'X-Appwrite-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Update succeeded!', updateRes.data);
        }
    } catch (e) {
        console.error('Update failed:', e.response?.data || e.message);
    }
}

testUpdateRest();
