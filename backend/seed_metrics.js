const { Client, Databases, ID } = require('node-appwrite');
const dotenv = require('dotenv');
dotenv.config({ override: true });
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);
async function run() {
    try {
        await databases.createDocument('tutorbuddy', 'system_metrics', ID.unique(), {
            timestamp: new Date().toISOString(),
            total_ai_requests: 1245,
            quiz_generation_success_rate: 94.5,
            notification_sends: 832,
            daily_active_users: 142,
            avg_response_time: 320.5
        });
        console.log("Seeded metrics successfully");
    } catch(e) {
        console.error(e);
    }
}
run();
