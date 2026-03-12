import { Client, Account } from 'node-appwrite';

export const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const session = req.headers['x-appwrite-session'] || req.headers['authorization']?.split(' ')[1];

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized: No session provided' });
        }

        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT!)
            .setProject(process.env.APPWRITE_PROJECT_ID!)
            .setSession(session);

        const account = new Account(client);
        const user = await account.get();
        req.user = user;
        next();
    } catch (error: any) {
        res.status(401).json({ error: 'Unauthorized: Invalid session' });
    }
};
