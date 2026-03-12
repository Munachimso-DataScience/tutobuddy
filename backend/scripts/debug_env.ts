import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- DEBUG ENV ---');
console.log('Project ID:', process.env.APPWRITE_PROJECT_ID);
console.log('Endpoint:', process.env.APPWRITE_ENDPOINT);
console.log('Key length:', process.env.APPWRITE_API_KEY?.length);
console.log('Key start:', process.env.APPWRITE_API_KEY?.substring(0, 10));
console.log('-----------------');
