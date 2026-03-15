import { Client, Databases, Users, ID, Query } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const databases = new Databases(client);
const users = new Users(client);

import { COLLECTIONS } from './lib/collections';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'tutorbuddy';

async function fixProfiles() {
    console.log('Checking for missing user profiles...');
    try {
        const allUsers = await users.list();
        console.log(`Found ${allUsers.total} users.`);

        for (const user of allUsers.users) {
            try {
                // Check if profile exists
                await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
                console.log(`Profile for ${user.email} OK.`);
            } catch (e: any) {
                if (e.code === 404) {
                    console.log(`Creating missing profile for ${user.email}...`);
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        user.$id,
                        {
                            user_id: user.$id,
                            full_name: user.name || 'Student',
                            school: 'General',
                            course_of_study: 'General',
                            current_streak: 0,
                            last_active: new Date().toISOString()
                        }
                    );
                } else {
                    console.error(`Error checking profile for ${user.email}:`, e.message);
                }
            }
        }
        console.log('Profile fix complete.');
    } catch (err: any) {
        console.error('Fatal error:', err.message);
    }
}

fixProfiles();
