/** Ironclad Version: 2.1 - Retries & Warm-up Enabled **/
import { COLLECTIONS, DATABASE_ID, BUCKET_ID } from '../lib/collections';
import { databases, storage } from '../lib/appwrite-admin';
import { ID, Query } from 'node-appwrite';
import axios from 'axios';
import fs from 'fs';
import fetch from 'node-fetch';

const getAiUrl = () => {
    let envUrl = process.env.AI_SERVICE_URL;
    if (envUrl && envUrl.endsWith('/')) {
        envUrl = envUrl.slice(0, -1);
    }
    const isRender = process.env.RENDER === 'true' || process.env.RENDER === '1' || !!process.env.RENDER_SERVICE_ID;

    // 1. If we are on Render, try to find the best URL
    if (isRender) {
        // If the user hasn't set an explicit internal URL, or it looks like a public one
        if (!envUrl || envUrl.includes('onrender.com') || envUrl.includes('localhost')) {
            // We'll try the name from render.yaml first
            return 'https://patienceigwe-tutorbuddy-ai.hf.space';
        }
    }

    return envUrl || 'http://localhost:8000';
};

type QuizDifficulty = 'easy' | 'medium' | 'hard';

const getAdaptiveDifficulty = (performanceScore?: number | null): QuizDifficulty => {
    if (typeof performanceScore !== 'number' || Number.isNaN(performanceScore)) {
        return 'medium';
    }
    if (performanceScore >= 75) return 'hard';
    if (performanceScore < 50) return 'easy';
    return 'medium';
};

const buildAdaptiveQuizConfig = (difficulty: QuizDifficulty) => {
    switch (difficulty) {
        case 'hard':
            return {
                num_mcq: 18,
                num_essay: 6,
                style: 'challenge',
                guidance: 'Ask more analytical, scenario-based, and application-heavy questions. Use subtle distractors and require deeper reasoning.'
            };
        case 'easy':
            return {
                num_mcq: 22,
                num_essay: 2,
                style: 'revision',
                guidance: 'Ask simpler, revision-focused questions that reinforce the basics. Use clearer wording, direct clues, and less ambiguity.'
            };
        default:
            return {
                num_mcq: 20,
                num_essay: 4,
                style: 'balanced',
                guidance: 'Ask a balanced mix of conceptual and recall questions.'
            };
    }
};

export const generateQuiz = async (req: any, res: any) => {
    const AI_URL = getAiUrl();
    try {
        const { materialId, adaptiveScore, quizType, topicFocus, questionCount } = req.body;
        const userId = req.user.$id;

        console.log(`Using Database: ${DATABASE_ID}, Quiz Collection: ${COLLECTIONS.QUIZZES}`);
        
        // 1. Get material file from database to get file_id and course_id
        const material = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATERIALS, materialId);
        const recentQuizzes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            [
                Query.equal('user_id', userId),
                Query.equal('course_id', material.course_id),
                Query.orderDesc('date_taken'),
                Query.limit(5)
            ]
        ).catch(() => null);

        const parsedAdaptiveScore = Number(adaptiveScore);
        const adaptiveScoreFromClient = Number.isFinite(parsedAdaptiveScore) && parsedAdaptiveScore >= 0 ? parsedAdaptiveScore : null;
        const scoredQuizzes = recentQuizzes?.documents?.filter((quiz: any) => Number(quiz.score) > 0) || [];
        const averageRecentScore = adaptiveScoreFromClient !== null
            ? Math.round(adaptiveScoreFromClient)
            : scoredQuizzes.length > 0
            ? Math.round(scoredQuizzes.reduce((sum: number, quiz: any) => sum + (Number(quiz.score) || 0), 0) / scoredQuizzes.length)
            : null;
        const adaptiveDifficulty = getAdaptiveDifficulty(averageRecentScore);
        const adaptiveConfig = buildAdaptiveQuizConfig(adaptiveDifficulty);
        
        // Override counts based on quizType and user override
        let finalNumMcq = adaptiveConfig.num_mcq;
        let finalNumEssay = adaptiveConfig.num_essay;
        const totalQuestions = questionCount ? Math.min(50, Math.max(1, Number(questionCount))) : (finalNumMcq + finalNumEssay);
        
        if (quizType === 'objective') {
            finalNumMcq = totalQuestions;
            finalNumEssay = 0;
        } else if (quizType === 'theory') {
            finalNumMcq = 0;
            finalNumEssay = totalQuestions;
        } else if (questionCount) {
            // If they provided a specific count for 'mixed', use roughly 70/30 split
            finalNumMcq = Math.max(1, Math.floor(totalQuestions * 0.7));
            finalNumEssay = totalQuestions - finalNumMcq;
        }
        // --- 0. Fetch Active Template ---
        let activeTemplatePrompt = null;
        try {
            const templateRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.QUESTION_TEMPLATES,
                [Query.equal('is_active', true), Query.limit(1)]
            );
            if (templateRes.total > 0 && templateRes.documents[0].prompt_text) {
                activeTemplatePrompt = templateRes.documents[0].prompt_text;
                console.log(`Using active template: ${templateRes.documents[0].name}`);
            }
        } catch (e) {
            console.warn("Could not fetch active template, defaulting to AI's internal prompt.");
        }

        console.log(`Adaptive quiz mode for user ${userId} on course ${material.course_id}: ${adaptiveDifficulty} (avg score: ${averageRecentScore ?? 'n/a'}). Topic: ${topicFocus || 'General'}. Count: ${totalQuestions}`);
        
        // --- 1. AI Service Discovery & Warm-up ---
        let finalAiUrl = AI_URL;
        let isHealthy = false;
        
        // Hostnames to try (Internal, Internal with Typo, Public)
        const candidates = [
            AI_URL,
            'http://tutorbuddy-ai:8000', // Common "tutor" vs "tuto" typo
            'https://tutobuddy-ai.onrender.com', // Public fallback
            'https://tutorbuddy-ai.onrender.com'
        ];

        console.log('Starting AI discovery phase...');
        for (const url of candidates) {
            if (isHealthy) break;
            try {
                console.log(`Pinging AI candidate: ${url}...`);
                await axios.get(`${url}/health`, { timeout: 8000 });
                finalAiUrl = url;
                isHealthy = true;
                console.log(`Successfully connected to AI at: ${finalAiUrl}`);
            } catch (e: any) {
                console.warn(`Candidate ${url} unreachable: ${e.message}`);
            }
        }
        
        if (!isHealthy) {
            console.error('All AI candidates failed. Services might be down or misnamed.');
            throw new Error('AI Service not found. Please check your Render dashboard to ensure "tutobuddy-ai" is live.');
        }

        let text = '';

        if (material.content) {
            // Use pasted text directly
            text = material.content;
        } else if (material.file_id && material.file_id !== 'pasted_text') {
            // 2. Get file content from storage (ArrayBuffer)
            console.log(`Downloading file ${material.file_id} from Appwrite...`);
            const fileContent = await storage.getFileDownload(BUCKET_ID, material.file_id);
            
            // 3. Prepare for AI service
            const formData = new (require('form-data'))();
            const buffer = Buffer.from(fileContent);

            formData.append('file', buffer, {
                filename: `material.${material.type || 'txt'}`,
                contentType: material.type === 'pdf' ? 'application/pdf' : material.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain',
            });

            // 4. Extract text with RETRY logic
            let retries = 2;
            while (retries >= 0) {
                try {
                    console.log(`Sending file to AI for extraction (Retries left: ${retries})...`);
                    const extractionRes = await axios.post(`${finalAiUrl}/extract-text`, formData, {
                        headers: { ...formData.getHeaders() },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                        timeout: 180000 
                    });
                    text = extractionRes.data.text;
                    console.log(`Extraction successful. Received ${text.length} characters.`);
                    break;
                } catch (extErr: any) {
                    if (retries === 0) {
                        console.error('AI EXTRACTION FAILED PERMANENTLY:', extErr.message);
                        throw new Error(`AI Extraction failed: ${extErr.response?.data?.detail || extErr.message} (Timeout set to 180s)`);
                    }
                    console.warn(`Extraction failed, retrying... (${extErr.message})`);
                    retries--;
                    await new Promise(r => setTimeout(r, 5000)); // Wait 5s before retry
                }
            }
        } else {
            throw new Error('No content or file found for this material');
        }

        if (!text || text.trim().length < 50) {
            console.warn(`Insufficient text for quiz: ${text?.length} chars`);
            throw new Error(`The study material is too short to generate a high-quality quiz (found ${text?.length || 0} characters). Please provide more content.`);
        }

        console.log(`Requesting adaptive quiz (${finalNumMcq} MCQs, ${finalNumEssay} Essays) from AI for ${text.length} chars...`);

        // 5. Generate Quiz
        const quizRes = await axios.post(`${finalAiUrl}/generate-quiz`, {
            text: text,
            num_mcq: finalNumMcq,
            num_essay: finalNumEssay,
            num_questions: finalNumMcq + finalNumEssay,
            topicFocus: topicFocus,
            custom_template: activeTemplatePrompt,
            difficulty: adaptiveDifficulty,
            performance_score: averageRecentScore,
            adaptive_guidance: adaptiveConfig.guidance
        }, { timeout: 300000 }); 

        const quizData = quizRes.data.quiz;

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.error('AI Service Error Data:', quizRes.data);
            throw new Error('AI Service failed to generate any valid questions. Try again with more content.');
        }

        // 6. Store in Appwrite
        console.log(`Saving quiz with ${quizData.questions.length} questions to collection: ${COLLECTIONS.QUIZZES}...`);
        const quizDoc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            ID.unique(),
            {
                title: `Comprehensive Quiz: ${material.title || 'Extracted material'}`,
                course_id: material.course_id,
                score: 0,
                total_questions: quizData.questions?.length || 35,
                date_taken: new Date().toISOString(),
                user_id: userId,
                material_id: materialId,
                content: typeof quizData === 'string' ? quizData : JSON.stringify(quizData),
                created_at: new Date().toISOString()
            }
        ).catch(dbErr => {
            console.error('Appwrite Quiz Save Failure:', dbErr.message);
            throw new Error(`Database rejected the quiz: ${dbErr.message}`);
        });

        // 7. Update course completion tracking
        try {
            const course = await databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, material.course_id);
            const newProgress = Math.min((course.progress || 0) + 5, 100);
            const newReadiness = Math.min((course.exam_readiness || 0) + 5, 100);
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, material.course_id, {
                progress: newProgress,
                exam_readiness: newReadiness
            });
        } catch (e) {
            console.warn('Silent skip: Failed to update course progress tracking:', e);
        }

        res.status(201).json(quizDoc);
    } catch (error: any) {
        console.error('Quiz Generation CRITICAL FAILURE:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate quiz',
            message: error.message,
            ai_status: error.response?.status,
            ai_data: error.response?.data,
            hint: 'Ensure AI_SERVICE_URL is set to https://patienceigwe-tutorbuddy-ai.hf.space for internal Render networking'
        });
    }
};

export const getQuizzes = async (req: any, res: any) => {
    try {
        const { materialId } = req.params;
        const userId = req.user.$id;

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.QUIZZES,
            [
                Query.equal('material_id', materialId),
                Query.equal('user_id', userId)
            ]
        );
        
        res.status(200).json(response.documents);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateQuizScore = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const userId = req.user.$id;
        const { score } = req.body;

        const numericScore = Math.max(0, Math.min(100, Number(score) || 0));

        const quiz = await databases.getDocument(DATABASE_ID, COLLECTIONS.QUIZZES, id);
        if (quiz.user_id !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const updatedQuiz = await databases.updateDocument(DATABASE_ID, COLLECTIONS.QUIZZES, id, {
            score: numericScore,
            completed_at: new Date().toISOString()
        });

        let courseTitle = quiz.title || 'this course';
        if (quiz.course_id) {
            try {
                const course = await databases.getDocument(DATABASE_ID, COLLECTIONS.COURSES, quiz.course_id);
                courseTitle = course.title || course.name || courseTitle;
                const readinessBoost = numericScore >= 75 ? 10 : numericScore < 50 ? 3 : 6;
                const progressBoost = numericScore >= 75 ? 5 : numericScore < 50 ? 2 : 3;
                await databases.updateDocument(DATABASE_ID, COLLECTIONS.COURSES, quiz.course_id, {
                    progress: Math.min((course.progress || 0) + progressBoost, 100),
                    exam_readiness: Math.min((course.exam_readiness || 0) + readinessBoost, 100)
                });
            } catch (courseError: any) {
                console.warn('Failed to update course readiness after quiz score save:', courseError.message);
            }
        }

        let adaptiveFeedback: any = null;
        try {
            const aiUrl = getAiUrl();
            const adaptiveResponse = await axios.post(`${aiUrl}/adaptive-feedback`, {
                score: numericScore,
                difficulty: getAdaptiveDifficulty(numericScore),
                performance_score: numericScore,
                quiz_title: quiz.title || 'Your quiz',
                course_title: courseTitle
            }, { timeout: 120000 });
            adaptiveFeedback = adaptiveResponse.data;
        } catch (adaptiveError: any) {
            console.warn('Adaptive feedback generation failed:', adaptiveError.message);
            adaptiveFeedback = {
                level: getAdaptiveDifficulty(numericScore),
                headline: numericScore >= 75
                    ? 'You’ve earned a harder challenge'
                    : numericScore < 50
                        ? 'Time for a revision-focused quiz'
                        : 'Your next quiz will stay balanced',
                message: numericScore >= 75
                    ? 'You’re performing strongly, so the next quiz will ask more analytical and challenging questions.'
                    : numericScore < 50
                        ? 'You need a little more reinforcement first, so the next quiz will revisit the basics more gently.'
                        : 'You’re in a balanced zone, so the next quiz will mix review with moderate challenge.',
                why_this_level: numericScore >= 75
                    ? 'Strong performance means you are ready for deeper reasoning tasks.'
                    : numericScore < 50
                        ? 'Lower performance means the system should slow down and reinforce the foundation.'
                        : 'Your performance suggests steady progress, so the quiz stays balanced.',
                next_focus: numericScore >= 75
                    ? 'Expect more scenario-based questions and subtle distractors.'
                    : numericScore < 50
                        ? 'Expect clearer revision questions and direct recall practice.'
                        : 'Expect a mix of recall and concept application.',
                encouragement: numericScore >= 75
                    ? 'Keep going — you’re ready for a harder level.'
                    : numericScore < 50
                        ? 'This is part of the learning curve — revision will help you improve quickly.'
                        : 'You’re building consistency well — keep it up.'
            };
        }

        return res.status(200).json({
            message: 'Quiz score updated successfully.',
            quiz: updatedQuiz,
            adaptiveLabel: getAdaptiveDifficulty(numericScore),
            adaptiveFeedback
        });
    } catch (error: any) {
        console.error('Update quiz score error:', error.message);
        return res.status(500).json({ error: error.message });
    }
};

