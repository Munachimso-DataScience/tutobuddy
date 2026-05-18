'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Camera, FileText, ScanLine, ShieldCheck, Sparkles } from 'lucide-react';
import OCRScanner from '@/components/ocr/OCRScanner';

export default function OCRPage() {
    return (
        <div className="space-y-8 pb-10">
            <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 dark:border-blue-900/30 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-8 md:px-10 md:py-12 shadow-xl">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-cyan-400 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-blue-500 blur-3xl" />
                </div>
                <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
                    <div className="space-y-5">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
                            <ScanLine className="h-4 w-4" />
                            OCR Studio
                        </div>
                        <div className="space-y-4 max-w-2xl">
                            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                                Turn handwritten notes into searchable study material.
                            </h1>
                            <p className="max-w-xl text-sm md:text-base leading-7 text-slate-200">
                                Upload a photo of your notes, let OCR extract the text, and use the result to revise faster, build quizzes, or clean up messy pages.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="#ocr-scanner"
                                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                            >
                                Start scanning
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/dashboard/courses"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/15"
                            >
                                <BookOpen className="h-4 w-4" />
                                Use in courses
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                        {[
                            { icon: Camera, title: 'Fast capture', text: 'Snap a page with your phone or upload a screenshot.' },
                            { icon: Sparkles, title: 'Instant cleanup', text: 'Get text output you can copy, review, or reuse.' },
                            { icon: ShieldCheck, title: 'Private workflow', text: 'Keep the flow inside your study dashboard.' },
                        ].map((item) => (
                            <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-white">
                                <div className="mt-0.5 rounded-xl bg-white/15 p-2">
                                    <item.icon className="h-4 w-4 text-cyan-100" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold">{item.title}</h2>
                                    <p className="mt-1 text-xs leading-5 text-slate-200">{item.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div id="ocr-scanner">
                    <OCRScanner />
                </div>

                <aside className="space-y-6">
                    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">What works best</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            OCR performs better when the image is clear, bright, and cropped tightly around the notes.
                        </p>
                        <div className="mt-5 space-y-3">
                            {[
                                'JPG, PNG, or other image uploads',
                                'Clear handwriting with good lighting',
                                'One page at a time for the cleanest result',
                                'Useful for summaries, quizzes, and revision'
                            ].map((tip) => (
                                <div key={tip} className="flex items-start gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-3">
                                    <FileText className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-blue-100 dark:border-blue-900/20 bg-blue-50 dark:bg-blue-900/10 p-6">
                        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-300">Next step after OCR</h2>
                        <p className="mt-2 text-sm leading-6 text-blue-800/80 dark:text-blue-200/80">
                            Use the extracted text to create study notes, summarize a chapter, or feed the content into quizzes and revision tasks.
                        </p>
                        <Link
                            href="/dashboard/courses"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-700"
                        >
                            Go to courses
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </aside>
            </section>
        </div>
    );
}
