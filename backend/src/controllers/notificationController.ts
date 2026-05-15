import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { users, databases } from '../lib/appwrite-admin';
import { Query } from 'node-appwrite';
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

    return true;
};

const isEmailConfigured = validateEmailConfig();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
    }
});

export const checkInactivity = async (req: Request, res: Response) => {
    try {
        if (!isEmailConfigured) {
            const message = 'Email service not configured. Skipping inactivity notifications.';
            console.log(message);
            if (res) return res.status(503).json({ warning: message });
            return;
        }

        const response = await users.list();
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const inactiveUsers = response.users.filter(user => {
            const lastActive = user.registration ? new Date(user.registration) : null;
            return lastActive && lastActive < fortyEightHoursAgo;
        });

        console.log(`Found ${inactiveUsers.length} inactive users for notification`);

        let successCount = 0;
        let failCount = 0;

        for (const user of inactiveUsers) {
            try {
                await transporter.sendMail({
                    from: '"Study Companion" <no-reply@studybuddy.ai>',
                    to: user.email,
                    subject: "Don't break your streak! 📚",
                    text: `Hi ${user.name}, we haven't seen you in 48 hours. Keep up the momentum on your courses!`,
                    html: `<b>Hi ${user.name},</b><p>We haven't seen you in 48 hours. Keep up the momentum on your courses!</p>`
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
                message: `Reminders sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`,
                successCount,
                failCount
            });
        }
    } catch (error: any) {
        console.error('Inactivity check error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};

export const generateWeeklyReports = async (req: Request, res: Response) => {
    try {
        if (!isEmailConfigured) {
            const message = 'Email service not configured. Skipping weekly reports.';
            console.log(message);
            if (res) return res.status(503).json({ warning: message });
            return;
        }

        const response = await users.list();
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        console.log(`Generating weekly reports for ${response.total} users`);

        let successCount = 0;
        let failCount = 0;

        for (const user of response.users) {
            try {
                // Aggregate activity for the week
                const activity = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTIONS.ACTIVITY,
                    [
                        Query.equal('user_id', user.$id),
                        Query.greaterThan('timestamp', oneWeekAgo)
                    ]
                );

                const activitiesCount = activity.total;
                
                await transporter.sendMail({
                    from: '"Study Companion Reports" <reports@studybuddy.ai>',
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
                message: `Weekly reports sent to ${successCount} users${failCount > 0 ? `, ${failCount} failed` : ''}.`,
                successCount,
                failCount
            });
        }
    } catch (error: any) {
        console.error('Weekly report generation error:', error.message);
        if (res) res.status(500).json({ error: error.message });
    }
};
