import { Client, Users, Databases } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || 'tutorbuddy')
    .setKey(process.env.APPWRITE_API_KEY || '');

const users = new Users(client);
const databases = new Databases(client);

async function syncProfile() {
    try {
        const email = 'peterkehindeademola@gmail.com';
        const userList = await users.list();
        const peter = userList.users.find(u => u.email === email);

        if (peter) {
            console.log(`Found Peter with ID: ${peter.$id}`);
            
            try {
                // Try to create profile
                await databases.createDocument(
                    process.env.APPWRITE_DATABASE_ID!,
                    'users_profiles',
                    peter.$id,
                    {
                        user_id: peter.$id,
                        full_name: 'Peter Kehinde Ademola',
                        school: 'TutorBuddy Academy',
                        course_of_study: 'Full Stack Development',
                        current_streak: 0,
                        last_active: new Date().toISOString()
                    }
                );
                console.log('Profile created in database!');
            } catch (e: any) {
                if (e.code === 409) {
                    console.log('Profile already exists.');
                } else {
                    console.error('Error creating profile:', e.message);
                }
            }
        } else {
            console.log('Peter not found in Auth.');
        }
    } catch (error: any) {
        console.error('Sync failed:', error.message);
    }
}

syncProfile();
