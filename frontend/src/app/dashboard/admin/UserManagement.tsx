'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-toastify';

type User = {
    $id: string;
    full_name?: string;
    email?: string;
    role?: string;
    school?: string;
    department?: string;
    created_at?: string;
};

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            toast.error("Failed to update role");
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

    return (
        <div className="mt-6 rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="text-lg font-bold mb-4">Manage Users</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">School / Dept</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.$id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-4 py-3 font-medium">{user.full_name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email || 'N/A'}</td>
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
                                        </select>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        {user.school || 'N/A'} <br/> {user.department || ''}
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
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
