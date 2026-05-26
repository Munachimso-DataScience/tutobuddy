'use client';

import React, { useState } from 'react';
import { Camera, Upload, Loader2, FileText, CheckCircle, RotateCcw, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { toast } from 'react-toastify';

type OCREvaluation = {
    word_count: number;
    readability: string;
    feedback: string;
};

export default function OCRScanner() {
    const [scannedText, setScannedText] = useState<string>('');
    const [evaluation, setEvaluation] = useState<OCREvaluation | null>(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    const resetScan = () => {
        setScannedText('');
        setEvaluation(null);
        setImagePreview(null);
        setFileName('');
        setError('');
    };

    const processFile = async (file: File) => {
        setError('');

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('File is too large. Please use an image smaller than 10MB.');
            toast.error('Image must be smaller than 10MB');
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/api/ocr/evaluate`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const extractedText = (response.data?.text ?? '').trim();
            const evaluation = response.data?.evaluation ?? null;

            setScannedText(extractedText);
            setEvaluation(evaluation);

            if (extractedText) {
                setError('');
                toast.success('Notes processed successfully!');
            } else {
                const feedback = evaluation?.feedback || 'OCR completed, but no readable text was extracted.';
                setError(feedback);
                toast.warn('OCR completed, but no readable text was extracted');
            }
        } catch {
            setError('Failed to process handwritten notes. Please try another image.');
            toast.error('Failed to process handwritten notes');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Handwritten Note Scan</h2>
                    <p className="text-gray-500 text-sm mt-1">Convert your physical notes into digital insights.</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Camera className="h-6 w-6" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (!loading) setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={async (e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (loading) return;
                            const droppedFile = e.dataTransfer.files?.[0];
                            if (droppedFile) {
                                await processFile(droppedFile);
                            }
                        }}
                        className={`
                        relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-10 md:p-12 cursor-pointer transition-all
                        hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-500
                        ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'}
                        ${loading ? 'pointer-events-none opacity-50' : ''}
                    `}
                    >
                        {imagePreview ? (
                            <div className="w-full">
                                <Image src={imagePreview} alt="Preview" width={800} height={600} unoptimized className="max-h-64 w-full object-contain rounded-xl shadow-lg mb-4 bg-white" />
                                <p className="text-xs font-semibold text-gray-500 text-center truncate">{fileName}</p>
                            </div>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-gray-400 mb-4" />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center">
                                    Drop handwritten notes or click to browse
                                </span>
                                <span className="text-xs text-gray-400 mt-2">Supports JPG, PNG</span>
                            </>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-black/80 flex flex-col items-center justify-center rounded-3xl">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Processing OCR...</span>
                            </div>
                        )}
                    </label>

                    {error && (
                        <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {evaluation && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20"
                        >
                            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-400 flex items-center mb-4">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                AI Evaluation Results
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Word Count</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{evaluation.word_count}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Readability</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{evaluation.readability}</p>
                                </div>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-4 leading-relaxed italic">
                                &ldquo;{evaluation.feedback}&rdquo;
                            </p>
                        </motion.div>
                    )}

                    {(scannedText || imagePreview) && (
                        <button
                            type="button"
                            onClick={resetScan}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset scan
                        </button>
                    )}
                </div>

                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Extracted Digital Content
                        </h3>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 overflow-auto max-h-[400px]">
                        {scannedText ? (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {scannedText}
                            </p>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <ScanLine className="h-8 w-8 text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">Scan a note to see digital output here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
