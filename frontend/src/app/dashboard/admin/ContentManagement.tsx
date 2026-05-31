'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

type ContentItem = {
    $id: string;
    title?: string;
    file_name?: string;
    created_at?: string;
    user_id?: string;
};

export default function ContentManagement() {
    const [courses, setCourses] = useState<ContentItem[]>([]);
    const [materials, setMaterials] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);

    const loadContent = async () => {
        try {
            setLoading(true);
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/admin/content`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setCourses(res.data.courses || []);
            setMaterials(res.data.materials || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load content database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, []);

    const handleDelete = async (type: 'course' | 'material', id: string) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const jwt = await getCachedJWT();
            await axios.delete(`${API_URL}/api/admin/content/${type}/${id}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success(`${type} deleted successfully`);
            loadContent();
        } catch (error) {
            toast.error(`Failed to delete ${type}`);
        }
    };

    if (loading) return <div className="flex p-4"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="mt-6 space-y-8">
            <div className="rounded-2xl border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Manage Courses</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Course Title</th>
                                    <th className="px-4 py-3">User ID</th>
                                    <th className="px-4 py-3">Created At</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => (
                                    <tr key={course.$id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{course.title || 'Untitled'}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{course.user_id}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(course.created_at || '').toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <button 
                                                onClick={() => handleDelete('course', course.$id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete Course"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {courses.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No courses found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Manage Study Materials</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Material Title</th>
                                    <th className="px-4 py-3">File Name</th>
                                    <th className="px-4 py-3">Created At</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {materials.map(material => (
                                    <tr key={material.$id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{material.title || 'Untitled'}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{material.file_name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(material.created_at || '').toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <button 
                                                onClick={() => handleDelete('material', material.$id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete Material"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {materials.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No study materials found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
