const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyLine = env.split('\n').find(l => l.startsWith('APPWRITE_API_KEY='));
if (keyLine) {
    const key = keyLine.split('=')[1].trim();
    console.log('Hex:', Buffer.from(key).toString('hex'));
    console.log('Length:', key.length);
}
