'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/AuthContext';

type User = {
    $id: string;
    full_name?: string;
    email?: string;
    Email?: string;
    role?: string;
    school?: string;
    department?: string;
    assigned_courses?: string;
    created_at?: string;
};

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { role: currentUserRole } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const loadUsers = async () => {
        try {
            setLoading(true);
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setUsers(res.data.users || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("Role updated");
            loadUsers();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || "Failed to update role");
        }
    };

    const handleAssignedCoursesChange = async (userId: string, assignedCourses: string) => {
        try {
            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/admin/users/${userId}/role`, { assigned_courses: assignedCourses }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("Assigned courses updated");
            loadUsers();
        } catch (error) {
            toast.error("Failed to update assigned courses");
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
        try {
            const jwt = await getCachedJWT();
            await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("User deleted");
            loadUsers();
        } catch (error) {
            toast.error("Failed to delete user");
        }
    };

    if (loading) return <div className="flex p-4"><Loader2 className="animate-spin text-primary" /></div>;

    const filteredAndSortedUsers = [...users]
        .filter(u => {
            const term = searchTerm.toLowerCase();
            const nameMatch = (u.full_name || '').toLowerCase().includes(term);
            const emailMatch = (u.email || u.Email || '').toLowerCase().includes(term);
            return nameMatch || emailMatch;
        })
        .sort((a, b) => {
            const nameA = (a.full_name || a.email || a.Email || '').toLowerCase();
            const nameB = (b.full_name || b.email || b.Email || '').toLowerCase();
            if (sortOrder === 'asc') return nameA.localeCompare(nameB);
            return nameB.localeCompare(nameA);
        });

    return (
        <div className="mt-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                    <h3 className="text-lg font-bold">Manage Users</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="text" 
                            placeholder="Search name or email..." 
                            className="bg-background border rounded-xl px-4 py-2 text-sm w-full sm:w-64 focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select 
                            className="bg-background border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all w-full sm:w-auto"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                            title="Sort Order"
                        >
                            <option value="asc">A to Z</option>
                            <option value="desc">Z to A</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">School / Dept</th>
                                <th className="px-4 py-3 min-w-[200px]">Assigned Courses (Lecturers)</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedUsers.map(user => (
                                <tr key={user.$id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-4 py-3 font-medium">{user.full_name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email || user.Email || 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <select 
                                            className="bg-background border rounded px-2 py-1 text-xs"
                                            value={user.role || 'student'}
                                            onChange={(e) => handleRoleChange(user.$id, e.target.value)}
                                            title="User Role"
                                            aria-label="User Role"
                                        >
                                            <option value="student">Student</option>
                                            <option value="lecturer">Lecturer</option>
                                            <option value="admin">Admin</option>
                                            {currentUserRole === 'superadmin' && (
                                                <option value="superadmin">Superadmin</option>
                                            )}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        {user.school || 'N/A'} <br/> {user.department || ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.role === 'lecturer' ? (
                                            <input 
                                                type="text"
                                                className="bg-background border rounded px-2 py-1 text-xs w-full"
                                                defaultValue={user.assigned_courses || ''}
                                                placeholder="e.g. PHY101, CHM101"
                                                onBlur={(e) => {
                                                    if (e.target.value !== (user.assigned_courses || '')) {
                                                        handleAssignedCoursesChange(user.$id, e.target.value);
                                                    }
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }}
                                                title="Assigned Courses"
                                            />
                                        ) : null}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => handleDelete(user.$id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded"
                                            title="Delete User"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredAndSortedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                                        {users.length === 0 ? "No users found." : "No users match your search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
