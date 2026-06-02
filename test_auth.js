async function test() {
    try {
        const id = 'test' + Date.now();
        const email = id + '@example.com';
        const projectId = 'tutorbuddy';
        
        // register
        await fetch('https://fra.cloud.appwrite.io/v1/account', {
            method: 'POST',
            headers: {
                'x-appwrite-project': projectId,
                'content-type': 'application/json',
                'origin': 'http://localhost:3000'
            },
            body: JSON.stringify({ userId: id, email, password: 'password123', name: 'Test User' })
        });
        
        // login
        const loginRes = await fetch('https://fra.cloud.appwrite.io/v1/account/sessions/email', {
            method: 'POST',
            headers: {
                'x-appwrite-project': projectId,
                'content-type': 'application/json',
                'origin': 'http://localhost:3000'
            },
            body: JSON.stringify({ email, password: 'password123' })
        });
        
        const fallbackCookie = loginRes.headers.get('x-fallback-cookies');
        console.log('Got fallback cookie:', fallbackCookie);
        
        // get account IMMEDIATELY
        const accountRes1 = await fetch('https://fra.cloud.appwrite.io/v1/account', {
            method: 'GET',
            headers: {
                'x-appwrite-project': projectId,
                'x-fallback-cookies': fallbackCookie,
                'origin': 'http://localhost:3000'
            }
        });
        console.log('Immediate GET /account status:', accountRes1.status);
        
        // get account after 2 seconds
        await new Promise(r => setTimeout(r, 2000));
        const accountRes2 = await fetch('https://fra.cloud.appwrite.io/v1/account', {
            method: 'GET',
            headers: {
                'x-appwrite-project': projectId,
                'x-fallback-cookies': fallbackCookie,
                'origin': 'http://localhost:3000'
            }
        });
        console.log('Delayed GET /account status:', accountRes2.status);
        
    } catch(e) {
        console.log('Error', e);
    }
}
test();
