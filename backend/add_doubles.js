const { Client, Databases } = require('node-appwrite');
const dotenv = require('dotenv');
dotenv.config({ override: true });
const client = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
async function run() {
    try {
        await databases.createFloatAttribute('tutorbuddy', 'system_metrics', 'quiz_generation_success_rate', false, undefined, undefined, 0.0);
        await databases.createFloatAttribute('tutorbuddy', 'system_metrics', 'avg_response_time', false, undefined, undefined, 0.0);
        console.log('Added doubles');
    } catch(e) { console.error(e.message); }
}
run();
