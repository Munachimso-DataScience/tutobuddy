'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    FileText,
    Upload,
    ChevronLeft,
    MoreVertical,
    File,
    Loader2,
    CheckCircle2,
    ExternalLink,
    Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useStudyHeartbeat } from '@/hooks/useStudyHeartbeat';
import { account } from '@/lib/appwrite';
import QuizComponent from '@/components/quiz/QuizComponent';

export default function CourseDetailsPage() {
    const params = useParams();
    const courseId = params?.id as string;
    useStudyHeartbeat(courseId);
    
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState<any>(null);
    const [currentMaterialId, setCurrentMaterialId] = useState<string | null>(null);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (courseId) {
            fetchMaterials();
        }
    }, [courseId]);

    const fetchMaterials = async () => {
        try {
            const { jwt } = await account.createJWT();
            const response = await axios.get(`http://localhost:5000/api/materials/${courseId}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateQuiz = async (materialId: string) => {
        setGeneratingQuiz(true);
        try {
            const { jwt } = await account.createJWT();
            const response = await axios.post('http://localhost:5000/api/quizzes/generate', {
                materialId
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            
            const quizContent = JSON.parse(response.data.content);
            setCurrentQuiz(quizContent);
            setCurrentMaterialId(materialId);
            setIsQuizOpen(true);
            toast.success('AI Quiz prepared successfully!');
        } catch (error: any) {
            toast.error('Failed to generate quiz. Try again.');
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('courseId', courseId);
        formData.append('title', file.name);

        try {
            const { jwt } = await account.createJWT();
            await axios.post('http://localhost:5000/api/materials/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${jwt}`
                }
            });
            toast.success('Document uploaded and ready for analysis!');
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    if (isQuizOpen && currentQuiz) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-black p-8">
                <div className="max-w-4xl mx-auto">
                    <button 
                        onClick={() => setIsQuizOpen(false)}
                        className="mb-8 flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back to Material
                    </button>
                    <QuizComponent 
                        questions={currentQuiz.questions} 
                        materialId={currentMaterialId || undefined}
                        onComplete={(score) => {
                            console.log('Quiz complete, score:', score);
                            // We can log this to the activity log as well
                        }} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="h-10 w-10 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <h1 className="text-2xl font-bold">Course Materials</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Materials List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Study Resources</h2>
                            <span className="text-sm text-gray-400 font-medium">{materials.length} files</span>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                        ) : materials.length > 0 ? (
                            <div className="space-y-3">
                                {materials.map((file) => (
                                    <div
                                        key={file.$id}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                    {file.title}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Added {new Date(file.uploaded_at || file.$createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <button 
                                                onClick={() => handleGenerateQuiz(file.$id)}
                                                disabled={generatingQuiz}
                                                className="flex items-center text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                {generatingQuiz ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1 fill-current" />}
                                                Start Quiz
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                                <MoreVertical className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <File className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No materials uploaded yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Zone */}
                <div className="space-y-6">
                    <div className="bg-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-500/20 text-white">
                        <h3 className="text-lg font-bold mb-2">Upload Material</h3>
                        <p className="text-blue-100 text-xs mb-6 font-medium leading-relaxed">
                            Upload your lecture notes, PDFs, or research papers. Our AI will analyze them to generate personalized quizzes and summaries.
                        </p>

                        <label className={`
                            flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-xl p-8 cursor-pointer transition-all
                            hover:bg-blue-500/50 hover:border-white
                            ${uploading ? 'pointer-events-none opacity-50' : ''}
                        `}>
                            {uploading ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mb-4 stroke-[1.5]" />
                                    <span className="text-sm font-bold">Drop PDF or click to browse</span>
                                    <span className="text-[10px] mt-2 text-blue-200 uppercase tracking-widest font-bold">Max size 10MB</span>
                                </>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">AI Insight</h3>
                        <div className="flex items-start space-x-3 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                            <div className="h-2 w-2 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                            <p className="text-xs text-orange-800 dark:text-orange-300 font-medium leading-relaxed">
                                Upload at least 3 documents to enable advanced knowledge assessment and study gap identification.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
