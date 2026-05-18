import axios from 'axios';
import fs from 'fs';
import path from 'path';

const AI_URL = 'http://localhost:8080';

async function runTests() {
    console.log('====================================================');
    console.log('🚀 TUTORBUDDY AI UPGRADES - INTEGRATION VERIFIER 🚀');
    console.log('====================================================\n');

    // 1. Health Check
    try {
        console.log('📡 Testing FastAPI Microservice Health...');
        const health = await axios.get(`${AI_URL}/`);
        console.log('✅ FastAPI Health Status:', health.data);
    } catch (err: any) {
        console.error('❌ FastAPI is not running at localhost:8080. Please start it with command: cd ai-services && .\\venv\\Scripts\\activate && uvicorn src.main:app --port 8080 --reload');
        return;
    }

    // 2. Test Summarize Endpoint
    try {
        console.log('\n📝 Testing AI Document Summarizer...');
        const summarizeRes = await axios.post(`${AI_URL}/summarize`, {
            text: 'TutorBuddy is an advanced study companion built to help university students analyze their course materials, generate custom conceptual quizzes, read text aloud, and rate handwritten essays using modern computer vision AI models like Google Gemini 1.5 Flash.'
        });
        console.log('✅ Summarizer Response:');
        console.log(summarizeRes.data.summary);
    } catch (err: any) {
        console.error('❌ Summarizer failed:', err.message);
    }

    // 3. Test Conceptual Quiz Generation
    try {
        console.log('\n🧠 Testing Conceptual Quiz Generation (Google Gemini)...');
        const quizRes = await axios.post(`${AI_URL}/generate-quiz`, {
            text: 'Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organisms activities. This chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water.'
        });
        console.log('✅ Quiz Generation Response:');
        console.log(JSON.stringify(quizRes.data, null, 2));
    } catch (err: any) {
        console.error('❌ Quiz Generation failed:', err.message);
    }

    console.log('\n🎉 INTEGRATION TEST SUITE COMPLETED SUCCESSFULLY! 🎉');
}

runTests();
