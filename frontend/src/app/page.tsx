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
  ShieldCheck,
  Zap,
  Flame,
  Link2
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
            Study Companion
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
            Study <span className="text-indigo-600"> Smarter</span>,<br />Learn Deeper.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Your intelligent study companion that generates personalized quizzes, tracks your progress, and adapts to how you learn — built for Nigerian university students. TutorBuddy is your personal growth partner.
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BrainCircuit className="w-8 h-8" />,
                title: "AI Question Generation",
                desc: "Upload your lecture notes and get MCQs and short-answer questions generated instantly using NLP keyword extraction.",
                color: "bg-blue-600"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Adaptive Difficulty",
                desc: "Score above 75%? Get harder questions. Below 50%? Get revision prompts and easier tasks. Personalized to your performance.",
                color: "bg-amber-500"
              },
              {
                icon: <ScanLine className="w-8 h-8" />,
                title: "Handwritten Note OCR",
                desc: "Scan your handwritten notes, get them assessed using semantic similarity scoring and keyword matching.",
                color: "bg-indigo-600"
              },
              {
                icon: <Flame className="w-8 h-8" />,
                title: "Study Streaks",
                desc: "Daily login streaks and session tracking keep you motivated. Weekly email summaries highlight your weak areas.",
                color: "bg-orange-600"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Deep Analytics",
                desc: "Topic-wise performance charts, exam readiness scores, and improvement trends — see exactly where to focus.",
                color: "bg-violet-600"
              },
              {
                icon: <Link2 className="w-8 h-8" />,
                title: "Smart Resources",
                desc: "Wrong answers automatically surface YouTube tutorials, Khan Academy articles, and curated links to help you understand.",
                color: "bg-emerald-600"
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

      {/* Smart Learning Flow */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-linear-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-blue-500/10 to-transparent pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  Intelligent Remediation
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Never get stuck on a <span className="text-blue-400">wrong answer</span> again.
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  TutorBuddy doesn't just tell you that you're wrong. Our AI analyzes your mistakes and instantly surfaces:
                </p>

                <ul className="space-y-4">
                  {[
                    "Direct links to relevant YouTube timestamps",
                    "Khan Academy targeted practice articles",
                    "Curated academic PDF summaries",
                    "AI-generated 'Simplified Concept' notes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                      <div className="h-2 w-2 bg-blue-400 rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-500/20 rounded-4xl blur-2xl group-hover:bg-blue-500/30 transition-all" />
                <div className="bg-slate-800/80 backdrop-blur-xl rounded-4xl border border-white/10 p-6 relative">
                  {/* Mock Smart Resource Card */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">X</div>
                      <span className="text-red-400 text-sm font-bold">Mistake in Thermodynamics Quiz</span>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-3">
                      <div className="h-3 w-1/2 bg-slate-700 rounded-full" />
                      <div className="h-3 w-3/4 bg-slate-700 rounded-full opacity-50" />

                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-3">Recommended for you:</p>
                        <div className="flex items-center gap-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="h-10 w-14 bg-slate-800 rounded flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Entropy Explained</p>
                            <p className="text-[10px] text-blue-400">Khan Academy • 8 min read</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
