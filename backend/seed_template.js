const sdk = require('node-appwrite');
require('dotenv').config();

const client = new sdk.Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new sdk.Databases(client);

async function run() {
    try {
        const doc = await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID || 'tutorbuddy',
            process.env.APPWRITE_QUESTION_TEMPLATES_COLLECTION_ID || 'question_templates',
            sdk.ID.unique(),
            {
                name: 'Standard MCQ Generator',
                prompt_text: 'You are an expert academic tutor. Generate 5 multiple-choice questions from the provided text. Ensure they test deep understanding, not just rote memorization. Format as JSON with question, options array, and correct_answer.',
                is_active: true
            }
        );
        console.log('Successfully created template:', doc.$id);
    } catch (e) {
        console.error('Error:', e);
    }
}
run();
