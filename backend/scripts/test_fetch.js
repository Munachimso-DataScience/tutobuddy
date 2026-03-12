const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testFetch() {
    const url = `${process.env.APPWRITE_ENDPOINT}/databases`;
    const headers = {
        'Content-Type': 'application/json',
        'x-appwrite-project': process.env.APPWRITE_PROJECT_ID,
        'x-appwrite-key': process.env.APPWRITE_API_KEY
    };

    console.log('Testing with raw fetch...');
    console.log('URL:', url);
    console.log('Project:', headers['x-appwrite-project']);
    
    try {
        const response = await fetch(url, { headers });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testFetch();
