const https = require('https');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const url = new URL(`${process.env.APPWRITE_ENDPOINT}/databases`);
const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
        'x-appwrite-project': process.env.APPWRITE_PROJECT_ID,
        'x-appwrite-key': process.env.APPWRITE_API_KEY
    }
};

console.log('Testing with https module...');
console.log('Hostname:', options.hostname);
console.log('Path:', options.path);

const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            console.log('Response:', JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
            console.log('Raw Body:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.end();
