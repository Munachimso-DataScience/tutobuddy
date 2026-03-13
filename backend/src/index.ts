import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { createCourse, getCourses } from './controllers/courseController';
import { uploadMaterial, getMaterials } from './controllers/materialController';
import { logActivity, getStats } from './controllers/activityController';
import { generateQuiz, getQuizzes } from './controllers/quizController';
import { getExplanation, getHint } from './controllers/feedbackController';
import { checkInactivity, generateWeeklyReports } from './controllers/notificationController';
import { getWeaknessAnalysis } from './controllers/analyticsController';
import { initScheduler } from './utils/scheduler';
import multer from 'multer';

dotenv.config();

const app = express();
// initScheduler();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Study Companion API is running' });
});

// Protected Course Routes
app.post('/api/courses', authMiddleware, createCourse);
app.get('/api/courses', authMiddleware, getCourses);

// Material Routes
app.post('/api/materials/upload', authMiddleware, upload.single('file'), uploadMaterial);
app.get('/api/materials/:courseId', authMiddleware, getMaterials);

// Activity Logging Routes
app.post('/api/activity/log', authMiddleware, logActivity);
app.get('/api/activity/stats', authMiddleware, getStats);

// Quiz Routes
app.post('/api/quizzes/generate', authMiddleware, generateQuiz);
app.get('/api/quizzes/:materialId', authMiddleware, getQuizzes);

// Feedback Routes
app.post('/api/feedback/explain', authMiddleware, getExplanation);
app.post('/api/feedback/hint', authMiddleware, getHint);

// Notification Routes
app.post('/api/notifications/check-inactivity', authMiddleware, checkInactivity);
app.post('/api/notifications/weekly-report', authMiddleware, generateWeeklyReports);

// Analytics Routes
app.get('/api/analytics/weaknesses', authMiddleware, getWeaknessAnalysis);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
