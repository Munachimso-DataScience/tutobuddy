'use client';

import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-6 py-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-black tracking-tight">About TutorBuddy</h1>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          TutorBuddy is an AI-powered study companion that helps students generate quizzes,
          review weak topics, and stay consistent with learning activities.
        </p>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold">What you can do</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
            <li>Upload course material and generate MCQs + essay questions</li>
            <li>Receive simplified explanations for incorrect answers</li>
            <li>Track performance and focus on areas that need improvement</li>
          </ul>
        </div>

        <div className="pt-6 text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} TutorBuddy. All rights reserved.
        </div>
      </div>
    </div>
  );
}

