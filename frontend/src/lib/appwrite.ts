import { Client, Account, Databases, Storage } from 'appwrite';

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client };

let cachedJWT: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Thread-safe cached Appwrite JWT generator.
 * Caches the JWT for 10 minutes to bypass the Appwrite 10-JWTs/minute rate limit completely.
 */
export const getCachedJWT = async (): Promise<string> => {
    const now = Date.now();
    if (cachedJWT && now < tokenExpiryTime) {
        return cachedJWT;
    }

    try {
        const response = await account.createJWT();
        cachedJWT = response.jwt;
        tokenExpiryTime = now + 10 * 60 * 1000; // 10 minutes
        return cachedJWT;
    } catch (error) {
        console.warn("Transient JWT error, retrying session connection...", error);
        await new Promise(resolve => setTimeout(resolve, 800));
        const response = await account.createJWT();
        cachedJWT = response.jwt;
        tokenExpiryTime = now + 10 * 60 * 1000;
        return cachedJWT;
    }
};
