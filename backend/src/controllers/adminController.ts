import { Request, Response } from 'express';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { Query } from 'node-appwrite';
import axios from 'axios';
import { getSchedulerStatus } from '../utils/scheduler';
import { users } from '../lib/appwrite-admin';
import { ID } from 'node-appwrite';

export const getAdminSummary = async (req: Request, res: Response) => {
    try {
        // We'll gather various statistics for the admin dashboard
        const [userStats, systemMetrics, contentStats, templateStats] = await Promise.all([
            getUserStats(),
            getSystemMetrics(),
            getContentStats(),
            getTemplateStats()
        ]);
        const healthStats = await getHealthStats();

        return res.status(200).json({
            user: userStats,
            system: systemMetrics,
            content: contentStats,
            templates: templateStats,
            health: healthStats
        });
    } catch (error: any) {
        console.error('Admin summary error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

const PAGE_SIZE = 100;

type AppwriteDoc = Record<string, any>;

async function listAllDocuments(collectionId: string, queries: string[] = []) {
    const documents: AppwriteDoc[] = [];
    let offset = 0;
    let total = 0;

    while (true) {
        const response = await databases.listDocuments(DATABASE_ID, collectionId, [
            ...queries,
            Query.limit(PAGE_SIZE),
            Query.offset(offset)
        ]);

        total = response.total;
        documents.push(...response.documents);

        if (response.documents.length < PAGE_SIZE || documents.length >= total) {
            break;
        }

        offset += PAGE_SIZE;

        // Guard against pathological loops if the total keeps changing under us.
        if (offset > 5000) {
            break;
        }
    }

    return { documents, total };
}

function toDateKey(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().slice(0, 10);
}

function buildEmptyActivitySeries(days = 7) {
    const series: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        series[toDateKey(date)] = 0;
    }
    return series;
}

// Helper functions to get various stats
async function getUserStats() {
    try {
        const usersResponse = await listAllDocuments(COLLECTIONS.USERS);
        const users = usersResponse.documents;
        const totalUsers = usersResponse.total;

        // For active users, we can define as those who have been active in the last 30 days.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = users.filter((user) => {
            const lastActive = user.last_active ? new Date(user.last_active) : null;
            return lastActive && lastActive >= thirtyDaysAgo;
        }).length;

        const roleBreakdown = users.reduce(
            (acc, user) => {
                const role = typeof user.role === 'string' ? user.role : 'student';
                if (role === 'lecturer') {
                    acc.lecturer += 1;
                } else if (role === 'admin') {
                    acc.admin += 1;
                } else {
                    acc.student += 1;
                }
                return acc;
            },
            { student: 0, lecturer: 0, admin: 0 }
        );

        const streakDistribution = users.reduce(
            (acc, user) => {
                const streak = Number(user.current_streak) || 0;
                if (streak === 0) {
                    acc['0'] += 1;
                } else if (streak <= 3) {
                    acc['1-3'] += 1;
                } else if (streak <= 7) {
                    acc['4-7'] += 1;
                } else if (streak <= 14) {
                    acc['8-14'] += 1;
                } else {
                    acc['15+'] += 1;
                }
                return acc;
            },
            { '0': 0, '1-3': 0, '4-7': 0, '8-14': 0, '15+': 0 }
        );

        const averageStreak = users.length
            ? Math.round(users.reduce((sum, user) => sum + (Number(user.current_streak) || 0), 0) / users.length)
            : 0;

        const quizzesResponse = await listAllDocuments(COLLECTIONS.QUIZZES);
        const quizzes = quizzesResponse.documents;
        const completedQuizzes = quizzes.filter((quiz) => Number(quiz.score) > 0 || quiz.completed_at);
        const quizCompletionRate = quizzes.length
            ? Math.round((completedQuizzes.length / quizzes.length) * 100)
            : 0;
        const averageQuizScore = completedQuizzes.length
            ? Math.round(
                completedQuizzes.reduce((sum, quiz) => sum + (Number(quiz.score) || 0), 0) /
                completedQuizzes.length
            )
            : 0;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const activityResponse = await listAllDocuments(COLLECTIONS.ACTIVITY, [
            Query.greaterThan('timestamp', sevenDaysAgo.toISOString())
        ]);
        const activityLogs = activityResponse.documents;
        const dailyActivity = buildEmptyActivitySeries(7);
        const activityTypeCounts = {
            study_sessions_7d: 0,
            quiz_events_7d: 0,
            login_events_7d: 0
        };

        for (const log of activityLogs) {
            const key = log.timestamp ? toDateKey(log.timestamp) : '';
            if (key && dailyActivity[key] !== undefined) {
                dailyActivity[key] += 1;
            }

            if (log.type === 'study_session') {
                activityTypeCounts.study_sessions_7d += 1;
            }
            if (log.type === 'quiz_correct' || log.type === 'quiz_incorrect' || log.type === 'quiz_complete') {
                activityTypeCounts.quiz_events_7d += 1;
            }
            if (log.type === 'login') {
                activityTypeCounts.login_events_7d += 1;
            }
        }

        return {
            total_users: totalUsers,
            active_users: activeUsers,
            active_rate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
            role_breakdown: roleBreakdown,
            average_streak: averageStreak,
            streak_distribution: streakDistribution,
            quiz_completion_rate: quizCompletionRate,
            average_quiz_score: averageQuizScore,
            daily_weekly_activity: {
                days: dailyActivity,
                ...activityTypeCounts
            }
        };
    } catch (error) {
        console.error('Error getting user stats:', error);
        return {
            total_users: 0,
            active_users: 0,
            active_rate: 0,
            role_breakdown: { student: 0, lecturer: 0, admin: 0 },
            average_streak: 0,
            streak_distribution: { '0': 0, '1-3': 0, '4-7': 0, '8-14': 0, '15+': 0 },
            quiz_completion_rate: 0,
            average_quiz_score: 0,
            daily_weekly_activity: {
                days: buildEmptyActivitySeries(7),
                study_sessions_7d: 0,
                quiz_events_7d: 0,
                login_events_7d: 0
            }
        };
    }
}

async function getSystemMetrics() {
    try {
        // Get the latest system metrics entry
        const metrics = await databases.listDocuments(DATABASE_ID, COLLECTIONS.SYSTEM_METRICS, [
            Query.orderDesc('$createdAt'),
            Query.limit(1)
        ]);

        const latest = metrics.documents[0] || {};

        return {
            total_ai_requests: latest.total_ai_requests || 0,
            quiz_generation_success_rate: latest.quiz_generation_success_rate || 0,
            notification_sends: latest.notification_sends || 0,
            daily_active_users: latest.daily_active_users || 0,
            avg_response_time: latest.avg_response_time || 0,
            source: metrics.total > 0 ? 'system_metrics' : 'derived_default'
        };
    } catch (error) {
        console.error('Error getting system metrics:', error);
        return {
            total_ai_requests: 0,
            quiz_generation_success_rate: 0,
            notification_sends: 0,
            daily_active_users: 0,
            avg_response_time: 0,
            source: 'derived_default'
        };
    }
}

async function getContentStats() {
    try {
        const [courses, materials, quizzes] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.MATERIALS),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZZES)
        ]);

        return {
            total_courses: courses.total,
            total_materials: materials.total,
            total_quizzes: quizzes.total,
            // Placeholder for flagged/bad materials, duplicate content, etc.
            flagged_materials: 0,
            duplicate_content: 0
        };
    } catch (error) {
        console.error('Error getting content stats:', error);
        return {
            total_courses: 0,
            total_materials: 0,
            total_quizzes: 0,
            flagged_materials: 0,
            duplicate_content: 0
        };
    }
}

async function getTemplateStats() {
    try {
        const templates = await listAllDocuments(COLLECTIONS.QUESTION_TEMPLATES);
        const activeTemplates = templates.documents.filter((t: AppwriteDoc) => t.is_active).length;

        return {
            total_templates: templates.total,
            active_templates: activeTemplates,
            inactive_templates: templates.total - activeTemplates
        };
    } catch (error) {
        console.error('Error getting template stats:', error);
        return {
            total_templates: 0,
            active_templates: 0,
            inactive_templates: 0
        };
    }
}

async function getHealthStats() {
    const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587', 10);
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER || '';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || smtpUser || '';
    const smtpFromName = process.env.SMTP_FROM_NAME || 'Tutor_Buddy';

    const smtpConfigured = Boolean(smtpHost && smtpUser && (process.env.SMTP_PASS || process.env.EMAIL_PASS));

    const aiEndpoint = (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const appwriteConfigured = Boolean(process.env.APPWRITE_ENDPOINT && process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY);

    let aiReachable = false;
    try {
        await axios.get(`${aiEndpoint}/health`, { timeout: 4000 });
        aiReachable = true;
    } catch {
        aiReachable = false;
    }

    return {
        ai: {
            configured: Boolean(process.env.AI_SERVICE_URL),
            endpoint: aiEndpoint,
            reachable: aiReachable
        },
        smtp: {
            configured: smtpConfigured,
            ready: smtpConfigured && Boolean(smtpFromEmail),
            host: smtpHost,
            port: smtpPort,
            from_email: smtpFromEmail,
            from_name: smtpFromName
        },
        scheduler: {
            ...getSchedulerStatus()
        },
        appwrite: {
            configured: appwriteConfigured,
            endpoint: process.env.APPWRITE_ENDPOINT || '',
            project_id: process.env.APPWRITE_PROJECT_ID || ''
        }
    };
}

// User Management
export const getAdminUsers = async (req: Request, res: Response) => {
    try {
        const usersResponse = await listAllDocuments(COLLECTIONS.USERS);
        return res.status(200).json({ users: usersResponse.documents });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateAdminUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!['student', 'lecturer', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, id, { role });
        // Optionally update Appwrite user labels/prefs if needed
        return res.status(200).json({ message: 'Role updated' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteAdminUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, id);
        try {
            await users.delete(id);
        } catch (e) {
            console.warn('Auth user delete failed:', e);
        }
        return res.status(200).json({ message: 'User deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// Templates Management
export const getAdminTemplates = async (req: Request, res: Response) => {
    try {
        const templates = await listAllDocuments(COLLECTIONS.QUESTION_TEMPLATES);
        return res.status(200).json({ templates: templates.documents });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const createAdminTemplate = async (req: Request, res: Response) => {
    try {
        const { name, prompt_text, is_active } = req.body;
        const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.QUESTION_TEMPLATES, ID.unique(), {
            name, prompt_text, is_active: is_active ?? true
        });
        return res.status(201).json(doc);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const updateAdminTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.QUESTION_TEMPLATES, id, updates);
        return res.status(200).json(doc);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteAdminTemplate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.QUESTION_TEMPLATES, id);
        return res.status(200).json({ message: 'Template deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

// Content Management
export const getAdminContent = async (req: Request, res: Response) => {
    try {
        const [courses, materials] = await Promise.all([
            listAllDocuments(COLLECTIONS.COURSES),
            listAllDocuments(COLLECTIONS.MATERIALS)
        ]);
        return res.status(200).json({ courses: courses.documents, materials: materials.documents });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const deleteAdminContent = async (req: Request, res: Response) => {
    try {
        const { type, id } = req.params; // type = 'course' or 'material'
        if (type === 'course') {
            await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COURSES, id);
        } else if (type === 'material') {
            await databases.deleteDocument(DATABASE_ID, COLLECTIONS.MATERIALS, id);
        } else {
            return res.status(400).json({ error: 'Invalid content type' });
        }
        return res.status(200).json({ message: 'Content deleted' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

