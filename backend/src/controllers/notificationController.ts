import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { users, databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';

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
                    inactiveUsers.push(user);
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
                    link: links.courses,
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

                const activitiesCount = activity.total;

                await createInAppNotification({
                    userId: user.$id,
                    title: notificationTemplates.weeklyReport.title,
                    message: `${notificationTemplates.weeklyReport.message} You completed ${activitiesCount} activity${activitiesCount === 1 ? '' : 'ies'} this week.`,
                    link: links.reports,
                    type: notificationTemplates.weeklyReport.type,
                    source: notificationTemplates.weeklyReport.source
                });
                notificationCount++;

                if (!isEmailConfigured) {
                    console.log(`In-app weekly report created for ${user.email}; email skipped.`);
                    continue;
                }

                await transporter.sendMail({
                    from: smtpFromAddress,
                    to: user.email,
                    subject: "Your Weekly Progress Report 📈",
                    html: `
                        <h2>Weekly Summary for ${user.name}</h2>
                        <p>Great job staying focused this week!</p>
                        <ul>
                            <li><b>Activities Logged:</b> ${activitiesCount}</li>
                            <li><b>New Materials Studied:</b> ${Math.floor(activitiesCount / 3)}</li>
                        </ul>
                        <p>Keep pushing towards your goals!</p>
                        ${buildEmailCTA('View Weekly Report', links.reports, 'Open Courses', links.courses)}
                    `
                });
                successCount++;
                console.log(`✓ Sent weekly report to ${user.email}`);
            } catch (emailError: any) {
                failCount++;
                console.error(`✗ Failed to send report to ${user.email}:`, emailError.message);
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
