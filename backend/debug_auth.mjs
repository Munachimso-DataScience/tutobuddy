import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = 'https://fra.cloud.appwrite.io/v1';
const project = 'tutorbuddy';
const email = 'peterkehindeademola@gmail.com';
const password = 'kehinde5@';

async function runTest() {
    try {
        console.log('--- Testing Connectivity with Axios ---');
        const res = await axios.get(`${endpoint}/health`, {
            headers: { 'X-Appwrite-Project': project }
        });
        console.log('Appwrite Health:', res.data.status);

        console.log('\n--- Testing Login with Axios ---');
        try {
            const loginRes = await axios.post(`${endpoint}/account/sessions/email`, {
                email,
                password
            }, {
                headers: { 'X-Appwrite-Project': project }
            });
            console.log('SUCCESS Login! User:', loginRes.data.providerEmail);
        } catch (e) {
            console.error('FAILED Login:');
            console.error('Status:', e.response?.status);
            console.error('Data:', JSON.stringify(e.response?.data, null, 2));
        }
    } catch (error) {
        console.error('Connection Error:', error.message);
    }
}

runTest();
