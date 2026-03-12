import { Client, Users, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
    .setKey(process.env.APPWRITE_API_KEY || '');

const users = new Users(client);

async function register() {
    console.log('Attempting to register user via Admin SDK...');
    try {
        const result = await users.create(
            ID.unique(),
            'peterkehindeademola@gmail.com',
            undefined, // phone
            'kehinde5@',
            'Peter Kehinde Ademola'
        );
        console.log('User registered successfully!', result.$id);
    } catch (error: any) {
        console.error('Registration failed:', error.message);
        if (error.code === 409) {
            console.log('User already exists.');
        } else if (error.code === 401) {
            console.log('API Key does not have "users.write" scope.');
        }
    }
}

register();
