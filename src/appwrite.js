import { Client, Account, Databases, Storage } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const appwriteConfig = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    tasks: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID,
    resources: import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID,
    reminders: import.meta.env.VITE_APPWRITE_REMINDERS_COLLECTION_ID,
    messages: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
    performance: import.meta.env.VITE_APPWRITE_PERFORMANCE_COLLECTION_ID
  },
  bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID
};
