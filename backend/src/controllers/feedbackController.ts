import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const getExplanation = async (req: any, res: any) => {
    try {
        const { question, userAnswer, correctAnswer, context } = req.body;
        
        const response = await axios.post(`${AI_SERVICE_URL}/explain-incorrect`, {
            question,
            user_answer: userAnswer,
            correct_answer: correctAnswer,
            context
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getHint = async (req: any, res: any) => {
    try {
        const { question, correct_answer } = req.body;
        
        const response = await axios.post(`${AI_SERVICE_URL}/get-hint`, {
            question,
            correct_answer
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
