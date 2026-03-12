import { Client, Account, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Note: Using Client WITHOUT API Key to simulate a public registration
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy');

const account = new Account(client);

async function registerViaPublic() {
    console.log('Attempting public registration (no API key)...');
    try {
        const result = await account.create(
            ID.unique(),
            'peterkehindeademola@gmail.com',
            'kehinde5@',
            'Peter Kehinde Ademola'
        );
        console.log('User registered successfully!', result.$id);
    } catch (error: any) {
        console.error('Registration failed:', error.message);
        console.error('Error code:', error.code);
        if (error.code === 409) {
            console.log('User already exists.');
        }
    }
}

registerViaPublic();
