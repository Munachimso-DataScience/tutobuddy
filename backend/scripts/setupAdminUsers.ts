import { Client, Account, Users, Databases, ID } from 'node-appwrite';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { COLLECTIONS, DATABASE_ID } from '../src/lib/collections';

dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

const account = new Account(client);
const users = new Users(client);
const databases = new Databases(client);

const adminUsers = [
    { email: 'peterkehindeademola@gmail.com', name: 'Peter Kehinde Ademola' },
    { email: 'patiencemigwe@gmail.com', name: 'Patience Migwe' }
];

const defaultPassword = 'TempPass123!'; // In a real scenario, use a secure method to set password

async function setupAdminUsers() {
    for (const adminUser of adminUsers) {
        try {
            // Try to get the user by email (by listing users and filtering)
            const usersList = await users.list();
            const existingUser = usersList.users.find(u => u.email === adminUser.email);

            let userId;
            if (existingUser) {
                console.log(`User ${adminUser.email} already exists with ID: ${existingUser.$id}`);
                userId = existingUser.$id;
            } else {
                // Create the user
                const createdUser = await account.create(
                    ID.unique(),
                    adminUser.email,
                    defaultPassword,
                    adminUser.name
                );
                console.log(`Created user ${adminUser.email} with ID: ${createdUser.$id}`);
                userId = createdUser.$id;
            }

            // Now ensure the profile exists and set role to admin
            try {
                const profile = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
                // Update the role to admin if it's not already
                if (profile.role !== 'admin') {
                    await databases.updateDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId,
                        { role: 'admin' }
                    );
                    console.log(`Updated role to admin for ${adminUser.email}`);
                } else {
                    console.log(`Role is already admin for ${adminUser.email}`);
                }
            } catch (profileError: any) {
                if (profileError.code === 404) {
                    // Profile doesn't exist, create it with admin role
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        userId,
                        {
                            user_id: userId,
                            full_name: adminUser.name,
                            school: 'General',
                            course_of_study: 'General',
                            role: 'admin',
                            department: '',
                            class_group: '',
                            assigned_courses: '',
                            current_streak: 0,
                            last_active: new Date().toISOString(),
                            study_minutes_total: 0,
                            study_minutes_today: 0,
                            last_study_minutes: 0,
                            recent_content_covered: '',
                            last_study_session_at: new Date().toISOString()
                        }
                    );
                    console.log(`Created profile for ${adminUser.email} with admin role`);
                } else {
                    console.error(`Error checking/creating profile for ${adminUser.email}:`, profileError.message);
                }
            }
        } catch (error: any) {
            console.error(`Failed to process admin user ${adminUser.email}:`, error.message);
        }
    }
}

setupAdminUsers();
