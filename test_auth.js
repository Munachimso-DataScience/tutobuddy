const { Client, Account } = require('node-appwrite');
require('dotenv').config({ path: 'backend/.env' });

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID);

const account = new Account(client);

async function testAuth() {
    try {
        // Need email/password to login... wait, I don't know a valid user credentials.
        console.log("No valid credentials");
    } catch (e) {
        console.error(e);
    }
}

testAuth();
