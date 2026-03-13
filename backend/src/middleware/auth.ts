import { Client, Account } from 'node-appwrite';

export const authMiddleware = async (req: any, res: any, next: any) => {
    try {
        const authHeader = req.headers['authorization'];
        const sessionHeader = req.headers['x-appwrite-session'];
        
        const client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT!)
            .setProject(process.env.APPWRITE_PROJECT_ID!);

        if (authHeader?.startsWith('Bearer ')) {
            const jwt = authHeader.split(' ')[1];
            client.setJWT(jwt);
        } else if (sessionHeader) {
            client.setSession(sessionHeader);
        } else {
            return res.status(401).json({ error: 'Unauthorized: No session or token provided' });
        }

        const account = new Account(client);
        const user = await account.get();
        req.user = user;
        next();
    } catch (error: any) {
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid session or token' });
    }
};
