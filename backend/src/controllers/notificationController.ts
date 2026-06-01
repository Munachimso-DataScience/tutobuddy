import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { users, databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { saveStudySnapshot } from '../lib/studySnapshots';

// Validate email configuration
const validateEmailConfig = () => {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');
    const placeholderValues = ['your_mailtrap_user', 'your_mailtrap_pass', 'your_email@example.com'];
    const invalid = required.filter(key => {
        const value = process.env[key]?.trim().toLowerCase();
        return value ? placeholderValues.includes(value) : false;
    });

    if (missing.length > 0 || invalid.length > 0) {
        const problems = [];
        if (missing.length > 0) problems.push(`Missing: ${missing.join(', ')}`);
        if (invalid.length > 0) problems.push(`Invalid placeholder values: ${invalid.join(', ')}`);

        console.warn(`⚠️  Email configuration invalid. ${problems.join(' | ')}`);
        console.warn('Notifications will not be sent. Configure SMTP settings in .env with real credentials.');
        return false;
    }

    if (!process.env.SMTP_FROM_EMAIL && !process.env.EMAIL_FROM) {
        console.warn('SMTP_FROM_EMAIL is not set. Brevo works best with a verified sender email. Falling back to SMTP_USER as the sender.');
    }

    return true;
};

const isEmailConfigured = validateEmailConfig();

const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
const smtpFromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER || '';
const smtpFromName = process.env.SMTP_FROM_NAME || 'Tutor_Buddy';
const smtpFromAddress = `"${smtpFromName}" <${smtpFromEmail}>`;

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
    }
});

const smtpStatus = {
    configured: isEmailConfigured,
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
    port: smtpPort,
    fromEmail: smtpFromEmail,
    fromName: smtpFromName
};

const getAppBaseUrl = () => {
    const url = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    return url.replace(/\/+$/, '');
};

const buildNotificationLinks = () => {
    const baseUrl = getAppBaseUrl();
    return {
        dashboard: `${baseUrl}/dashboard`,
        reports: `${baseUrl}/dashboard/reports`,
        courses: `${baseUrl}/dashboard/courses`,
        settings: `${baseUrl}/dashboard/settings`
    };
};

const buildEmailCTA = (primaryLabel: string, primaryUrl: string, secondaryLabel: string, secondaryUrl: string) => `
    <div style="margin-top:24px;padding:20px;border-radius:16px;background:#f8faf7;border:1px solid #d7e4d0;">
        <p style="margin:0 0 12px;font-weight:700;color:#0b4d2e;">Open TutorBuddy</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <a href="${primaryUrl}" style="display:inline-block;padding:12px 18px;background:#0b4d2e;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">${primaryLabel}</a>
            <a href="${secondaryUrl}" style="display:inline-block;padding:12px 18px;background:#f15a24;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">${secondaryLabel}</a>
        </div>
    </div>
`;

const notificationTemplates = {
    inactivity: {
        title: "We haven't seen you in 48 hours",
        message: 'Jump back into your courses and keep your study momentum going.',
        link: '/dashboard/courses',
        type: 'reminder',
        source: 'activity'
    },
    weeklyReport: {
        title: 'Your weekly progress report is ready',
        message: 'Open your latest report to see study activity and readiness trends.',
        link: '/dashboard/reports',
        type: 'report',
        source: 'weekly_report'
    },
    testEmail: {
        title: 'SMTP test successful',
        message: 'Your Brevo SMTP integration is working correctly.',
        link: '/dashboard/settings',
        type: 'system',
        source: 'smtp_test'
    }
} as const;

type NotificationPayload = {
    userId: string;
    title: string;
    message: string;
    link?: string;
    type?: string;
    source?: string;
};

const createInAppNotification = async ({
    userId,
    title,
    message,
    link = '/dashboard',
    type = 'system',
    source = 'app'
}: NotificationPayload) => {
    try {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
            user_id: userId,
            title,
            message,
            link,
            type,
            source,
            is_read: false,
            created_at: new Date().toISOString()
        });
    } catch (error: any) {
        console.warn(`Failed to create in-app notification for ${userId}:`, error.message);
    }
};

type StudySummary = {
    totalMinutes: number;
    contentCovered: string[];
    studySessions: number;
    summaryText: string;
};

const parseActivityDetails = (details: unknown) => {
    if (typeof details === 'string') {
        try {
            return JSON.parse(details);
        } catch {
            return {};
        }
    }

    if (details && typeof details === 'object') {
        return details as Record<string, any>;
    }

    return {};
};

const normalizeLabel = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
};

const getStudySummaryForUser = async (userId: string, days = 7): Promise<StudySummary> => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const logs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ACTIVITY,
        [
            Query.equal('user_id', userId),
            Query.greaterThan('timestamp', since),
            Query.limit(200)
        ]
    );

    const contentSet = new Set<string>();
    let totalMinutes = 0;
    let studySessions = 0;

    for (const log of logs.documents) {
        if (log.type !== 'study_session') continue;
        studySessions += 1;
        const details = parseActivityDetails(log.details);
        const duration = Math.max(0, Number(details.duration) || 0);
        totalMinutes += duration;

        const label = normalizeLabel(details.contentTitle || details.courseTitle || details.topic || details.courseId || details.course_id);
        if (label) {
            contentSet.add(label);
        }
    }

    return {
        totalMinutes,
        contentCovered: Array.from(contentSet).slice(0, 12),
        studySessions,
        summaryText: totalMinutes > 0
            ? `You studied for ${totalMinutes} minute${totalMinutes === 1 ? '' : 's'} across ${studySessions} session${studySessions === 1 ? '' : 's'}.`
            : 'No study sessions were recorded in this period.'
    };
};

const getWeaknessDigest = async (userId: string, days = 7) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const logs = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ACTIVITY,
        [
            Query.equal('user_id', userId),
            Query.greaterThan('timestamp', since),
            Query.limit(200)
        ]
    );

    const incorrectData = logs.documents
        .filter(doc => doc.type === 'quiz_incorrect')
        .map(doc => {
            const details = parseActivityDetails(doc.details);
            const question = normalizeLabel(
                details.question_text ||
                details.question ||
                details.prompt ||
                details.questionTitle ||
                details.question_text_content
            );
            const correctAnswer = normalizeLabel(
                details.correct_answer ||
                details.correctAnswer ||
                details.answer ||
                details.expected_answer
            );

            if (!question && !correctAnswer) return null;
            return {
                question: question || 'Study concept',
                correct_answer: correctAnswer || 'Review this concept'
            };
        })
        .filter((item): item is { question: string; correct_answer: string } => item !== null);

    if (incorrectData.length === 0) {
        return {
            weaknesses: [],
            recommendations: ['Keep practicing to reveal stronger weakness patterns.']
        };
    }

    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${aiUrl.startsWith('http') ? aiUrl : `http://${aiUrl}`}/analyze-weakness`, {
            incorrect_data: incorrectData
        }, { timeout: 120000 });
        return response.data;
    } catch (error: any) {
        console.warn(`Weakness digest generation failed for ${userId}:`, error.message);
        const topWeaknesses = incorrectData.slice(0, 3).map(item => item.correct_answer);
        return {
            weaknesses: topWeaknesses,
            recommendations: topWeaknesses.length > 0
                ? [`Review ${topWeaknesses.join(', ')} in the source material.`]
                : ['Review your recent quiz mistakes.']
        };
    }
};

const updateStudyProfileSnapshot = async (userId: string, summary: StudySummary, weaknesses: string[]) => {
    try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, {
            recent_content_covered: summary.contentCovered.join(', '),
            last_study_session_at: new Date().toISOString()
        });
        await saveStudySnapshot({
            userId,
            summaryText: summary.summaryText,
            recentContentCovered: summary.contentCovered.join(', '),
            weeklyWeaknesses: weaknesses.join(', '),
            totalMinutes: summary.totalMinutes,
            studySessions: summary.studySessions
        });
    } catch (error: any) {
        console.warn(`Failed to update study snapshot for ${userId}:`, error.message);
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.$id;
        const [notifications, unread] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
                Query.equal('user_id', userId),
                Query.orderDesc('created_at'),
                Query.limit(12)
            ]),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
                Query.equal('user_id', userId),
                Query.equal('is_read', false),
                Query.limit(50)
            ])
        ]);

        return res.status(200).json({
            notifications: notifications.documents,
            unreadCount: unread.total
        });
    } catch (error: any) {
        console.error('Get notifications error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.$id;

        const notification = await databases.getDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id);
        if (notification.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id, {
            is_read: true
        });

        return res.status(200).json({ message: 'Notification marked as read.' });
    } catch (error: any) {
        console.error('Mark notification read error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getSmtpStatus = async (_req: Request, res: Response) => {
    return res.status(200).json({
        ...smtpStatus,
        configured: isEmailConfigured,
        ready: isEmailConfigured && Boolean(smtpFromEmail)
    });
};

export const sendTestEmail = async (req: Request, res: Response) => {
    try {
        if (!isEmailConfigured) {
            return res.status(503).json({
                error: 'SMTP is not configured yet.',
                configured: false
            });
        }

        const user = (req as any).user;
        const recipient = user?.email;
        const links = buildNotificationLinks();

        if (!recipient) {
            return res.status(400).json({
                error: 'Unable to determine recipient email address.'
            });
        }

        await transporter.sendMail({
            from: smtpFromAddress,
            to: recipient,
            subject: 'TutorBuddy Brevo SMTP Test',
            text: `Hello ${user?.name || 'Student'}, your Brevo SMTP setup is working correctly.`,
            html: `
                <h2>Brevo SMTP Test Successful</h2>
                <p>Hello ${user?.name || 'Student'},</p>
                <p>Your TutorBuddy SMTP integration is working correctly with Brevo.</p>
                <p>If you received this email, your sender, key, and SMTP settings are valid.</p>
                ${buildEmailCTA('Open Dashboard', links.dashboard, 'Open Settings', links.settings)}
            `
        });

        await createInAppNotification({
            userId: user.$id,
            title: notificationTemplates.testEmail.title,
            message: notificationTemplates.testEmail.message,
            link: notificationTemplates.testEmail.link,
            type: notificationTemplates.testEmail.type,
            source: notificationTemplates.testEmail.source
        });

        return res.status(200).json({
            message: 'Test email sent successfully.',
            configured: true,
            recipient
        });
    } catch (error: any) {
        console.error('Test email error:', error.message);
        return res.status(500).json({
            error: 'Failed to send test email.',
            details: error.message
        });
    }
};

export const checkInactivity = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const inactiveUsers: any[] = [];
        for (const user of response.users) {
            try {
                const recentActivity = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.ACTIVITY,
                    [
                        Query.equal('user_id', user.$id),
                        Query.greaterThan('timestamp', fortyEightHoursAgo),
                        Query.limit(1)
                    ]
                );

                if (recentActivity.total === 0) {
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                    const recentNudges = await databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.NOTIFICATIONS,
                        [
                            Query.equal('user_id', user.$id),
                            Query.equal('source', 'activity'),
                            Query.greaterThan('created_at', sevenDaysAgo),
                            Query.limit(1)
                        ]
                    );

                    if (recentNudges.total === 0) {
                        inactiveUsers.push(user);
                    }
                }
            } catch (activityError: any) {
                console.warn(`Could not inspect recent activity for ${user.email}:`, activityError.message);
            }
        }

        console.log(`Found ${inactiveUsers.length} inactive users for notification`);
        const links = buildNotificationLinks();

        let successCount = 0;
        let failCount = 0;
        let notificationCount = 0;

        for (const user of inactiveUsers) {
            try {
                await createInAppNotification({
                    userId: user.$id,
                    title: notificationTemplates.inactivity.title,
                    message: notificationTemplates.inactivity.message,
                    link: '/dashboard/courses',
                    type: notificationTemplates.inactivity.type,
                    source: notificationTemplates.inactivity.source
                });
                notificationCount++;

                if (!isEmailConfigured) {
                    console.log(`In-app inactivity notification created for ${user.email}; email skipped.`);
                    continue;
                }

                await transporter.sendMail({
                    from: smtpFromAddress,
                    to: user.email,
                    subject: "Don't break your streak! 📚",
                    text: `Hi ${user.name}, we haven't seen you in 48 hours. Keep up the momentum on your courses!`,
                    html: `<b>Hi ${user.name},</b><p>We haven't seen you in 48 hours. Keep up the momentum on your courses!</p>${buildEmailCTA('Continue Studying', links.courses, 'View Dashboard', links.dashboard)}`
                });
                successCount++;
                console.log(`✓ Sent inactivity notification to ${user.email}`);
            } catch (emailError: any) {
                failCount++;
                console.error(`✗ Failed to send to ${user.email}:`, emailError.message);
            }
        }

        if (res) {
            res.status(200).json({
                message: isEmailConfigured
                    ? `Reminders sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`
                    : 'In-app inactivity reminders created, but email delivery is disabled.',
                successCount,
                failCount,
                inactiveUsers: inactiveUsers.length,
                notificationsCreated: notificationCount
            });
        }
    } catch (error: any) {
        console.error('Inactivity check error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};

export const generateWeeklyReports = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        console.log(`Generating weekly reports for ${response.total} users`);
        const links = buildNotificationLinks();

        let successCount = 0;
        let failCount = 0;
        let notificationCount = 0;

        for (const user of response.users) {
            try {
                const activity = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.ACTIVITY,
                    [
                        Query.equal('user_id', user.$id),
                        Query.greaterThan('timestamp', oneWeekAgo)
                    ]
                );

                const quizzes = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.QUIZZES,
                    [
                        Query.equal('user_id', user.$id),
                        Query.greaterThan('date_taken', oneWeekAgo)
                    ]
                ).catch(() => ({ documents: [], total: 0 }));

                const studySummary = await getStudySummaryForUser(user.$id, 7);
                const weaknessDigest = await getWeaknessDigest(user.$id, 7);
                const weaknesses = Array.isArray((weaknessDigest as any)?.weaknesses) ? (weaknessDigest as any).weaknesses : [];
                const recommendations = Array.isArray((weaknessDigest as any)?.recommendations) ? (weaknessDigest as any).recommendations : [];
                const avgScore = quizzes.total > 0
                    ? Math.round(quizzes.documents.reduce((acc: number, quiz: any) => acc + (Number(quiz.score) || 0), 0) / quizzes.total)
                    : 0;

                await updateStudyProfileSnapshot(user.$id, studySummary, weaknesses);

                const weaknessText = weaknesses.length > 0 ? ` Weak areas to review: ${weaknesses.join(', ')}.` : '';
                const recommendationText = recommendations.length > 0 ? ` ${recommendations[0]}` : '';
                const summaryMessage = `${studySummary.summaryText}${weaknessText}`.trim();

                await createInAppNotification({
                    userId: user.$id,
                    title: notificationTemplates.weeklyReport.title,
                    message: `${summaryMessage}${recommendationText}`,
                    link: '/dashboard/reports',
                    type: notificationTemplates.weeklyReport.type,
                    source: notificationTemplates.weeklyReport.source
                });
                notificationCount++;

                if (!isEmailConfigured) {
                    console.log(`In-app weekly report created for ${user.email}; email skipped.`);
                    continue;
                }

                const weaknessSection = weaknesses.length > 0
                    ? `<p><b>Weaknesses:</b> ${weaknesses.join(', ')}</p><p><b>Next step:</b> ${recommendations[0] || 'Keep reviewing the flagged concepts.'}</p>`
                    : '<p>You have not built enough error data yet for a weakness breakdown. Keep taking quizzes.</p>';

                await transporter.sendMail({
                    from: smtpFromAddress,
                    to: user.email,
                    subject: 'Your Weekly Progress Report',
                    html: `
                        <h2>Weekly Summary for ${user.name}</h2>
                        <p>${studySummary.summaryText}</p>
                        <ul>
                            <li><b>Activities Logged:</b> ${activity.total}</li>
                            <li><b>Study Sessions:</b> ${studySummary.studySessions}</li>
                            <li><b>Study Minutes:</b> ${studySummary.totalMinutes}</li>
                            <li><b>Quiz Average:</b> ${avgScore}%</li>
                            <li><b>Content Covered:</b> ${studySummary.contentCovered.length > 0 ? studySummary.contentCovered.join(', ') : 'No titled content captured yet'}</li>
                        </ul>
                        ${weaknessSection}
                        <p>Keep pushing towards your goals!</p>
                        ${buildEmailCTA('View Weekly Report', links.reports, 'Open Courses', links.courses)}
                    `
                });
                successCount++;
                console.log(`? Sent weekly report to ${user.email}`);
            } catch (emailError: any) {
                failCount++;
                console.error(`? Failed to send report to ${user.email}:`, emailError.message);
            }
        }

        if (res) {
            res.status(200).json({
                message: isEmailConfigured
                    ? `Weekly reports sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`
                    : 'In-app weekly reports created, but email delivery is disabled.',
                successCount,
                failCount,
                notificationsCreated: notificationCount
            });
        }
    } catch (error: any) {
        console.error('Weekly report generation error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};

export const sendDailyStudySummaries = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const links = buildNotificationLinks();
        let successCount = 0;
        let failCount = 0;
        let notificationCount = 0;

        for (const user of response.users) {
            try {
                const studySummary = await getStudySummaryForUser(user.$id, 1);
                if (studySummary.totalMinutes <= 0 && studySummary.studySessions === 0) {
                    continue;
                }

                const weaknessDigest = await getWeaknessDigest(user.$id, 1);
                const weaknesses = Array.isArray((weaknessDigest as any)?.weaknesses) ? (weaknessDigest as any).weaknesses : [];
                const recommendations = Array.isArray((weaknessDigest as any)?.recommendations) ? (weaknessDigest as any).recommendations : [];

                await updateStudyProfileSnapshot(user.$id, studySummary, weaknesses);

                await createInAppNotification({
                    userId: user.$id,
                    title: 'Your daily study summary is ready',
                    message: `${studySummary.summaryText}${weaknesses.length > 0 ? ` Weak areas: ${weaknesses.join(', ')}.` : ''}`,
                    link: '/dashboard/reports',
                    type: 'summary',
                    source: 'daily_summary'
                });
                notificationCount++;

                if (!isEmailConfigured) {
                    console.log(`In-app daily summary created for ${user.email}; email skipped.`);
                    continue;
                }

                await transporter.sendMail({
                    from: smtpFromAddress,
                    to: user.email,
                    subject: 'Your Daily Study Summary',
                    html: `
                        <h2>Daily Study Summary</h2>
                        <p>Hello ${user.name},</p>
                        <p>${studySummary.summaryText}</p>
                        <ul>
                            <li><b>Study Minutes:</b> ${studySummary.totalMinutes}</li>
                            <li><b>Study Sessions:</b> ${studySummary.studySessions}</li>
                            <li><b>Content Covered:</b> ${studySummary.contentCovered.length > 0 ? studySummary.contentCovered.join(', ') : 'No labeled content captured yet'}</li>
                        </ul>
                        ${weaknesses.length > 0 ? `<p><b>Quick Weakness Note:</b> ${weaknesses.join(', ')}</p><p>${recommendations[0] || 'Keep reviewing your mistakes.'}</p>` : ''}
                        ${buildEmailCTA('Open Reports', links.reports, 'Open Dashboard', links.dashboard)}
                    `
                });
                successCount++;
            } catch (error: any) {
                failCount++;
                console.error(`Daily summary error for ${user.email}:`, error.message);
            }
        }

        if (res) {
            res.status(200).json({
                message: isEmailConfigured
                    ? `Daily study summaries sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`
                    : 'In-app daily study summaries created, but email delivery is disabled.',
                successCount,
                failCount,
                notificationsCreated: notificationCount
            });
        }
    } catch (error: any) {
        console.error('Daily summary generation error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};

export const sendStudySessionReminders = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const links = buildNotificationLinks();
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const reminderCutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);

        let successCount = 0;
        let failCount = 0;
        let notificationCount = 0;

        for (const user of response.users) {
            try {
                const [pendingTasksRes, schedulesRes] = await Promise.all([
                    databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.TASKS,
                        [
                            Query.equal('user_id', user.$id),
                            Query.equal('status', 'pending'),
                            Query.limit(100)
                        ]
                    ),
                    databases.listDocuments(
                        DATABASE_ID,
                        COLLECTIONS.SCHEDULES,
                        [
                            Query.equal('user_id', user.$id),
                            Query.equal('day', today),
                            Query.limit(100)
                        ]
                    )
                ]);

                const upcomingTasks = pendingTasksRes.documents.filter(task => {
                    if (!task.due_date) return false;
                    const due = new Date(task.due_date);
                    return !Number.isNaN(due.getTime()) && due <= reminderCutoff;
                });

                if (upcomingTasks.length === 0 && schedulesRes.documents.length === 0) {
                    continue;
                }

                const taskTitles = upcomingTasks.slice(0, 5).map(task => task.title).filter(Boolean);
                const scheduleTexts = schedulesRes.documents.slice(0, 5).map(schedule => {
                    const start = schedule.start_time ? ` at ${schedule.start_time}` : '';
                    return `${schedule.title}${start}`;
                }).filter(Boolean);

                const messageParts = [
                    taskTitles.length > 0 ? `Tasks due soon: ${taskTitles.join(', ')}.` : '',
                    scheduleTexts.length > 0 ? `Study sessions today: ${scheduleTexts.join(', ')}.` : ''
                ].filter(Boolean);

                await createInAppNotification({
                    userId: user.$id,
                    title: 'Study reminders for today',
                    message: messageParts.join(' '),
                    link: upcomingTasks.length > 0 ? '/dashboard' : '/dashboard/courses',
                    type: 'reminder',
                    source: 'task_schedule'
                });
                notificationCount++;

                if (!isEmailConfigured) {
                    console.log(`In-app study reminder created for ${user.email}; email skipped.`);
                    continue;
                }

                const htmlSections = [
                    taskTitles.length > 0 ? `<p><b>Tasks due soon:</b> ${taskTitles.join(', ')}</p>` : '',
                    scheduleTexts.length > 0 ? `<p><b>Study sessions today:</b> ${scheduleTexts.join(', ')}</p>` : ''
                ].filter(Boolean).join('');

                await transporter.sendMail({
                    from: smtpFromAddress,
                    to: user.email,
                    subject: 'TutorBuddy Study Reminder',
                    html: `
                        <h2>Study Reminder</h2>
                        <p>Hello ${user.name},</p>
                        <p>You have study items to review today.</p>
                        ${htmlSections}
                        ${buildEmailCTA('Open Tasks', links.dashboard, 'Open Courses', links.courses)}
                    `
                });
                successCount++;
            } catch (error: any) {
                failCount++;
                console.error(`Study reminder error for ${user.email}:`, error.message);
            }
        }

        if (res) {
            res.status(200).json({
                message: isEmailConfigured
                    ? `Study reminders sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`
                    : 'In-app study reminders created, but email delivery is disabled.',
                successCount,
                failCount,
                notificationsCreated: notificationCount
            });
        }
    } catch (error: any) {
        console.error('Study reminder generation error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};

