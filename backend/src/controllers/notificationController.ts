import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { users, databases } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_ACTIVITY = 'activity_logs';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

export const checkInactivity = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const inactiveUsers = response.users.filter(user => {
            const lastActive = user.registration ? new Date(user.registration) : null;
            return lastActive && lastActive < fortyEightHoursAgo;
        });

        for (const user of inactiveUsers) {
            await transporter.sendMail({
                from: '"Study Companion" <no-reply@studybuddy.ai>',
                to: user.email,
                subject: "Don't break your streak! 📚",
                text: `Hi ${user.name}, we haven't seen you in 48 hours. Keep up the momentum on your courses!`,
                html: `<b>Hi ${user.name},</b><p>We haven't seen you in 48 hours. Keep up the momentum on your courses!</p>`
            });
        }
        if (res) res.status(200).json({ message: `Reminders sent to ${inactiveUsers.length} users.` });
    } catch (error: any) {
        if (res) res.status(500).json({ error: error.message });
    }
};

export const generateWeeklyReports = async (req: Request, res: Response) => {
    try {
        const response = await users.list();
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        for (const user of response.users) {
            // Aggregate activity for the week
            const activity = await databases.listDocuments(
                DATABASE_ID,
                COLLECTION_ACTIVITY,
                [
                    Query.equal('student_id', user.$id),
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
        }
        if (res) res.status(200).json({ message: `Weekly reports sent to ${response.total} users.` });
    } catch (error: any) {
        if (res) res.status(500).json({ error: error.message });
    }
};
