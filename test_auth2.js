async function test() {
    try {
        const email = 'test1780431668042@example.com';
        const projectId = 'tutorbuddy';
        const fallbackCookie = '{"a_session_tutorbuddy":"eyJpZCI6InRlc3QxNzgwNDMxNjY4MDQyIiwic2VjcmV0IjoiZWE2NGE1MjMyOGU1M2Q4ZTE2MGY3MDJiYmE0M2UwZmY3MjFmYjhmYThlMzU2MGYwMDhlNzFiNzQ1YjAxYWFjZjM5MWZiOGEyODBjM2Y2NDQ5MWJkODhjYmY1MjdiYWRlNTg5YTQzYmJiYTBiMjU0M2ViODgwMzc2ZGQwMzk1YTUxOTA4ZjQ5MGFiMmVjM2YzYmE3ZGZiMDYzOWU5YWJkNTUyNmYyZTA1NjU0MWJjZmFlOGRlM2M0MGNkMjYxMjM2YTYwNmFiOTY4ZjQ5MWUwNzg4OTJhMmY4YmE3OGE4MWY2YjE4ODQyNTUwYzA4YTBlNThlNThmNzZlNTI3MjQ3MiJ9"}';
        
        // login AGAIN to get 409
        const loginRes = await fetch('https://fra.cloud.appwrite.io/v1/account/sessions/email', {
            method: 'POST',
            headers: {
                'x-appwrite-project': projectId,
                'x-fallback-cookies': fallbackCookie,
                'content-type': 'application/json',
                'origin': 'http://localhost:3000'
            },
            body: JSON.stringify({ email, password: 'password123' })
        });
        
        console.log('Login 3 status:', loginRes.status);
        const data = await loginRes.json();
        console.log('Login 3 response:', data);
        console.log('Exposed Headers:', loginRes.headers.get('access-control-expose-headers'));
        console.log('X-Fallback-Cookies:', loginRes.headers.get('x-fallback-cookies'));
    } catch(e) {
        console.log('Error', e);
    }
}
test();
