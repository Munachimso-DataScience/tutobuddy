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

export const getLecturerSummary = async (jwt?: string) => {
    const res = await fetch(`${API_URL}/api/lecturer/summary`, {
        headers: jwt ? { Authorization: `Bearer ${jwt}` } : undefined
    });
    if (!res.ok) {
        throw new Error('Failed to fetch lecturer summary');
    }
    return res.json();
};
