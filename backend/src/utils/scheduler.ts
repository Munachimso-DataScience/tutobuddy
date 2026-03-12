import { checkInactivity, generateWeeklyReports } from '../controllers/notificationController';

// Simple internal scheduler
export const initScheduler = () => {
    console.log('Scheduler initialized: Inactivity checks (24h) and Weekly Reports (7d).');
    
    // Initial check on startup
    checkInactivity({} as any, { status: () => ({ json: () => {} }) } as any);

    // Run inactivity check every 24 hours
    setInterval(() => {
        console.log('Running scheduled inactivity check...');
        checkInactivity({} as any, { status: () => ({ json: () => {} }) } as any);
    }, 24 * 60 * 60 * 1000);

    // Run weekly report every 7 days
    setInterval(() => {
        console.log('Running scheduled weekly progress reports...');
        generateWeeklyReports({} as any, { status: () => ({ json: () => {} }) } as any);
    }, 7 * 24 * 60 * 60 * 1000);
};
