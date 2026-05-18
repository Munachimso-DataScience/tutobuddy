import { Request, Response } from 'express';
import { Query } from 'node-appwrite';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';

type LeaderboardRow = {
    rank: number;
    userId: string;
    name: string;
    xp: number;
    courses: number;
    streak: number;
    avgScore: number;
    readiness: number;
    activityCount: number;
    league: 'Titan League' | 'Gold League' | 'Freshman';
    isUser?: boolean;
};

const getLeague = (xp: number): LeaderboardRow['league'] => {
    if (xp >= 8000) return 'Titan League';
    if (xp >= 4500) return 'Gold League';
    return 'Freshman';
};

const calculateXp = (courses: number, avgScore: number, streak: number, readiness: number, activityCount: number) => {
    return Math.round(
        courses * 220 +
        avgScore * 45 +
        streak * 35 +
        readiness * 18 +
        activityCount * 8
    );
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const currentUserId = (req as any).user?.$id;

        const profilesRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.USERS,
            [Query.limit(100)]
        );

        const rows = await Promise.all(
            profilesRes.documents.map(async (profile: any) => {
                const userId = profile.user_id || profile.$id;
                const name = profile.full_name || profile.name || profile.email || 'Student';
                const streak = Number(profile.current_streak) || 0;

                const [coursesRes, quizzesRes, activityRes] = await Promise.all([
                    databases.listDocuments(DATABASE_ID, COLLECTIONS.COURSES, [Query.equal('student_id', userId), Query.limit(100)]).catch(() => ({ documents: [], total: 0 })),
                    databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZZES, [Query.equal('user_id', userId), Query.limit(100)]).catch(() => ({ documents: [], total: 0 })),
                    databases.listDocuments(DATABASE_ID, COLLECTIONS.ACTIVITY, [Query.equal('user_id', userId), Query.limit(100)]).catch(() => ({ documents: [], total: 0 })),
                ]);

                const courses = coursesRes.total || coursesRes.documents.length || 0;

                const quizDocs = quizzesRes.documents || [];
                const avgScore = quizDocs.length
                    ? Math.round(quizDocs.reduce((sum: number, quiz: any) => sum + (Number(quiz.score) || 0), 0) / quizDocs.length)
                    : 0;

                const readiness = coursesRes.documents.length
                    ? Math.round(coursesRes.documents.reduce((sum: number, course: any) => sum + (Number(course.exam_readiness) || 0), 0) / coursesRes.documents.length)
                    : 0;

                const activityCount = activityRes.total || activityRes.documents.length || 0;
                const xp = calculateXp(courses, avgScore, streak, readiness, activityCount);

                return {
                    userId,
                    name,
                    xp,
                    courses,
                    streak,
                    avgScore,
                    readiness,
                    activityCount,
                    league: getLeague(xp),
                };
            })
        );

        const sorted = rows.sort((a, b) => b.xp - a.xp).map((row, index) => ({
            ...row,
            rank: index + 1,
            isUser: row.userId === currentUserId
        }));

        const currentUser = sorted.find(row => row.isUser) || null;
        const topUsers = sorted.slice(0, 20);

        res.status(200).json({
            leaderboard: topUsers,
            currentUser,
            totalUsers: sorted.length,
            leagues: {
                'Titan League': sorted.filter(row => row.league === 'Titan League').length,
                'Gold League': sorted.filter(row => row.league === 'Gold League').length,
                'Freshman': sorted.filter(row => row.league === 'Freshman').length,
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
