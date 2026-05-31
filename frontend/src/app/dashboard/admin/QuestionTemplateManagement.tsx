'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import { Loader2, Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'react-toastify';

type Template = {
    $id: string;
    name: string;
    prompt_text: string;
    is_active: boolean;
};

export default function QuestionTemplateManagement() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPromptText, setNewPromptText] = useState('');

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/admin/templates`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setTemplates(res.data.templates || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    const handleCreate = async () => {
        if (!newName.trim() || !newPromptText.trim()) return toast.error("Name and Prompt Text are required");
        try {
            const jwt = await getCachedJWT();
            await axios.post(`${API_URL}/api/admin/templates`, { name: newName, prompt_text: newPromptText, is_active: true }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("Template created");
            setNewName('');
            setNewPromptText('');
            setIsCreating(false);
            loadTemplates();
        } catch (error) {
            toast.error("Failed to create template");
        }
    };

    const handleToggleActive = async (id: string, currentActive: boolean) => {
        try {
            const jwt = await getCachedJWT();
            await axios.patch(`${API_URL}/api/admin/templates/${id}`, { is_active: !currentActive }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("Template updated");
            loadTemplates();
        } catch (error) {
            toast.error("Failed to update template");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this template?")) return;
        try {
            const jwt = await getCachedJWT();
            await axios.delete(`${API_URL}/api/admin/templates/${id}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success("Template deleted");
            loadTemplates();
        } catch (error) {
            toast.error("Failed to delete template");
        }
    };

    if (loading) return <div className="flex p-4"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="mt-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Manage Templates</h2>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {isCreating && (
                <div className="p-4 border rounded-xl bg-card">
                    <h3 className="font-bold mb-3">Create New Template</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground">Name</label>
                            <input 
                                value={newName} 
                                onChange={e => setNewName(e.target.value)}
                                className="w-full border rounded-lg p-2 text-sm mt-1" 
                                placeholder="e.g. Default MCQ"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-muted-foreground">Prompt Text</label>
                            <textarea 
                                value={newPromptText} 
                                onChange={e => setNewPromptText(e.target.value)}
                                className="w-full border rounded-lg p-2 text-sm mt-1 min-h-[100px]" 
                                placeholder="You are an expert tutor... generate a quiz..."
                            />
                        </div>
                        <div className="flex justify-end">
                            <button 
                                onClick={handleCreate}
                                className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/90"
                            >
                                <Save className="w-4 h-4" />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {templates.map(template => (
                    <div key={template.$id} className="p-4 border rounded-xl bg-card shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-base">{template.name}</h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleToggleActive(template.$id, template.is_active)}
                                    className={`px-2 py-1 text-xs rounded-full font-bold ${template.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}
                                >
                                    {template.is_active ? 'Active' : 'Inactive'}
                                </button>
                                <button 
                                    onClick={() => handleDelete(template.$id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete Template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-muted p-2 rounded-lg text-xs font-mono text-muted-foreground overflow-y-auto max-h-32 flex-grow">
                            {template.prompt_text}
                        </div>
                    </div>
                ))}
                {templates.length === 0 && (
                    <div className="col-span-2 text-center p-8 text-muted-foreground border rounded-xl border-dashed">
                        No question templates found.
                    </div>
                )}
            </div>
        </div>
    );
}
