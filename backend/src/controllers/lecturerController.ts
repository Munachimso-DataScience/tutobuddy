import { Request, Response } from 'express';
import { Query } from 'node-appwrite';
import axios from 'axios';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';

const PAGE_SIZE = 100;

type AppwriteDoc = Record<string, unknown>;

const normalizeText = (value: unknown) => {
    if (typeof value !== 'string') {
        return '';
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : '';
};

const parseList = (value: unknown) => {
    if (typeof value !== 'string') {
        return [];
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
};

const parseActivityDetails = (details: unknown): Record<string, unknown> => {
    if (typeof details === 'string') {
        try {
            return JSON.parse(details) as Record<string, unknown>;
        } catch {
            return {};
        }
    }

    if (details && typeof details === 'object') {
        return details as Record<string, unknown>;
    }

    return {};
};

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
        if (offset > 5000) {
            break;
        }
    }

    return { documents, total };
}

function getStudyMinutesFromLogs(logs: AppwriteDoc[]) {
    return logs.reduce((total, log) => {
        if (log.type !== 'study_session') {
            return total;
        }

        const details = parseActivityDetails(log.details);
        return total + Math.max(0, Number(details.duration) || 0);
    }, 0);
}

function getCourseLabel(course: AppwriteDoc) {
    return normalizeText(course.title || course.name || course.code || course.$id || 'Course');
}

async function getLecturerStats() {
    const [profilesResponse, coursesResponse, quizzesResponse, activitiesResponse] = await Promise.all([
        listAllDocuments(COLLECTIONS.USERS),
        listAllDocuments(COLLECTIONS.COURSES),
        listAllDocuments(COLLECTIONS.QUIZZES),
        listAllDocuments(COLLECTIONS.ACTIVITY)
    ]);

    const profiles = profilesResponse.documents;
    const lecturerProfile = profiles.find((profile) => profile.role === 'lecturer') || profiles.find((profile) => profile.role === 'admin') || null;
    const trackedClassGroups = parseList(lecturerProfile?.class_group);
    const assignedCourseTokens = parseList(lecturerProfile?.assigned_courses).map((item) => item.toLowerCase());

    const studentProfiles = profiles.filter((profile) => {
        if (profile.role !== 'student') {
            return false;
        }

        const classGroup = normalizeText(profile.class_group);
        if (trackedClassGroups.length > 0) {
            return trackedClassGroups.includes(classGroup);
        }

        return true;
    });

    const studentIds = new Set(
        studentProfiles
            .map((profile) => normalizeText(profile.user_id || profile.$id))
            .filter(Boolean)
    );

    const courses = coursesResponse.documents.filter((course) => {
        if (studentIds.size > 0 && course.student_id && studentIds.has(normalizeText(course.student_id))) {
            return true;
        }

        if (assignedCourseTokens.length === 0) {
            return studentIds.size === 0;
        }

        const courseId = normalizeText(course.$id).toLowerCase();
        const courseCode = normalizeText(course.code).toLowerCase();
        const courseLabel = getCourseLabel(course).toLowerCase();

        return assignedCourseTokens.some((token) =>
            courseId === token ||
            courseCode === token ||
            courseLabel.includes(token) ||
            token.includes(courseCode)
        );
    });

    const courseMap = new Map<string, AppwriteDoc>();
    for (const course of coursesResponse.documents) {
        courseMap.set(normalizeText(course.$id), course);
    }

    const quizzes = quizzesResponse.documents.filter((quiz) => {
        if (studentIds.size === 0) {
            return true;
        }

        return studentIds.has(normalizeText(quiz.user_id));
    });

    const activities = activitiesResponse.documents.filter((activity) => {
        if (studentIds.size === 0) {
            return true;
        }

        return studentIds.has(normalizeText(activity.user_id));
    });

    const coursePerformance = new Map<string, { courseId: string; title: string; attempts: number; totalScore: number; readiness: number }>();
    for (const quiz of quizzes) {
        const courseId = normalizeText(quiz.course_id);
        const course = courseMap.get(courseId);
        const label = course ? getCourseLabel(course) : normalizeText(quiz.title || courseId || 'Course');
        const current = coursePerformance.get(courseId) || {
            courseId,
            title: label,
            attempts: 0,
            totalScore: 0,
            readiness: Number(course?.exam_readiness) || 0
        };

        current.attempts += 1;
        current.totalScore += Number(quiz.score) || 0;
        current.readiness = Number(course?.exam_readiness) || current.readiness;
        coursePerformance.set(courseId, current);
    }

    const courseStats = Array.from(coursePerformance.values())
        .map((item) => ({
            course_id: item.courseId,
            title: item.title,
            attempts: item.attempts,
            avg_score: item.attempts > 0 ? Math.round(item.totalScore / item.attempts) : 0,
            readiness: item.readiness
        }))
        .sort((left, right) => right.attempts - left.attempts)
        .slice(0, 8);

    const classGroups = new Map<string, { name: string; students: number; quizzes: number; totalScore: number; studyMinutes: number }>();
    for (const student of studentProfiles) {
        const name = normalizeText(student.class_group) || 'Unassigned';
        const current = classGroups.get(name) || {
            name,
            students: 0,
            quizzes: 0,
            totalScore: 0,
            studyMinutes: 0
        };
        current.students += 1;
        classGroups.set(name, current);
    }

    const studyMinutesByClass = new Map<string, number>();
    for (const activity of activities) {
        if (activity.type !== 'study_session') {
            continue;
        }

        const details = parseActivityDetails(activity.details);
        const duration = Math.max(0, Number(details.duration) || 0);
        const className = normalizeText(details.classGroup || details.class_group) || 'Unassigned';
        studyMinutesByClass.set(className, (studyMinutesByClass.get(className) || 0) + duration);
    }

    const groupedScores = new Map<string, { count: number; total: number }>();
    for (const quiz of quizzes) {
        const course = courseMap.get(normalizeText(quiz.course_id));
        const className = normalizeText(course?.category || course?.class_group || 'Unassigned');
        const current = groupedScores.get(className) || { count: 0, total: 0 };
        current.count += 1;
        current.total += Number(quiz.score) || 0;
        groupedScores.set(className, current);
    }

    const classStats = Array.from(classGroups.values())
        .map((group) => {
            const scoreBucket = groupedScores.get(group.name) || { count: 0, total: 0 };
            return {
                name: group.name,
                students: group.students,
                quizzes: scoreBucket.count,
                avg_score: scoreBucket.count > 0 ? Math.round(scoreBucket.total / scoreBucket.count) : 0,
                study_minutes: studyMinutesByClass.get(group.name) || 0
            };
        })
        .sort((left, right) => right.students - left.students)
        .slice(0, 8);

    const weaknessCounts = new Map<string, { topic: string; misses: number }>();
    for (const activity of activities) {
        if (activity.type !== 'quiz_incorrect') {
            continue;
        }

        const details = parseActivityDetails(activity.details);
        const topic = normalizeText(
            details.topic ||
            details.courseTitle ||
            details.contentTitle ||
            details.question ||
            details.question_text ||
            details.course_id
        ) || 'General revision';

        const current = weaknessCounts.get(topic) || { topic, misses: 0 };
        current.misses += 1;
        weaknessCounts.set(topic, current);
    }

    const topWeaknesses = Array.from(weaknessCounts.values())
        .sort((left, right) => right.misses - left.misses)
        .slice(0, 8);

    const totalStudyMinutes = getStudyMinutesFromLogs(activities);
    const quizCount = quizzes.length;
    const avgScore = quizCount > 0
        ? Math.round(quizzes.reduce((sum, quiz) => sum + (Number(quiz.score) || 0), 0) / quizCount)
        : 0;
    const readiness = courseStats.length > 0
        ? Math.round(courseStats.reduce((sum, course) => sum + course.readiness, 0) / courseStats.length)
        : 0;

    const recommendations = [
        topWeaknesses[0]
            ? `Focus revision on ${topWeaknesses[0].topic} after ${topWeaknesses[0].misses} incorrect responses.`
            : 'Keep generating more quiz attempts so weak areas become easier to detect.',
        courseStats[0]
            ? `The most active course is ${courseStats[0].title}. Consider a focused revision quiz there.`
            : 'Assign more course activity to build stronger performance trends.',
        classStats[0]
            ? `The busiest class group is ${classStats[0].name}. Use this cohort for targeted reminders.`
            : 'Create class groups to unlock cohort-based analysis.'
    ];

    return {
        lecturer: {
            full_name: normalizeText(lecturerProfile?.full_name || lecturerProfile?.name || 'Lecturer'),
            role: normalizeText(lecturerProfile?.role || 'lecturer'),
            department: normalizeText(lecturerProfile?.department),
            class_group: normalizeText(lecturerProfile?.class_group),
            assigned_courses: parseList(lecturerProfile?.assigned_courses)
        },
        scope: {
            students: studentProfiles.length,
            tracked_courses: courses.length,
            tracked_quizzes: quizCount
        },
        performance: {
            average_score: avgScore,
            readiness,
            total_study_minutes: totalStudyMinutes,
            course_stats: courseStats,
            class_stats: classStats,
            top_weaknesses: topWeaknesses
        },
        recommendations
    };
}

export const getLecturerSummary = async (_req: Request, res: Response) => {
    try {
        const summary = await getLecturerStats();
        return res.status(200).json(summary);
    } catch (error: any) {
        console.error('Lecturer summary error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
