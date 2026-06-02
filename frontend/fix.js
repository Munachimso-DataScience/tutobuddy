const fs = require('fs');
let content = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');

content = content.replace(/\r\n/g, '\n');

const logicBlock = `    const today = new Date().toISOString().slice(0, 10);
    const todaysLogs = stats?.recentLogs?.filter((log: any) => log.timestamp?.startsWith(today)) || [];
    
    const quizDone = todaysLogs.some((log: any) => log.type.includes('quiz') || log.type.includes('evaluate'));
    const uploadDone = todaysLogs.some((log: any) => log.type.includes('upload') || log.type.includes('material'));
    const essayDone = todaysLogs.some((log: any) => log.type.includes('essay'));

    const dailyQuests = [
        { title: 'Quiz Master', desc: 'Complete any 10-question quiz', xp: '+50 XP', done: quizDone, color: 'bg-primary' },
        { title: 'The Scholar', desc: 'Upload and read 1 new document', xp: '+30 XP', done: uploadDone, color: 'bg-accent' },
        { title: 'Essay Writer', desc: 'Submit 1 high-quality essay', xp: '+100 XP', done: essayDone, color: 'bg-denim' }
    ];
    const completedQuestsCount = dailyQuests.filter(q => q.done).length;

    return (
        <div className="space-y-8 pb-10">`;

content = content.replace('    return (\n        <div className="space-y-8 pb-10">', logicBlock);

content = content.replace('0/3 Complete', '{completedQuestsCount}/3 Complete');

const mapBlock = '{dailyQuests.map((quest, i) => (';
content = content.replace(/\{\s*\[[\s\S]*?\]\.map\(\(quest,\s*i\)\s*=>\s*\(/, mapBlock);

fs.writeFileSync('src/app/dashboard/page.tsx', content);
