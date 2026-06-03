import { checkInactivity, generateWeeklyReports, sendDailyStudySummaries, sendStudySessionReminders } from '../controllers/notificationController';

const schedulerStatus = {
    running: false,
    startedAt: '',
    lastRunAt: '',
    jobs: [
        'inactivity_check',
        'daily_study_summary',
        'study_session_reminders',
        'weekly_reports'
    ]
};

const markRun = () => {
    schedulerStatus.lastRunAt = new Date().toISOString();
};

// Simple internal scheduler
export const initScheduler = () => {
    schedulerStatus.running = true;
    schedulerStatus.startedAt = new Date().toISOString();
    console.log('Scheduler initialized: Inactivity checks (24h), Daily Study Summaries, Study Reminders, and Weekly Reports (7d).');

    // Start-up triggers disabled to prevent email spam on server restart.

    // Run inactivity check every 24 hours
    setInterval(() => {
        console.log('Running scheduled inactivity check...');
        markRun();
        checkInactivity({} as any, null as any);
    }, 24 * 60 * 60 * 1000);

    setInterval(() => {
        console.log('Running scheduled study summary...');
        markRun();
        sendDailyStudySummaries({} as any, null as any);
    }, 7 * 24 * 60 * 60 * 1000); // Changed to weekly

    setInterval(() => {
        console.log('Running scheduled study session reminders...');
        markRun();
        sendStudySessionReminders({} as any, null as any);
    }, 24 * 60 * 60 * 1000);

    // Run weekly report every 7 days
    setInterval(() => {
        console.log('Running scheduled weekly progress reports...');
        markRun();
        generateWeeklyReports({} as any, null as any);
    }, 7 * 24 * 60 * 60 * 1000);

    console.log('Scheduler started successfully');
};

export const getSchedulerStatus = () => ({
    ...schedulerStatus
});
