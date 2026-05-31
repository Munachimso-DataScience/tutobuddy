'use client';

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Loader2, Trash2, Flag, FlagOff, Search } from 'lucide-react';
import { toast } from 'react-toastify';

type ContentItem = {
    $id: string;
    title?: string;
    name?: string;
    code?: string;
    student_id?: string;
    file_id?: string;
    type?: string;
    created_at?: string;
    $createdAt?: string;
    is_flagged?: boolean;
};

export default function ContentManagement() {
    const [courses, setCourses] = useState<ContentItem[]>([]);
    const [materials, setMaterials] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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
        if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) return;
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

    const handleToggleFlag = async (type: 'course' | 'material', id: string, currentFlagStatus: boolean) => {
        try {
            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/admin/content/${type}/${id}/flag`, {
                is_flagged: !currentFlagStatus
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success(`${type} flag status updated`);
            loadContent();
        } catch (error) {
            toast.error(`Failed to update flag status`);
        }
    };

    const filteredCourses = useMemo(() => {
        return courses.filter(c => {
            const searchStr = `${c.title || ''} ${c.name || ''} ${c.code || ''} ${c.student_id || ''}`.toLowerCase();
            return searchStr.includes(searchQuery.toLowerCase());
        });
    }, [courses, searchQuery]);

    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            const searchStr = `${m.title || ''} ${m.file_id || ''} ${m.type || ''}`.toLowerCase();
            return searchStr.includes(searchQuery.toLowerCase());
        });
    }, [materials, searchQuery]);

    if (loading) return <div className="flex p-4 justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="mt-6 space-y-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-muted-foreground" />
                </div>
                <input 
                    type="text" 
                    className="bg-card border text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5 shadow-sm" 
                    placeholder="Search courses or materials by title, code, or ID..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Manage Courses</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Course Info</th>
                                    <th className="px-4 py-3">Student ID</th>
                                    <th className="px-4 py-3">Created At</th>
                                    <th className="px-4 py-3">Flag Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map(course => (
                                    <tr key={course.$id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">
                                            <div>{course.title || course.name || 'Untitled'}</div>
                                            <div className="text-xs text-muted-foreground">{course.code || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{course.student_id || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(course.created_at || course.$createdAt || '').toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            {course.is_flagged ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <Flag className="w-3 h-3" /> Flagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    Clean
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleToggleFlag('course', course.$id, !!course.is_flagged)}
                                                    className={`p-1 rounded transition-colors ${course.is_flagged ? 'text-orange-500 hover:bg-orange-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    title={course.is_flagged ? "Unflag Course" : "Flag Course"}
                                                >
                                                    {course.is_flagged ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete('course', course.$id)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="Delete Course"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCourses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No courses found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Manage Study Materials</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Material Title</th>
                                    <th className="px-4 py-3">Type & File ID</th>
                                    <th className="px-4 py-3">Created At</th>
                                    <th className="px-4 py-3">Flag Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaterials.map(material => (
                                    <tr key={material.$id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium">{material.title || 'Untitled'}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs font-medium uppercase text-primary">{material.type || 'Unknown'}</div>
                                            <div className="text-muted-foreground text-xs mt-0.5 max-w-[150px] truncate" title={material.file_id}>{material.file_id || 'N/A'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(material.created_at || material.$createdAt || '').toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            {material.is_flagged ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <Flag className="w-3 h-3" /> Flagged
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                    Clean
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleToggleFlag('material', material.$id, !!material.is_flagged)}
                                                    className={`p-1 rounded transition-colors ${material.is_flagged ? 'text-orange-500 hover:bg-orange-100' : 'text-gray-400 hover:bg-gray-100'}`}
                                                    title={material.is_flagged ? "Unflag Material" : "Flag Material"}
                                                >
                                                    {material.is_flagged ? <FlagOff className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete('material', material.$id)}
                                                    className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                    title="Delete Material"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredMaterials.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No study materials found matching your search.</td>
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
