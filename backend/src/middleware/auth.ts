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
            console.log('Using JWT auth, token length:', jwt.length);
        } else if (sessionHeader) {
            client.setSession(sessionHeader);
            console.log('Using session auth');
        } else {
            console.log('No auth header found');
            return res.status(401).json({ error: 'Unauthorized: No session or token provided' });
        }

        const account = new Account(client);
        console.log('Calling account.get()...');
        const user = await account.get();
        console.log('Auth success for:', user.email);
        req.user = user;
        next();
    } catch (error: any) {
        const logMsg = `${new Date().toISOString()} - Auth Error: ${error.message}\n`;
        require('fs').appendFileSync('auth_logs.txt', logMsg);
        console.error('Auth Middleware Error:', error.message);
        res.status(401).json({ error: 'Unauthorized: Invalid session or token', details: error.message });
    }
};
