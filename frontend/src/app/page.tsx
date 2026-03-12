'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  BrainCircuit, 
  BarChart3, 
  Sparkles, 
  ChevronRight, 
  ScanLine, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

export default function Home() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-br from-indigo-600 to-blue-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-blue-600">
              TutorBuddy
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-semibold hover:text-indigo-600 transition-colors">
              Log in
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <motion.div 
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold mb-8 uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Next-Gen Study Companion
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
            Study <span className="text-indigo-600">Smarter</span>,<br />Not Harder.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Propel your learning with AI-driven quizzes, OCR handwriting evaluation, and deep performance analytics. TutorBuddy is your personal growth partner.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Get Started for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold transition-all"
            >
              View Demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Powerful Features</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Everything you need to excel in your studies</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BrainCircuit className="w-8 h-8" />,
                title: "Custom AI Quizzes",
                desc: "Upload notes or PDFs, and our AI constructs targeted MCQs and short answers instantly.",
                color: "bg-blue-600"
              },
              {
                icon: <ScanLine className="w-8 h-8" />,
                title: "OCR Evaluation",
                desc: "Snap a photo of your handwritten notes for instant analysis and concept reinforcement.",
                color: "bg-indigo-600"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Deep Analytics",
                desc: "Visualize your strengths and weaknesses with detailed performance dashboards.",
                color: "bg-violet-600"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all group"
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/10 mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Active Students", value: "10k+", icon: <BookOpen className="w-5 h-5" /> },
            { label: "Study Streaks", value: "450k+", icon: <Clock className="w-5 h-5" /> },
            { label: "AI Quizzes", value: "2M+", icon: <BrainCircuit className="w-5 h-5" /> },
            { label: "Exam Readiness", value: "98%", icon: <ShieldCheck className="w-5 h-5" /> }
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          © {year} TutorBuddy System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
