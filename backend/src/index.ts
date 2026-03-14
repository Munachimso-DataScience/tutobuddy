import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware } from './middleware/auth';
import { createCourse, getCourses, deleteCourse } from './controllers/courseController';
import { uploadMaterial, getMaterials } from './controllers/materialController';
import { logActivity, getStats } from './controllers/activityController';
import { generateQuiz, getQuizzes } from './controllers/quizController';
import { evaluateEssay } from './controllers/essayController';
import { getExplanation, getHint } from './controllers/feedbackController';
import { checkInactivity, generateWeeklyReports } from './controllers/notificationController';
import { getWeaknessAnalysis } from './controllers/analyticsController';
import { getTasks, createTask, updateTaskStatus, deleteTask } from './controllers/taskController';
import { getSchedules, createSchedule, deleteSchedule } from './controllers/scheduleController';
import { initScheduler } from './utils/scheduler';
import multer from 'multer';

const app = express();
initScheduler();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Study Companion API is running' });
});

// Protected Course Routes
app.post('/api/courses', authMiddleware, upload.single('file'), createCourse);
app.get('/api/courses', authMiddleware, getCourses);
app.delete('/api/courses/:id', authMiddleware, deleteCourse);

// Material Routes
app.post('/api/materials/upload', authMiddleware, upload.single('file'), uploadMaterial);
app.get('/api/materials/:courseId', authMiddleware, getMaterials);

// Activity Logging Routes
app.post('/api/activity/log', authMiddleware, logActivity);
app.get('/api/activity/stats', authMiddleware, getStats);

// Quiz Routes
app.post('/api/quizzes/generate', authMiddleware, generateQuiz);
app.post('/api/quizzes/evaluate-essay', authMiddleware, evaluateEssay);
app.get('/api/quizzes/:materialId', authMiddleware, getQuizzes);

// Feedback Routes
app.post('/api/feedback/explain', authMiddleware, getExplanation);
app.post('/api/feedback/hint', authMiddleware, getHint);

// Notification Routes
app.post('/api/notifications/check-inactivity', authMiddleware, checkInactivity);
app.post('/api/notifications/weekly-report', authMiddleware, generateWeeklyReports);

// Analytics Routes
app.get('/api/analytics/weakness', authMiddleware, getWeaknessAnalysis);
app.get('/api/analytics/weaknesses', authMiddleware, getWeaknessAnalysis);

// Task Routes
app.get('/api/tasks', authMiddleware, getTasks);
app.post('/api/tasks', authMiddleware, createTask);
app.patch('/api/tasks/:taskId', authMiddleware, updateTaskStatus);
app.delete('/api/tasks/:taskId', authMiddleware, deleteTask);

// Schedule Routes
app.get('/api/schedules', authMiddleware, getSchedules);
app.post('/api/schedules', authMiddleware, createSchedule);
app.delete('/api/schedules/:scheduleId', authMiddleware, deleteSchedule);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
