const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'question_templates';

const templates = [
    {
        name: 'Clinical / Medical Scenario',
        is_active: true,
        prompt_text: `You are an expert Medical Examiner. 
Generate questions that simulate real-world clinical scenarios.
Instead of asking for raw definitions, present a short patient case (e.g., "A 45-year-old male presents with...").
Test the student's ability to diagnose, choose the correct treatment plan, or identify the underlying pathophysiology.
Use professional medical terminology and ensure distractors (wrong answers) are plausible differential diagnoses.`
    },
    {
        name: 'Code & Engineering Logic',
        is_active: false,
        prompt_text: `You are a Senior Software Engineer interviewing a candidate.
Generate questions that focus heavily on code logic, debugging, and system architecture.
Include short snippets of pseudocode or conceptual code in the question if applicable.
Test the student's ability to spot bugs, optimize time/space complexity, or choose the correct design pattern.
Avoid simple syntax questions; focus on "why" and "how" the code works.`
    },
    {
        name: 'Foundational Revision (Beginner)',
        is_active: false,
        prompt_text: `You are a friendly, encouraging High School Tutor.
Generate questions aimed at a beginner who is just learning this topic for the first time.
Focus purely on foundational definitions, core concepts, and basic terminology.
Keep the language extremely simple and accessible.
Ensure the explanations are highly detailed and use simple real-world analogies to explain why the answer is correct.`
    }
];

async function seedTemplates() {
    console.log('Starting template seeding...');
    try {
        for (const tmpl of templates) {
            await databases.createDocument(
                DATABASE_ID,
                COLLECTION_ID,
                ID.unique(),
                tmpl
            );
            console.log(`Created template: ${tmpl.name}`);
        }
        console.log('Seeding complete!');
    } catch (error) {
        console.error('Seeding failed:', error.message);
    }
}

seedTemplates();
