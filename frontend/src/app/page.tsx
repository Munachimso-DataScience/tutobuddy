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
    <div className="min-h-screen bg-linear-to-br from-primary/12 via-background to-secondary/12 text-foreground selection:bg-secondary/20 overflow-x-hidden">
      {/* Navbar */}
<nav className="fixed top-0 w-full z-50 bg-surface/70 dark:bg-surface-2/70 backdrop-blur-xl border-b border-primary/10 dark:border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between gap-4">


          <Link href="/" className="flex items-center gap-4 group">
            <div className="p-2.5 theme-accent-gradient rounded-xl shadow-lg shadow-secondary/20 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-blue-600">
              TutorBuddy
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-12 mr-8">
            <Link href="/about" className="text-sm font-bold text-foreground/60 hover:text-secondary transition-colors">About</Link>
          </div>


          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-black text-foreground/70 dark:text-cream/70 hover:text-secondary transition-all">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 bg-secondary hover:bg-accent text-white rounded-2xl text-sm font-black shadow-xl shadow-secondary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Join Free
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-linear-to-b from-secondary/10 to-transparent pointer-events-none" />
        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-cream rounded-full text-xs font-bold mb-8 uppercase tracking-widest border border-primary/20 dark:border-primary/30">
            <Sparkles className="w-3.5 h-3.5" />
            Study Companion
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
            Study <span className="text-secondary"> Smarter</span>,<br />Learn Deeper.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-foreground/65 dark:text-cream/70 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Your intelligent study companion that generates personalized quizzes, tracks your progress, and adapts to how you learn — built for Nigerian university students.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-10 py-4 bg-secondary hover:bg-accent text-white rounded-2xl font-bold shadow-2xl shadow-secondary/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              Get Started for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 bg-surface dark:bg-surface-2 hover:bg-cream dark:hover:bg-background border border-primary/10 dark:border-primary/20 rounded-2xl font-bold transition-all"
            >
              View Demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface/80 dark:bg-surface-2/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4 text-foreground dark:text-cream">Powerful Features</h2>
            <p className="text-foreground/60 dark:text-cream/60 font-medium tracking-wide">Everything you need to excel in your studies</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BrainCircuit className="w-8 h-8" />,
                title: "AI Question Generation",
                desc: "Upload your lecture notes and get MCQs and short-answer questions generated instantly using NLP keyword extraction.",
                color: "bg-primary"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Adaptive Difficulty",
                desc: "Score above 75%? Get harder questions. Below 50%? Get revision prompts and easier tasks. Personalized to your performance.",
                color: "bg-secondary"
              },
              {
                icon: <ScanLine className="w-8 h-8" />,
                title: "Handwritten Note OCR",
                desc: "Scan your handwritten notes, get them assessed using semantic similarity scoring and keyword matching.",
                color: "bg-denim"
              },
              {
                icon: <Flame className="w-8 h-8" />,
                title: "Study Streaks",
                desc: "Daily login streaks and session tracking keep you motivated. Weekly email summaries highlight your weak areas.",
                color: "bg-accent"
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Deep Analytics",
                desc: "Topic-wise performance charts, exam readiness scores, and improvement trends — see exactly where to focus.",
                color: "bg-denim"
              },
              {
                icon: <Link2 className="w-8 h-8" />,
                title: "Smart Resources",
                desc: "Wrong answers automatically surface YouTube tutorials, Khan Academy articles, and curated links to help you understand.",
                color: "bg-primary"
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl bg-surface/90 dark:bg-surface-2/60 border border-primary/10 dark:border-primary/20 transition-all group"
              >
                <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-secondary/10 mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-foreground/60 dark:text-cream/60 leading-relaxed font-medium">
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
          <div className="bg-linear-to-br from-primary via-[#0f5a35] to-[#f6c48f] rounded-[3rem] p-8 md:p-16 relative overflow-hidden border border-primary/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_18%_76%,rgba(241,90,36,0.14),transparent_20%)] pointer-events-none" />
            <div className="absolute top-0 right-0 w-1/3 h-full bg-linear-to-l from-secondary/30 via-secondary/12 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-[6%] w-1/5 rotate-[-10deg] bg-linear-to-l from-transparent via-[#ffb36b]/35 to-transparent blur-2xl pointer-events-none" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 bg-secondary/20 text-cream rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                  Intelligent Remediation
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Never get stuck on a <span className="text-secondary">wrong answer</span> again.
                </h2>
                <p className="text-cream/80 text-lg mb-8 leading-relaxed">
                  TutorBuddy doesn&apos;t just tell you that you&apos;re wrong. Our AI analyzes your mistakes and instantly surfaces:
                </p>

                <ul className="space-y-4">
                  {[
                    "Direct links to relevant YouTube timestamps",
                    "Khan Academy targeted practice articles",
                    "Curated academic PDF summaries",
                    "AI-generated 'Simplified Concept' notes"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-cream/80 font-medium">
                      <div className="h-2 w-2 bg-secondary rounded-full" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-secondary/20 rounded-4xl blur-2xl group-hover:bg-secondary/30 transition-all" />
                <div className="bg-surface-2/80 backdrop-blur-xl rounded-4xl border border-primary/10 p-6 relative">
                  {/* Mock Smart Resource Card */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/10 border border-secondary/20 rounded-xl">
                      <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-white text-[10px] font-bold">X</div>
                      <span className="text-secondary text-sm font-bold">Mistake in Thermodynamics Quiz</span>
                    </div>

                    <div className="p-4 bg-background/30 rounded-xl border border-primary/10 space-y-3">
                      <div className="h-3 w-1/2 bg-cream/20 rounded-full" />
                      <div className="h-3 w-3/4 bg-cream/15 rounded-full opacity-50" />

                      <div className="pt-4 border-t border-primary/10">
                        <p className="text-xs text-cream/70 font-bold uppercase mb-3">Recommended for you:</p>
                        <div className="flex items-center gap-3 p-2 bg-secondary/10 border border-secondary/20 rounded-lg">
                          <div className="h-10 w-14 bg-background/30 rounded flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Entropy Explained</p>
                            <p className="text-[10px] text-cream/80">Khan Academy • 8 min read</p>
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
            <div key={idx} className="text-center p-6 bg-surface/90 dark:bg-surface-2/60 rounded-3xl border border-primary/10 dark:border-primary/20 shadow-sm">
              <div className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary dark:text-cream mb-4">
                {stat.icon}
              </div>
              <div className="text-3xl font-black mb-1">{stat.value}</div>
              <div className="text-sm text-foreground/55 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-primary/10 dark:border-primary/20 text-center">
        <p className="text-sm text-foreground/60 dark:text-cream/60 font-medium">
          © {year} TutorBuddy System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
