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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        console.warn('Transient JWT error, retrying session connection...', error);

        // Appwrite Cloud can take a moment to fully attach a fresh session.
        // Retry a few times before giving up so we do not cache a guest-state failure.
        const retryDelays = [800, 1200, 1800];
        for (const delay of retryDelays) {
            await sleep(delay);
            try {
                const response = await account.createJWT();
                cachedJWT = response.jwt;
                tokenExpiryTime = Date.now() + 10 * 60 * 1000;
                return cachedJWT;
            } catch (retryError) {
                console.warn('JWT retry failed, trying again...', retryError);
            }
        }

        throw error;
    }
};

export const clearCachedJWT = () => {
    cachedJWT = null;
    tokenExpiryTime = 0;
};
