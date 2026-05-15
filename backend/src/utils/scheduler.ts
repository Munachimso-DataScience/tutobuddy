import { checkInactivity, generateWeeklyReports } from '../controllers/notificationController';

// Simple internal scheduler
export const initScheduler = () => {
    console.log('⏰ Scheduler initialized: Inactivity checks (24h) and Weekly Reports (7d).');
    
    // Initial check on startup (after 10 seconds delay)
    setTimeout(() => {
        console.log('🔔 Running initial inactivity check on startup...');
        checkInactivity({} as any, null as any);
    }, 10000);

    // Run inactivity check every 24 hours
    setInterval(() => {
        console.log('🔔 Running scheduled inactivity check...');
        checkInactivity({} as any, null as any);
    }, 24 * 60 * 60 * 1000);

    // Run weekly report every 7 days
    setInterval(() => {
        console.log('📊 Running scheduled weekly progress reports...');
        generateWeeklyReports({} as any, null as any);
    }, 7 * 24 * 60 * 60 * 1000);

    console.log('✓ Scheduler started successfully');
};
