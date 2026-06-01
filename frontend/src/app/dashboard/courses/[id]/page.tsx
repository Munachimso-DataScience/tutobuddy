'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    Play,
    Trash2,
    Volume2,
    VolumeX,
    Pause,
    Square,
    Sparkles,
    Clipboard,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useStudyHeartbeat } from '@/hooks/useStudyHeartbeat';
import { account, getCachedJWT } from '@/lib/appwrite';
import { API_URL } from '@/lib/api';
import QuizComponent from '@/components/quiz/QuizComponent';

const splitTextIntoChunks = (text: string) => {
    const normalized = text.replace(/\r\n/g, '\n').trim();

    if (!normalized) return [];

    const chunks: string[] = [];
    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
    const sentencePattern = /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g;

    for (const line of lines) {
        if (line.length <= 140) {
            chunks.push(line);
            continue;
        }

        const sentences = line.match(sentencePattern);
        if (sentences && sentences.length > 0) {
            chunks.push(...sentences.map((sentence) => sentence.trim()).filter(Boolean));
        } else {
            chunks.push(line);
        }
    }

    return chunks.length > 0 ? chunks : [normalized];
};

const findChunkIndexFromCharIndex = (charIndex: number, chunks: string[]) => {
    let cursor = 0;

    for (let i = 0; i < chunks.length; i += 1) {
        const end = cursor + chunks[i].length;
        if (charIndex <= end) return i;
        cursor = end + 1;
    }

    return Math.max(chunks.length - 1, 0);
};

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
    const [adaptiveFeedback, setAdaptiveFeedback] = useState<any>(null);
    const [quizType, setQuizType] = useState<'mixed' | 'objective' | 'theory'>('mixed');
    const [quizType, setQuizType] = useState<'mixed' | 'objective' | 'theory'>('mixed');
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [uploadMethod, setUploadMethod] = useState<'file' | 'text'>('file');
    const [pastedContent, setPastedContent] = useState('');
    const [pastedTitle, setPastedTitle] = useState('');
    const [category, setCategory] = useState('Science');

    // TTS States
    const [ttsActive, setTtsActive] = useState(false);
    const [ttsText, setTtsText] = useState('');
    const [ttsTitle, setTtsTitle] = useState('');
    const [ttsPlaying, setTtsPlaying] = useState(false);
    const [ttsSpeed, setTtsSpeed] = useState(1);
    const [ttsProgress, setTtsProgress] = useState(0);
    const [ttsUtterance, setTtsUtterance] = useState<any>(null);
    const [ttsChunks, setTtsChunks] = useState<string[]>([]);
    const [ttsChunkIndex, setTtsChunkIndex] = useState(0);
    const [loadingTTS, setLoadingTTS] = useState<string | null>(null);
    const ttsChunkRefs = useRef<Array<HTMLDivElement | null>>([]);

    // Summary States
    const [summaryActive, setSummaryActive] = useState(false);
    const [summaryText, setSummaryText] = useState('');
    const [summaryTitle, setSummaryTitle] = useState('');
    const [loadingSummary, setLoadingSummary] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined') {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    useEffect(() => {
        if (!ttsActive) return;

        const activeChunk = ttsChunkRefs.current[ttsChunkIndex];
        activeChunk?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [ttsActive, ttsChunkIndex]);

    const playChunks = (chunksToPlay: string[], startIndex: number, speed: number) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        
        chunksToPlay.forEach((chunk, index) => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = speed;
            
            utterance.onstart = () => {
                setTtsChunkIndex(startIndex + index);
                setTtsProgress(Math.floor(((startIndex + index) / (startIndex + chunksToPlay.length)) * 100));
                setTtsPlaying(true);
            };
            
            utterance.onend = () => {
                if (index === chunksToPlay.length - 1) {
                    setTtsPlaying(false);
                    setTtsProgress(100);
                }
            };
            
            utterance.onerror = (e) => {
                if (e.error !== 'canceled' && e.error !== 'interrupted') {
                    console.error("TTS Chunk Error:", e);
                }
            };
            
            window.speechSynthesis.speak(utterance);
        });
    };

    const handleReadAloud = async (materialId: string, title: string) => {
        if (typeof window === 'undefined') return;
        
        const unlockUtterance = new SpeechSynthesisUtterance(' ');
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);

        if (ttsActive) {
            window.speechSynthesis.cancel();
        }
        
        setLoadingTTS(materialId);
        try {
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/materials/${materialId}/text`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            const text = res.data.text;
            if (!text || text.trim().length === 0) {
                toast.error("This resource does not have any speakable text.");
                return;
            }
            
            const chunks = splitTextIntoChunks(text);
            const spokenText = chunks.join(' ');

            ttsChunkRefs.current = [];
            setTtsText(spokenText);
            setTtsChunks(chunks);
            setTtsChunkIndex(0);
            setTtsTitle(title);
            setTtsActive(true);
            setTtsProgress(0);
            
            playChunks(chunks, 0, ttsSpeed);
            
        } catch (error) {
            console.error("TTS failed:", error);
            toast.error("Failed to load text for audio playback.");
        } finally {
            setLoadingTTS(null);
        }
    };

    const handleTtsPlayPause = () => {
        if (typeof window === 'undefined') return;
        
        if (ttsPlaying) {
            window.speechSynthesis.pause();
            setTtsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                const remainingChunks = ttsChunks.slice(ttsChunkIndex);
                if (remainingChunks.length > 0) {
                    playChunks(remainingChunks, ttsChunkIndex, ttsSpeed);
                }
            }
            setTtsPlaying(true);
        }
    };

    const handleTtsStop = () => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        setTtsPlaying(false);
        setTtsActive(false);
        setTtsUtterance(null);
        setTtsProgress(0);
        setTtsChunkIndex(0);
        setTtsChunks([]);
        ttsChunkRefs.current = [];
    };

    const handleTtsSpeedChange = (speed: number) => {
        setTtsSpeed(speed);
        if (typeof window === 'undefined') return;
        
        if (ttsActive) {
            const remainingChunks = ttsChunks.slice(ttsChunkIndex);
            if (remainingChunks.length > 0) {
                playChunks(remainingChunks, ttsChunkIndex, speed);
            }
        }
    };

    const handleSummarize = async (materialId: string, title: string) => {
        setLoadingSummary(materialId);
        try {
            const jwt = await getCachedJWT();
            const res = await axios.post(`${API_URL}/api/materials/${materialId}/summarize`, {}, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setSummaryText(res.data.summary);
            setSummaryTitle(title);
            setSummaryActive(true);
        } catch (error) {
            console.error("Summarization failed:", error);
            toast.error("Failed to generate notes summary.");
        } finally {
            setLoadingSummary(null);
        }
    };

    const renderMarkdown = (md: string) => {
        let html = md;
        html = html.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h4>');
        html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-black text-blue-600 mt-5 mb-3">$1</h3>');
        html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-extrabold text-gray-900 dark:text-white mt-6 mb-4">$2</h2>');
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-extrabold text-blue-600 dark:text-blue-400">$1</strong>');
        html = html.replace(/^\s*-\s*(.*$)/gim, '<li class="ml-4 list-disc text-sm text-gray-700 dark:text-gray-300 mb-1">$1</li>');
        html = html.replace(/^(?!<h|<li|<ul|<ol)(.*$)/gim, '<p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">$1</p>');
        return html;
    };

    const categories = ["Science", "Arts", "Engineering", "Medicine", "Business", "Law", "Others"];

    const router = useRouter();

    useEffect(() => {
        if (courseId) {
            fetchMaterials();
        }
    }, [courseId]);

    const fetchMaterials = async () => {
        try {
            const jwt = await getCachedJWT();
            const response = await axios.get(`${API_URL}/api/materials/${courseId}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMaterial = async (e: React.MouseEvent, materialId: string) => {
        e.stopPropagation(); // Prevent trigger group hover/click
        if (!confirm('Are you sure you want to delete this resource? Any associated quizzes will remain in your records but the source file will be removed.')) return;
        
        try {
            const jwt = await getCachedJWT();
            await axios.delete(`${API_URL}/api/materials/${materialId}`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success('Resource deleted successfully');
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete resource');
        }
    };

    const handleGenerateQuiz = async (materialId: string) => {
        setGeneratingQuiz(true);
        try {
            const jwt = await getCachedJWT();
            const storedPerformanceRaw = typeof window !== 'undefined' ? localStorage.getItem(`tutorbuddy-quiz-performance:${materialId}`) : null;
            let adaptiveScore: number | null = null;
            if (storedPerformanceRaw) {
                try {
                    const parsed = JSON.parse(storedPerformanceRaw);
                    if (typeof parsed?.score === 'number') {
                        adaptiveScore = parsed.score;
                    }
                } catch {
                    adaptiveScore = null;
                }
            }

            const response = await axios.post(`${API_URL}/api/quizzes/generate`, {
                materialId,
                adaptiveScore,
                quizType
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            
            const quizContent = JSON.parse(response.data.content);
            setCurrentQuiz({
                ...quizContent,
                quizId: response.data.$id
            });
            setCurrentMaterialId(materialId);
            setAdaptiveFeedback(null);
            setIsQuizOpen(true);
            toast.success('AI Quiz prepared successfully!');
        } catch (error: any) {
            const errorData = error.response?.data;
            const errorMessage = errorData?.message || errorData?.error || error.message || 'Failed to generate quiz. Try again.';
            toast.error(errorMessage);
            console.error('Quiz Generation Error Details:', errorData || error);
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
            const jwt = await getCachedJWT();
            await axios.post(`${API_URL}/api/materials/upload`, formData, {
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

    const handleTextSubmit = async () => {
        if (!pastedContent || !pastedTitle) {
            toast.warning('Please provide both a title and some content');
            return;
        }

        setUploading(true);
        try {
            const jwt = await getCachedJWT();
            await axios.post(`${API_URL}/api/materials/upload`, {
                courseId,
                title: pastedTitle,
                content: pastedContent,
                category
            }, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            toast.success('Notes saved and processed!');
            setPastedContent('');
            setPastedTitle('');
            fetchMaterials();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save notes');
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
                        adaptiveFeedback={adaptiveFeedback}
                        onComplete={async (score) => {
                            console.log('Quiz complete, score:', score);
                            try {
                                if (currentQuiz?.quizId) {
                                    const jwt = await getCachedJWT();
                                    const response = await axios.patch(`${API_URL}/api/quizzes/${currentQuiz.quizId}/score`, {
                                        score
                                    }, {
                                        headers: { Authorization: `Bearer ${jwt}` }
                                    });
                                    setAdaptiveFeedback(response.data?.adaptiveFeedback || null);
                                }
                            } catch (error) {
                                console.error('Failed to save quiz score for adaptive learning:', error);
                            }
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
                    aria-label="Go back"
                    title="Go back"
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold">Study Resources</h2>
                                <span className="text-sm text-gray-400 font-medium block mt-1">{materials.length} files</span>
                            </div>
                            <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quiz Preference</span>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setQuizType('mixed')}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${quizType === 'mixed' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Mixed
                                    </button>
                                    <button 
                                        onClick={() => setQuizType('objective')}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${quizType === 'objective' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Objective
                                    </button>
                                    <button 
                                        onClick={() => setQuizType('theory')}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${quizType === 'theory' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                    >
                                        Theory
                                    </button>
                                </div>
                            </div>
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
                                        className="flex flex-col gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-center space-x-4 min-w-0">
                                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors break-words">
                                                    {file.title}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Added {new Date(file.uploaded_at || file.$createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:shrink-0">
                                            <button 
                                                onClick={() => handleGenerateQuiz(file.$id)}
                                                disabled={generatingQuiz}
                                                className="inline-flex items-center text-[10px] bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                {generatingQuiz ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1 fill-current" />}
                                                Start Quiz
                                            </button>
                                            <button 
                                                onClick={() => handleSummarize(file.$id, file.title)}
                                                disabled={loadingSummary !== null}
                                                className="inline-flex items-center text-[10px] bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                {loadingSummary === file.$id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                                Summarize
                                            </button>
                                            <button 
                                                onClick={() => handleReadAloud(file.$id, file.title)}
                                                disabled={loadingTTS !== null}
                                                className="inline-flex items-center text-[10px] bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                                            >
                                                {loadingTTS === file.$id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                                                Read Aloud
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteMaterial(e, file.$id)}
                                                aria-label="Delete resource"
                                                title="Delete resource"
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button 
                                                aria-label="More options"
                                                title="More options"
                                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
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

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold">Add Material</h3>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button 
                                    onClick={() => setUploadMethod('file')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${uploadMethod === 'file' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                                >
                                    File
                                </button>
                                <button 
                                    onClick={() => setUploadMethod('text')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${uploadMethod === 'text' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'}`}
                                >
                                    Text
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Topic Category</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    aria-label="Topic Category"
                                    title="Topic Category"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {uploadMethod === 'file' ? (
                                <label className={`
                                    flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl p-8 cursor-pointer transition-all
                                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                                    ${uploading ? 'pointer-events-none opacity-50' : ''}
                                `}>
                                    {uploading ? (
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 mb-4 stroke-[1.5] text-blue-600" />
                                            <span className="text-sm font-bold text-gray-600">Drop PDF or browse</span>
                                            <span className="text-[10px] mt-2 text-gray-400 font-bold uppercase tracking-widest">Max 10MB</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    <input 
                                        type="text"
                                        placeholder="Note Title (e.g. Week 1 Lecture)"
                                        value={pastedTitle}
                                        onChange={(e) => setPastedTitle(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium px-4 py-2.5"
                                    />
                                    <textarea 
                                        rows={5}
                                        placeholder="Paste your lecture notes here..."
                                        value={pastedContent}
                                        onChange={(e) => setPastedContent(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-medium px-4 py-2.5"
                                    />
                                    <button 
                                        onClick={handleTextSubmit}
                                        disabled={uploading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-500/20"
                                    >
                                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Notes"}
                                    </button>
                                </div>
                            )}
                        </div>
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

            {/* ======================================================== */}
            {/* TEXT-TO-SPEECH PLAYER DRAWER */}
            {/* ======================================================== */}
            <AnimatePresence>
                {ttsActive && (
                    <motion.div 
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 shadow-2xl p-6 px-8 rounded-t-3xl max-w-6xl mx-auto flex flex-col gap-5 max-h-[80vh] overflow-hidden"
                    >
                        <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title & Info */}
                            <div className="flex items-center space-x-4 min-w-0">
                                <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 animate-pulse shrink-0">
                                    <Volume2 className="h-6 w-6" />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">NOW READING</span>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs">{ttsTitle}</h4>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800/40">
                                    <span className="text-[9px] font-bold text-gray-400 px-2">SPEED</span>
                                    {[1, 1.25, 1.5, 2].map((s) => (
                                        <button 
                                            key={s}
                                            onClick={() => handleTtsSpeedChange(s)}
                                            className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${ttsSpeed === s ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                        >
                                            {s}x
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={handleTtsPlayPause}
                                        aria-label={ttsPlaying ? "Pause text-to-speech" : "Play text-to-speech"}
                                        title={ttsPlaying ? "Pause text-to-speech" : "Play text-to-speech"}
                                        className="h-10 w-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-md shadow-emerald-500/20"
                                    >
                                        {ttsPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                                    </button>
                                    <button 
                                        onClick={handleTtsStop}
                                        aria-label="Stop playback"
                                        title="Stop playback"
                                        className="h-10 w-10 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 rounded-full flex items-center justify-center hover:scale-105 transition-all"
                                    >
                                        <Square className="h-4 w-4 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                            <div className="rounded-2xl border border-emerald-100/70 dark:border-emerald-900/30 bg-emerald-50/70 dark:bg-emerald-950/15 p-4">
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">FOLLOW ALONG</span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Highlighted text follows the current spoken chunk.
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {ttsChunks.length > 0 ? `${ttsChunkIndex + 1}/${ttsChunks.length}` : '0/0'}
                                    </span>
                                </div>
                                <div className="max-h-52 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                    {ttsChunks.length > 0 ? (
                                        ttsChunks.map((chunk, index) => (
                                            <div
                                                key={`${ttsTitle}-${index}`}
                                                ref={(el) => {
                                                    ttsChunkRefs.current[index] = el;
                                                }}
                                                className={`rounded-xl px-3 py-2 text-sm leading-6 transition-all ${
                                                    index === ttsChunkIndex
                                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300/60'
                                                        : 'bg-white/80 dark:bg-gray-900/70 text-gray-700 dark:text-gray-300 border border-transparent'
                                                }`}
                                            >
                                                {chunk}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-900/40 bg-white/60 dark:bg-gray-900/40 p-4 text-sm text-gray-500">
                                            No readable text is currently available for follow-along view.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full flex flex-col space-y-1 rounded-2xl border border-gray-100 dark:border-gray-800/40 bg-gray-50/80 dark:bg-gray-800/40 p-4">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                                    <span>PROGRESS</span>
                                    <span>{ttsProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <style>{`.tts-progress-fill { width: ${ttsProgress}% }`}</style>
                                    <div className="h-full bg-emerald-500 transition-all duration-300 tts-progress-fill" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ======================================================== */}
            {/* AI SUMMARIZER MODAL */}
            {/* ======================================================== */}
            <AnimatePresence>
                {summaryActive && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh]"
                        >
                            {/* Modal Header */}
                            <div className="relative p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4 pr-16 sm:pr-6 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/10 dark:to-blue-950/10">
                                <div className="flex items-center space-x-3 min-w-0">
                                    <div className="h-10 w-10 bg-purple-100 dark:bg-purple-950/30 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block">AI-GENERATED SUMMARY</span>
                                        <h3 className="text-md font-bold text-gray-900 dark:text-white truncate max-w-sm">{summaryTitle}</h3>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSummaryActive(false)}
                                    aria-label="Close modal"
                                    title="Close modal"
                                    className="absolute right-4 top-4 sm:static h-8 w-8 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full flex items-center justify-center transition-all shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-8 overflow-y-auto space-y-4 max-h-[60vh] custom-scrollbar">
                                <div 
                                    className="space-y-4"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(summaryText) }}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(summaryText);
                                        toast.success("Summary copied to clipboard!");
                                    }}
                                    className="flex items-center text-xs font-bold text-gray-500 hover:text-purple-600 transition-colors"
                                >
                                    <Clipboard className="h-4 w-4 mr-2" />
                                    Copy Summary
                                </button>
                                <button 
                                    onClick={() => {
                                        setSummaryActive(false);
                                        if (typeof window !== 'undefined') {
                                            window.speechSynthesis.cancel();
                                            
                                            // Clean markdown symbols for natural vocalization
                                            const cleanText = summaryText
                                                .replace(/[#*`_~]/g, '')
                                                .replace(/-\s+/g, '')
                                                .trim();
                                            const chunks = splitTextIntoChunks(cleanText);
                                            
                                            ttsChunkRefs.current = [];
                                            setTtsText(cleanText);
                                            setTtsChunks(chunks);
                                            setTtsChunkIndex(0);
                                            setTtsTitle(`Summary of ${summaryTitle}`);
                                            setTtsActive(true);
                                            setTtsProgress(0);
                                            
                                            const utterance = new SpeechSynthesisUtterance(cleanText);
                                            utterance.rate = ttsSpeed;
                                            
                                            utterance.onboundary = (event) => {
                                                const charIndex = typeof event.charIndex === 'number' ? event.charIndex : 0;
                                                setTtsProgress(Math.floor((charIndex / cleanText.length) * 100));
                                                setTtsChunkIndex(findChunkIndexFromCharIndex(charIndex, chunks));
                                            };
                                            
                                            utterance.onend = () => {
                                                setTtsPlaying(false);
                                                setTtsProgress(100);
                                                setTtsChunkIndex(Math.max(chunks.length - 1, 0));
                                            };
                                            
                                            utterance.onerror = () => {
                                                setTtsPlaying(false);
                                            };
                                            
                                            setTtsUtterance(utterance);
                                            setTtsPlaying(true);
                                            window.speechSynthesis.speak(utterance);
                                        }
                                    }}
                                    className="flex items-center text-xs bg-purple-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-md shadow-purple-500/10"
                                >
                                    <Volume2 className="h-4 w-4 mr-2" />
                                    Listen to Summary
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
