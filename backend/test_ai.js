const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function test() {
    try {
        console.log('Testing AI Service at:', AI_SERVICE_URL);
        const form = new FormData();
        // Create a dummy text file
        const content = Buffer.from('This is a test study material about Artificial Intelligence.');
        form.append('file', content, { filename: 'test.txt', contentType: 'text/plain' });

        console.log('Sending request to /extract-text...');
        const extractRes = await axios.post(`${AI_SERVICE_URL}/extract-text`, form, {
            headers: form.getHeaders()
        });
        console.log('Extraction Result:', extractRes.data);

        console.log('Sending request to /generate-quiz...');
        const quizRes = await axios.post(`${AI_SERVICE_URL}/generate-quiz`, {
            text: extractRes.data.text
        });
        console.log('Quiz Result:', JSON.stringify(quizRes.data, null, 2));

    } catch (error) {
        console.error('Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
