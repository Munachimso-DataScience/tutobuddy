async function test() {
    try {
        const id = 'test' + Date.now();
        const email = id + '@example.com';
        // register
        await fetch('https://fra.cloud.appwrite.io/v1/account', {
            method: 'POST',
            headers: {
                'x-appwrite-project': 'tutorbuddy',
                'content-type': 'application/json',
                'origin': 'http://localhost:3000'
            },
            body: JSON.stringify({ userId: id, email, password: 'password123', name: 'Test User' })
        });
        
        // login
        const res = await fetch('https://fra.cloud.appwrite.io/v1/account/sessions/email', {
            method: 'POST',
            headers: {
                'x-appwrite-project': 'tutorbuddy',
                'content-type': 'application/json',
                'origin': 'http://localhost:3000'
            },
            body: JSON.stringify({ email, password: 'password123' })
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Exposed Headers:', res.headers.get('access-control-expose-headers'));
        console.log('X-Fallback-Cookies:', res.headers.get('x-fallback-cookies'));
    } catch(e) {
        console.log('Error', e);
    }
}
test();
