import { Client, Databases, Storage, Users } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client();

client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

export const databases = new Databases(client);
export const storage = new Storage(client);
export const users = new Users(client);
export { client };
