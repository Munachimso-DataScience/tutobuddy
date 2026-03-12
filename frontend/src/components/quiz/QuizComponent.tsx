'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';
import axios from 'axios';

interface Question {
    type: 'mcq' | 'short' | 'essay';
    question: string;
    options?: string[];
    answer?: string;
    explanation?: string;
    rubric?: string;
}

interface QuizProps {
    questions: Question[];
    onComplete: (score: number) => void;
}

export default function QuizComponent({ questions, onComplete }: QuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [showExplanation, setShowExplanation] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const currentQuestion = questions[currentIndex];

    const [loadingAI, setLoadingAI] = useState(false);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);

    const handleAnswer = async (answer: string) => {
        setAnswers({ ...answers, [currentIndex]: answer });
        
        if (currentQuestion.type === 'mcq' && answer !== currentQuestion.answer) {
            setLoadingAI(true);
            try {
                const token = localStorage.getItem('appwrite_session');
                const res = await axios.post('http://localhost:5000/api/feedback/explain', {
                    question: currentQuestion.question,
                    userAnswer: answer,
                    correctAnswer: currentQuestion.answer,
                    context: currentQuestion.explanation // Use static explanation as context for AI
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAiFeedback(res.data.explanation);
            } catch (error) {
                console.error('Failed to get AI explanation');
            } finally {
                setLoadingAI(false);
            }
        }
        setShowExplanation(true);
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowExplanation(false);
            setAiFeedback(null);
        } else {
            setIsFinished(true);
            // Calculate score for MCQs
            const score = questions.reduce((acc, q, idx) => {
                if (q.type === 'mcq' && answers[idx] === q.answer) return acc + 1;
                return acc;
            }, 0);
            onComplete(score);
        }
    };

    if (isFinished) {
        return (
            <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
                <div className="inline-flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/20 rounded-full mb-6 text-green-600">
                    <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quiz Completed!</h2>
                <p className="text-gray-500 mb-8 font-medium">Your understanding has been evaluated by our AI.</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                >
                    Back to Course
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">Question {currentIndex + 1} of {questions.length}</span>
                </div>
                <div className="flex-1 mx-6 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                        className="h-full bg-blue-600"
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800"
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
                        {currentQuestion.question}
                    </h3>

                    {currentQuestion.type === 'mcq' && (
                        <div className="grid gap-4">
                            {currentQuestion.options?.map((option, idx) => (
                                <button
                                    key={idx}
                                    disabled={showExplanation}
                                    onClick={() => handleAnswer(option)}
                                    className={`p-4 rounded-2xl text-left font-semibold transition-all border-2 flex items-center justify-between ${
                                        showExplanation
                                            ? option === currentQuestion.answer
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                : answers[currentIndex] === option
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : 'border-gray-100 dark:border-gray-800 text-gray-400'
                                            : 'border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <span>{option}</span>
                                    {showExplanation && option === currentQuestion.answer && <CheckCircle2 className="h-5 w-5" />}
                                    {showExplanation && answers[currentIndex] === option && option !== currentQuestion.answer && <AlertCircle className="h-5 w-5" />}
                                </button>
                            ))}
                        </div>
                    )}

                    {currentQuestion.type === 'short' && (
                        <div className="space-y-4">
                            <input 
                                type="text"
                                placeholder="Type your answer here..."
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 outline-none font-medium transition-all"
                                onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                            />
                            {!showExplanation && (
                                <button 
                                    onClick={() => setShowExplanation(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                                >
                                    Submit Answer
                                </button>
                            )}
                        </div>
                    )}

                    {currentQuestion.type === 'essay' && (
                        <div className="space-y-4">
                            <textarea 
                                rows={6}
                                placeholder="Explain your perspective..."
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 outline-none font-medium transition-all"
                                onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                            />
                            {!showExplanation && (
                                <button 
                                    onClick={() => setShowExplanation(true)}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                                >
                                    Submit Essay
                                </button>
                            )}
                        </div>
                    )}

                    {showExplanation && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30"
                        >
                            <div className="flex items-center text-blue-800 dark:text-blue-400 font-bold mb-2">
                                <HelpCircle className="h-4 w-4 mr-2" />
                                {loadingAI ? 'AI is thinking...' : 'Explanation'}
                            </div>
                            
                            {loadingAI ? (
                                <div className="flex items-center space-x-2 py-2">
                                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" />
                                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                </div>
                            ) : (
                                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                    {aiFeedback || currentQuestion.explanation || currentQuestion.rubric}
                                </p>
                            )}

                            <button 
                                onClick={nextQuestion}
                                className="mt-6 w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center hover:bg-blue-700 transition-all"
                            >
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
