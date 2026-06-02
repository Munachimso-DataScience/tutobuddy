import dotenv from 'dotenv';
dotenv.config({ override: true });

import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth';
import { requireRoles } from './middleware/roles';
import { createCourse, getCourses, deleteCourse } from './controllers/courseController';
import { uploadMaterial, getMaterials, deleteMaterial, getMaterialText, summarizeMaterial, chatWithMaterial } from './controllers/materialController';
import { logActivity, getStats } from './controllers/activityController';
import { generateQuiz, getQuizzes, updateQuizScore } from './controllers/quizController';
import { evaluateEssay, evaluateHandwrittenAnswer } from './controllers/essayController';
import { evaluateOcr } from './controllers/ocrController';
import { getExplanation, getHint } from './controllers/feedbackController';
import { checkInactivity, generateWeeklyReports, getNotifications, getSmtpStatus, markNotificationRead, sendDailyStudySummaries, sendStudySessionReminders, sendTestEmail } from './controllers/notificationController';
import { getWeaknessAnalysis } from './controllers/analyticsController';
import { getLeaderboard } from './controllers/leaderboardController';
import { getTasks, createTask, updateTaskStatus, deleteTask } from './controllers/taskController';
import { getSchedules, createSchedule, deleteSchedule } from './controllers/scheduleController';
import { initScheduler } from './utils/scheduler';
import { getCurrentUser } from './controllers/authController';
import { getAdminSummary, getAdminUsers, updateAdminUserRole, deleteAdminUser, getAdminTemplates, createAdminTemplate, updateAdminTemplate, deleteAdminTemplate, getAdminContent, deleteAdminContent, toggleAdminContentFlag } from './controllers/adminController';
import { createCourseOffering, getCourseOfferings, getLecturerSummary, sendLecturerReminder, getLecturerStudentHistory } from './controllers/lecturerController';
import { updateProfile } from './controllers/profileController';
import multer from 'multer';

const app = express();
initScheduler();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).send('<h1>TutorBuddy API</h1><p>The backend is running. Use the frontend to interact with the service.</p><a href="/health">Check Health Status</a>');
});

import { databases } from './lib/appwrite-admin';
import { DATABASE_ID } from './lib/collections';

app.get('/health', async (req, res) => {
    try {
        await databases.get(DATABASE_ID);
        res.status(200).json({
            status: 'OK',
            database: 'Connected',
            time: new Date().toISOString(),
            env: {
                ai_url: process.env.AI_SERVICE_URL ? 'Set' : 'Missing',
                appwrite_endpoint: process.env.APPWRITE_ENDPOINT ? 'Set' : 'Missing',
                appwrite_project: process.env.APPWRITE_PROJECT_ID ? 'Set' : 'Missing'
            }
        });
    } catch (e: any) {
        res.status(500).json({
            status: 'ERROR',
            database: 'Failed to connect',
            error: e.message,
            hint: 'Check APPWRITE_API_KEY and APPWRITE_PROJECT_ID'
        });
    }
});


// Auth / Profile Routes
app.get('/api/auth/me', authMiddleware, getCurrentUser);
app.patch('/api/profile/update', authMiddleware, updateProfile);

// Admin Routes
app.get('/api/admin/summary', authMiddleware, requireRoles('admin'), getAdminSummary);
app.get('/api/admin/users', authMiddleware, requireRoles('admin'), getAdminUsers);
app.patch('/api/admin/users/:id/role', authMiddleware, requireRoles('admin'), updateAdminUserRole);
app.delete('/api/admin/users/:id', authMiddleware, requireRoles('admin'), deleteAdminUser);

app.get('/api/admin/templates', authMiddleware, requireRoles('admin'), getAdminTemplates);
app.post('/api/admin/templates', authMiddleware, requireRoles('admin'), createAdminTemplate);
app.patch('/api/admin/templates/:id', authMiddleware, requireRoles('admin'), updateAdminTemplate);
app.delete('/api/admin/templates/:id', authMiddleware, requireRoles('admin'), deleteAdminTemplate);

app.get('/api/admin/content', authMiddleware, requireRoles('admin'), getAdminContent);
app.delete('/api/admin/content/:type/:id', authMiddleware, requireRoles('admin'), deleteAdminContent);
app.patch('/api/admin/content/:type/:id/flag', authMiddleware, requireRoles('admin'), toggleAdminContentFlag);

// Lecturer Routes
app.get('/api/lecturer/summary', authMiddleware, requireRoles('lecturer', 'admin'), getLecturerSummary);
app.get('/api/lecturer/course-offerings', authMiddleware, requireRoles('lecturer', 'admin'), getCourseOfferings);
app.post('/api/lecturer/course-offerings', authMiddleware, requireRoles('lecturer', 'admin'), createCourseOffering);
app.post('/api/lecturer/reminders', authMiddleware, requireRoles('lecturer', 'admin'), sendLecturerReminder);
app.get('/api/lecturer/students/:id/history', authMiddleware, requireRoles('lecturer', 'admin'), getLecturerStudentHistory);

// Protected Course Routes
app.post('/api/courses', authMiddleware, upload.single('file'), createCourse);
app.get('/api/courses', authMiddleware, getCourses);
app.delete('/api/courses/:id', authMiddleware, deleteCourse);

// Material Routes
app.post('/api/materials/upload', authMiddleware, upload.single('file'), uploadMaterial);
app.get('/api/materials/:courseId', authMiddleware, getMaterials);
app.delete('/api/materials/:id', authMiddleware, deleteMaterial);
app.get('/api/materials/:id/text', authMiddleware, getMaterialText);
app.post('/api/materials/:id/summarize', authMiddleware, summarizeMaterial);
app.post('/api/materials/:id/chat', authMiddleware, chatWithMaterial);

// Activity Logging Routes
app.post('/api/activity/log', authMiddleware, logActivity);
app.get('/api/activity/stats', authMiddleware, getStats);

// Quiz Routes
app.post('/api/quizzes/generate', authMiddleware, generateQuiz);
app.post('/api/quizzes/evaluate-essay', authMiddleware, evaluateEssay);
app.post('/api/quizzes/evaluate-handwritten', authMiddleware, upload.single('file'), evaluateHandwrittenAnswer);
app.get('/api/quizzes/:materialId', authMiddleware, getQuizzes);
app.patch('/api/quizzes/:id/score', authMiddleware, updateQuizScore);

// OCR Routes
app.post('/api/ocr/evaluate', upload.single('file'), evaluateOcr);

// Feedback Routes
app.post('/api/feedback/explain', authMiddleware, getExplanation);
app.post('/api/feedback/hint', authMiddleware, getHint);

// Notification Routes
app.get('/api/notifications', authMiddleware, getNotifications);
app.patch('/api/notifications/:id/read', authMiddleware, markNotificationRead);
app.get('/api/notifications/smtp-status', getSmtpStatus);
app.post('/api/notifications/test-email', authMiddleware, sendTestEmail);
app.post('/api/notifications/check-inactivity', authMiddleware, checkInactivity);
app.post('/api/notifications/weekly-report', authMiddleware, generateWeeklyReports);
app.post('/api/notifications/daily-summary', authMiddleware, sendDailyStudySummaries);
app.post('/api/notifications/study-reminders', authMiddleware, sendStudySessionReminders);

// Analytics Routes
app.get('/api/analytics/weakness', authMiddleware, getWeaknessAnalysis);
app.get('/api/analytics/weaknesses', authMiddleware, getWeaknessAnalysis);

// Leaderboard Routes
app.get('/api/leaderboard', authMiddleware, getLeaderboard);

// Task Routes
app.get('/api/tasks', authMiddleware, getTasks);
app.post('/api/tasks', authMiddleware, createTask);
app.patch('/api/tasks/:taskId', authMiddleware, updateTaskStatus);
app.delete('/api/tasks/:taskId', authMiddleware, deleteTask);

// Schedule Routes
app.get('/api/schedules', authMiddleware, getSchedules);
app.post('/api/schedules', authMiddleware, createSchedule);
app.delete('/api/schedules/:scheduleId', authMiddleware, deleteSchedule);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
    console.error('GLOBAL SERVER ERROR:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
