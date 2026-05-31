import { Request, Response } from 'express';
import { Query } from 'node-appwrite';
import axios from 'axios';
import { COLLECTIONS, DATABASE_ID } from '../lib/collections';
import { databases } from '../lib/appwrite-admin';
import { ID } from 'node-appwrite';

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

function toNumber(value: unknown) {
    return Number(value) || 0;
}

function average(values: number[]) {
    if (values.length === 0) {
        return 0;
    }

    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isSameKey(left: unknown, right: unknown) {
    return normalizeText(left).toLowerCase() === normalizeText(right).toLowerCase();
}

function getRangeDays(range: unknown) {
    const value = normalizeText(range).toLowerCase();

    if (value === '30d' || value === '30' || value === 'month') {
        return 30;
    }

    if (value === 'term' || value === 'semester' || value === '90d') {
        return 90;
    }

    return 7;
}

function getDateKey(dateValue: unknown) {
    const date = new Date(normalizeText(dateValue) || dateValue as string);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function buildDateSeries(days: number) {
    const dates: string[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let index = days - 1; index >= 0; index -= 1) {
        const point = new Date(cursor);
        point.setDate(cursor.getDate() - index);
        dates.push(point.toISOString().slice(0, 10));
    }

    return dates;
}

async function getLecturerStats(currentProfile: AppwriteDoc | null, filters: { rangeDays: number; classGroup: string; courseId: string }) {
    const [profilesResponse, coursesResponse, quizzesResponse, activitiesResponse] = await Promise.all([
        listAllDocuments(COLLECTIONS.USERS),
        listAllDocuments(COLLECTIONS.COURSES),
        listAllDocuments(COLLECTIONS.QUIZZES),
        listAllDocuments(COLLECTIONS.ACTIVITY)
    ]);
    const snapshotsResponse = await listAllDocuments(COLLECTIONS.STUDY_SNAPSHOTS);
    const remindersResponse = await listAllDocuments(COLLECTIONS.LECTURER_REMINDERS);
    const offeringsResponse = await listAllDocuments(COLLECTIONS.COURSE_OFFERINGS);
    const enrollmentsResponse = await listAllDocuments(COLLECTIONS.COURSE_ENROLLMENTS);
    const since = new Date(Date.now() - filters.rangeDays * 24 * 60 * 60 * 1000);
    const seriesDates = buildDateSeries(filters.rangeDays);
    const rangeStartKey = since.toISOString().slice(0, 10);

    const profiles = profilesResponse.documents;
    const lecturerProfile = currentProfile || profiles.find((profile) => profile.role === 'lecturer') || profiles.find((profile) => profile.role === 'admin') || null;
    const lecturerId = normalizeText(lecturerProfile?.user_id || lecturerProfile?.$id);
    const trackedClassGroups = parseList(lecturerProfile?.class_group);
    const assignedCourseTokens = parseList(lecturerProfile?.assigned_courses).map((item) => item.toLowerCase());
    const targetClassGroup = normalizeText(filters.classGroup);
    const targetCourseId = normalizeText(filters.courseId);

    const studentProfiles = profiles.filter((profile) => {
        if (profile.role !== 'student') {
            return false;
        }

        const classGroup = normalizeText(profile.class_group);
        const studentId = normalizeText(profile.user_id || profile.$id);
        const assignedMatches = assignedCourseTokens.length > 0
            ? coursesResponse.documents.some((course) =>
                normalizeText(course.student_id) === studentId &&
                assignedCourseTokens.some((token) => {
                    const courseId = normalizeText(course.$id).toLowerCase();
                    const courseCode = normalizeText(course.code).toLowerCase();
                    const courseLabel = getCourseLabel(course).toLowerCase();
                    return courseId === token || courseCode === token || courseLabel.includes(token);
                })
            )
            : true;

        const matchesLecturerGroup = trackedClassGroups.length > 0 ? trackedClassGroups.includes(classGroup) : true;
        const matchesTargetGroup = targetClassGroup ? classGroup === targetClassGroup : true;
        return matchesLecturerGroup && matchesTargetGroup && assignedMatches;
    });

    const studentIds = new Set(
        studentProfiles
            .map((profile) => normalizeText(profile.user_id || profile.$id))
            .filter(Boolean)
    );

    const courses = coursesResponse.documents.filter((course) => {
        if (studentIds.size > 0 && course.student_id && studentIds.has(normalizeText(course.student_id))) {
            if (targetCourseId) {
                return normalizeText(course.$id) === targetCourseId || normalizeText(course.code) === targetCourseId || getCourseLabel(course) === targetCourseId;
            }
            return true;
        }

        if (assignedCourseTokens.length === 0) {
            return studentIds.size === 0 && (!targetCourseId || normalizeText(course.$id) === targetCourseId || normalizeText(course.code) === targetCourseId);
        }

        const courseId = normalizeText(course.$id).toLowerCase();
        const courseCode = normalizeText(course.code).toLowerCase();
        const courseLabel = getCourseLabel(course).toLowerCase();

        const matchesAssigned = assignedCourseTokens.some((token) =>
            courseId === token ||
            courseCode === token ||
            courseLabel.includes(token) ||
            token.includes(courseCode)
        );

        const matchesFilter = targetCourseId
            ? courseId === targetCourseId.toLowerCase() || courseCode === targetCourseId.toLowerCase() || courseLabel === targetCourseId.toLowerCase()
            : true;

        return matchesAssigned && matchesFilter;
    });

    const courseMap = new Map<string, AppwriteDoc>();
    for (const course of courses) {
        courseMap.set(normalizeText(course.$id), course);
    }

    const quizzes = quizzesResponse.documents.filter((quiz) => {
        const quizDate = getDateKey(quiz.date_taken || quiz.created_at);
        if (quizDate < rangeStartKey) {
            return false;
        }

        if (studentIds.size === 0) {
            return !targetCourseId || normalizeText(quiz.course_id) === targetCourseId;
        }

        const matchesStudent = studentIds.has(normalizeText(quiz.user_id));
        const matchesCourse = targetCourseId ? normalizeText(quiz.course_id) === targetCourseId : true;
        return matchesStudent && matchesCourse;
    });

    const activities = activitiesResponse.documents.filter((activity) => {
        const activityDate = getDateKey(activity.timestamp);
        if (activityDate < rangeStartKey) {
            return false;
        }

        if (studentIds.size === 0) {
            return true;
        }

        const matchesStudent = studentIds.has(normalizeText(activity.user_id));
        if (!matchesStudent) {
            return false;
        }

        const details = parseActivityDetails(activity.details);
        const activityCourseId = normalizeText(details.courseId || details.course_id);
        const courseMatches = targetCourseId ? activityCourseId === targetCourseId || normalizeText(activity.description).includes(targetCourseId) : true;
        return courseMatches;
    });
    const latestSnapshots = new Map<string, AppwriteDoc>();
    for (const snapshot of snapshotsResponse.documents) {
        const userId = normalizeText(snapshot.user_id);
        if (!userId) {
            continue;
        }

        const previous = latestSnapshots.get(userId);
        const currentCreatedAt = new Date(normalizeText(snapshot.created_at || '') || 0).getTime();
        const previousCreatedAt = previous ? new Date(normalizeText(previous.created_at || '') || 0).getTime() : -1;
        if (!previous || currentCreatedAt >= previousCreatedAt) {
            latestSnapshots.set(userId, snapshot);
        }
    }

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

    const trendSeries = seriesDates.map((date) => {
        const dayActivities = activities.filter((activity) => getDateKey(activity.timestamp) === date);
        const dayQuizzes = quizzes.filter((quiz) => getDateKey(quiz.date_taken || quiz.created_at) === date);
        const studyMinutes = getStudyMinutesFromLogs(dayActivities);
        const scoreValues = dayQuizzes.map((quiz) => toNumber(quiz.score));
        const readinessValues = dayQuizzes
            .map((quiz) => courseMap.get(normalizeText(quiz.course_id)))
            .filter(Boolean)
            .map((course) => toNumber((course as AppwriteDoc).exam_readiness || (course as AppwriteDoc).progress));

        return {
            date,
            study_minutes: studyMinutes,
            avg_score: dayQuizzes.length > 0 ? average(scoreValues) : 0,
            readiness: readinessValues.length > 0 ? average(readinessValues) : 0,
            quizzes: dayQuizzes.length,
            study_sessions: dayActivities.filter((activity) => activity.type === 'study_session').length
        };
    });

    const reminderHistory = remindersResponse.documents
        .filter((reminder) => {
            if (targetClassGroup && normalizeText(reminder.class_group) !== targetClassGroup) {
                return false;
            }

            return getDateKey(reminder.created_at) >= rangeStartKey;
        })
        .sort((left, right) => new Date(normalizeText(right.created_at)).getTime() - new Date(normalizeText(left.created_at)).getTime())
        .slice(0, 10)
        .map((reminder) => ({
            class_group: normalizeText(reminder.class_group) || 'All students',
            topic: normalizeText(reminder.topic) || 'General revision',
            message: normalizeText(reminder.message),
            recipients: toNumber(reminder.recipients),
            created_at: normalizeText(reminder.created_at)
        }));

    const studentProgress = studentProfiles
        .map((student) => {
            const studentId = normalizeText(student.user_id || student.$id);
            const studentCourses = courses.filter((course) => normalizeText(course.student_id) === studentId);
            const studentQuizzes = quizzes.filter((quiz) => normalizeText(quiz.user_id) === studentId);
            const studentScores = studentQuizzes.map((quiz) => toNumber(quiz.score));
            const courseReadiness = studentCourses.map((course) => toNumber(course.exam_readiness || course.progress));
            const snapshot = latestSnapshots.get(studentId);
            const latestActivity = activities
                .filter((activity) => normalizeText(activity.user_id) === studentId)
                .sort((left, right) => new Date(normalizeText(right.timestamp)).getTime() - new Date(normalizeText(left.timestamp)).getTime())[0];

            return {
                user_id: studentId,
                full_name: normalizeText(student.full_name || student.name || 'Student'),
                class_group: normalizeText(student.class_group) || 'Unassigned',
                study_minutes_total: toNumber(student.study_minutes_total),
                current_streak: toNumber(student.current_streak),
                average_score: average(studentScores),
                readiness: courseReadiness.length > 0 ? average(courseReadiness) : 0,
                recent_content_covered: normalizeText(snapshot?.recent_content_covered || student.recent_content_covered),
                last_study_summary: normalizeText(snapshot?.summary_text),
                weekly_weaknesses: normalizeText(snapshot?.weekly_weaknesses),
                last_study_at: normalizeText(snapshot?.created_at || latestActivity?.timestamp)
            };
        })
        .sort((left, right) => right.study_minutes_total - left.study_minutes_total)
        .slice(0, 12);

    const lowestReadiness = [...studentProgress]
        .sort((left, right) => left.readiness - right.readiness)
        .slice(0, 5);

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

    const lecturerOfferings = offeringsResponse.documents
        .filter((offering) => {
            const matchesLecturer = !lecturerId || isSameKey(offering.lecturer_id, lecturerId);
            const matchesClass = targetClassGroup ? isSameKey(offering.class_group, targetClassGroup) : true;
            const matchesCourse = targetCourseId ? isSameKey(offering.$id, targetCourseId) || isSameKey(offering.code, targetCourseId) || isSameKey(offering.title, targetCourseId) : true;
            const adminView = normalizeText(lecturerProfile?.role) === 'admin';
            return (adminView || matchesLecturer) && matchesClass && matchesCourse;
        })
        .map((offering) => {
            const enrollmentCount = enrollmentsResponse.documents.filter((enrollment) => isSameKey(enrollment.offering_id, offering.$id)).length;
            return {
                $id: normalizeText(offering.$id),
                title: normalizeText(offering.title),
                code: normalizeText(offering.code),
                description: normalizeText(offering.description),
                department: normalizeText(offering.department),
                class_group: normalizeText(offering.class_group),
                lecturer_id: normalizeText(offering.lecturer_id),
                term: normalizeText(offering.term),
                status: normalizeText(offering.status || 'active'),
                created_at: normalizeText(offering.created_at),
                updated_at: normalizeText(offering.updated_at),
                enrolled_students: enrollmentCount
            };
        })
        .sort((left, right) => normalizeText(right.created_at).localeCompare(normalizeText(left.created_at)));

    const availableClassGroups = Array.from(
        new Set(studentProfiles.map((student) => normalizeText(student.class_group)).filter(Boolean))
    ).sort((left, right) => left.localeCompare(right));

    const availableCourses = courses
        .map((course) => ({
            course_id: normalizeText(course.$id),
            code: normalizeText(course.code),
            title: getCourseLabel(course),
            class_group: normalizeText(course.class_group || course.category || '')
        }))
        .filter((course) => Boolean(course.course_id || course.code || course.title))
        .sort((left, right) => left.title.localeCompare(right.title));

    return {
        lecturer: {
            full_name: normalizeText(lecturerProfile?.full_name || lecturerProfile?.name || 'Lecturer'),
            role: normalizeText(lecturerProfile?.role || 'lecturer'),
            department: normalizeText(lecturerProfile?.department),
            class_group: normalizeText(lecturerProfile?.class_group),
            assigned_courses: parseList(lecturerProfile?.assigned_courses)
        },
        filters: {
            range_days: filters.rangeDays,
            class_group: targetClassGroup,
            course_id: targetCourseId
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
        trends: trendSeries,
        students: {
            progress: studentProgress,
            lowest_readiness: lowestReadiness,
            available_class_groups: availableClassGroups,
            available_courses: availableCourses
        },
        reminders: reminderHistory,
        offerings: lecturerOfferings,
        recommendations
    };
}

export const createCourseOffering = async (req: Request, res: Response) => {
    try {
        const lecturerProfile = (req as any).profile || null;
        const lecturerId = normalizeText(lecturerProfile?.user_id || lecturerProfile?.$id || (req as any).user?.$id);
        const {
            title,
            code,
            description,
            department,
            class_group: classGroup,
            term,
            status
        } = req.body || {};

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const now = new Date().toISOString();
        const offering = await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_OFFERINGS, ID.unique(), {
            title: normalizeText(title),
            code: normalizeText(code),
            description: normalizeText(description),
            department: normalizeText(department),
            class_group: normalizeText(classGroup),
            lecturer_id: lecturerId,
            term: normalizeText(term),
            status: normalizeText(status) || 'active',
            created_at: now,
            updated_at: now
        });

        const profilesResponse = await listAllDocuments(COLLECTIONS.USERS);
        const shouldAutoEnroll = String((req.body || {}).auto_enroll ?? 'true').toLowerCase() !== 'false';
        const students = shouldAutoEnroll
            ? profilesResponse.documents.filter((profile) => profile.role === 'student' && isSameKey(profile.class_group, classGroup))
            : [];
        const enrollments = [];

        for (const student of students) {
            const enrollment = await databases.createDocument(DATABASE_ID, COLLECTIONS.COURSE_ENROLLMENTS, ID.unique(), {
                offering_id: offering.$id,
                student_id: normalizeText(student.user_id || student.$id),
                status: 'enrolled',
                enrolled_at: now
            });
            enrollments.push(enrollment);
        }

        return res.status(201).json({
            offering,
            enrolled_students: enrollments.length,
            enrolled: enrollments.length
        });
    } catch (error: any) {
        console.error('Create course offering error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getCourseOfferings = async (req: Request, res: Response) => {
    try {
        const lecturerProfile = (req as any).profile || null;
        const lecturerId = normalizeText(lecturerProfile?.user_id || lecturerProfile?.$id || (req as any).user?.$id);
        const role = normalizeText(lecturerProfile?.role || (req as any).userRole || 'lecturer');
        const offeringsResponse = await listAllDocuments(COLLECTIONS.COURSE_OFFERINGS);
        const enrollmentsResponse = await listAllDocuments(COLLECTIONS.COURSE_ENROLLMENTS);

        const offerings = offeringsResponse.documents
            .filter((offering) => role === 'admin' || isSameKey(offering.lecturer_id, lecturerId))
            .map((offering) => ({
                ...offering,
                enrolled_students: enrollmentsResponse.documents.filter((enrollment) => isSameKey(enrollment.offering_id, offering.$id)).length
            }));

        return res.status(200).json({
            offerings
        });
    } catch (error: any) {
        console.error('List course offerings error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const sendLecturerReminder = async (req: Request, res: Response) => {
    try {
        const { classGroup, topic, message } = req.body || {};
        const profilesResponse = await listAllDocuments(COLLECTIONS.USERS);
        const authorId = normalizeText((req as any).user?.$id || (req as any).profile?.user_id || (req as any).profile?.$id);
        const targetGroup = normalizeText(classGroup);
        const targetTopic = normalizeText(topic);
        const baseMessage = normalizeText(message) || (targetTopic
            ? `Please revise ${targetTopic} this week and prepare for your next quiz.`
            : 'Please revisit your recent study materials and keep your momentum going.');

        const students = profilesResponse.documents.filter((profile) => {
            if (profile.role !== 'student') {
                return false;
            }

            if (!targetGroup) {
                return true;
            }

            return normalizeText(profile.class_group) === targetGroup;
        });

        const notifications = [];
        for (const student of students) {
            const notification = await databases.createDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, ID.unique(), {
                user_id: normalizeText(student.user_id || student.$id),
                title: targetTopic ? `Revision reminder: ${targetTopic}` : 'Revision reminder',
                message: baseMessage,
                link: '/dashboard',
                type: 'reminder',
                source: 'lecturer',
                is_read: false,
                created_at: new Date().toISOString()
            });
            notifications.push(notification);
        }

        await databases.createDocument(DATABASE_ID, COLLECTIONS.LECTURER_REMINDERS, ID.unique(), {
            author_id: authorId,
            class_group: targetGroup,
            topic: targetTopic,
            message: baseMessage,
            recipients: notifications.length,
            created_at: new Date().toISOString()
        });

        return res.status(200).json({
            message: 'Revision reminder sent successfully.',
            recipients: notifications.length,
            classGroup: targetGroup || 'all students'
        });
    } catch (error: any) {
        console.error('Lecturer reminder error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturerSummary = async (_req: Request, res: Response) => {
    try {
        const req = _req as any;
        const summary = await getLecturerStats(req.profile || null, {
            rangeDays: getRangeDays(req.query?.range),
            classGroup: normalizeText(req.query?.classGroup),
            courseId: normalizeText(req.query?.courseId)
        });
        return res.status(200).json(summary);
    } catch (error: any) {
        console.error('Lecturer summary error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getLecturerStudentHistory = async (req: Request, res: Response) => {
    try {
        const studentId = normalizeText(req.params.id);
        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        const [quizzesResponse, activitiesResponse] = await Promise.all([
            databases.listDocuments(DATABASE_ID, COLLECTIONS.QUIZZES, [
                Query.equal('user_id', studentId),
                Query.limit(50),
                Query.orderDesc('created_at')
            ]),
            databases.listDocuments(DATABASE_ID, COLLECTIONS.ACTIVITY, [
                Query.equal('user_id', studentId),
                Query.limit(100),
                Query.orderDesc('timestamp')
            ])
        ]);

        const history: any[] = [];

        for (const quiz of quizzesResponse.documents) {
            history.push({
                type: 'quiz',
                id: normalizeText(quiz.$id),
                title: normalizeText(quiz.title || quiz.course_id || 'Quiz'),
                score: toNumber(quiz.score),
                timestamp: normalizeText(quiz.date_taken || quiz.created_at)
            });
        }

        for (const activity of activitiesResponse.documents) {
            const details = parseActivityDetails(activity.details);
            history.push({
                type: 'activity',
                id: normalizeText(activity.$id),
                activity_type: normalizeText(activity.type),
                description: normalizeText(activity.description),
                duration: toNumber(details.duration),
                timestamp: normalizeText(activity.timestamp)
            });
        }

        history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return res.status(200).json({ history: history.slice(0, 100) });
    } catch (error: any) {
        console.error('Lecturer student history error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};
