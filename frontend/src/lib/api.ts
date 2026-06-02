export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const AI_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export const getAdminSummary = async (jwt?: string) => {
    const res = await fetch(`${API_URL}/api/admin/summary`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });
    if (!res.ok) {
        throw new Error('Failed to fetch admin summary');
    }
    return res.json();
};

export const getLecturerSummary = async (
    jwt?: string,
    params?: { range?: string; classGroup?: string; courseId?: string }
) => {
    const searchParams = new URLSearchParams();
    if (params?.range) searchParams.set('range', params.range);
    if (params?.classGroup) searchParams.set('classGroup', params.classGroup);
    if (params?.courseId) searchParams.set('courseId', params.courseId);

    const queryString = searchParams.toString();
    const res = await fetch(`${API_URL}/api/lecturer/summary${queryString ? `?${queryString}` : ''}`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });
    if (!res.ok) {
        throw new Error('Failed to fetch lecturer summary');
    }
    return res.json();
};

export const getLecturerCourseOfferings = async (jwt?: string) => {
    const res = await fetch(`${API_URL}/api/lecturer/course-offerings`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });
    if (!res.ok) {
        throw new Error('Failed to fetch lecturer course offerings');
    }
    return res.json();
};

export const createLecturerCourseOffering = async (
    jwt: string | undefined,
    payload: FormData
) => {
    const res = await fetch(`${API_URL}/api/lecturer/course-offerings`, {
        method: 'POST',
        headers: {
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: payload
    });

    if (!res.ok) {
        throw new Error('Failed to create lecturer course offering');
    }

    return res.json();
};

export const sendLecturerReminder = async (
    jwt: string | undefined,
    payload: { classGroup?: string; topic?: string; message?: string }
) => {
    const res = await fetch(`${API_URL}/api/lecturer/reminders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : {})
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error('Failed to send lecturer reminder');
    }

    return res.json();
};

export const getLecturerStudentHistory = async (jwt: string | undefined, studentId: string) => {
    const res = await fetch(`${API_URL}/api/lecturer/students/${studentId}/history`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });
    if (!res.ok) {
        throw new Error('Failed to fetch student history');
    }
    return res.json();
};
