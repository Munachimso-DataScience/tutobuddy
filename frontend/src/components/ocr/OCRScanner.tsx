'use client';

import React, { useState } from 'react';
import { Camera, Upload, Loader2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function OCRScanner() {
    const [scannedText, setScannedText] = useState<string>('');
    const [evaluation, setEvaluation] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Call AI service directly or through backend
            const response = await axios.post('http://localhost:8000/ocr-evaluate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setScannedText(response.data.text);
            setEvaluation(response.data.evaluation);
            toast.success('Notes processed successfully!');
        } catch (error) {
            toast.error('Failed to process handwritten notes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Handwritten Note Scan</h2>
                    <p className="text-gray-500 text-sm mt-1">Convert your physical notes into digital insights.</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                    <Camera className="h-6 w-6" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <label className={`
                        relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-12 cursor-pointer transition-all
                        hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-blue-500
                        ${loading ? 'pointer-events-none opacity-50' : ''}
                    `}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-h-64 rounded-xl shadow-lg mb-4" />
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
                                "{evaluation.feedback}"
                            </p>
                        </motion.div>
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
                                <AlertTriangle className="h-8 w-8 text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400">Scan a note to see digital output here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
