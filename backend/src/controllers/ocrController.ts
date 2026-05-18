import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const normalizeAiUrl = (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');

    if (trimmed.includes('huggingface.co/spaces/')) {
        const spacePath = trimmed.split('/spaces/')[1];
        const [owner, name] = spacePath.split('/').filter(Boolean);

        if (owner && name) {
            return `https://${owner}-${name}.hf.space`;
        }
    }

    return trimmed;
};

const getAiUrl = () => {
    const envUrl = process.env.AI_SERVICE_URL;
    const isRender = process.env.RENDER === 'true' || process.env.RENDER === '1' || !!process.env.RENDER_SERVICE_ID;

    if (isRender) {
        if (!envUrl || envUrl.includes('onrender.com') || envUrl.includes('localhost')) {
            return 'http://tutobuddy-ai:8000';
        }
    }
    return normalizeAiUrl(envUrl || 'http://localhost:8000');
};

export const evaluateOcr = async (req: any, res: any) => {
    const AI_URL = getAiUrl();

    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        const formData = new FormData();
        const fileBuffer = fs.readFileSync(file.path);

        formData.append('file', fileBuffer, {
            filename: file.originalname,
            contentType: file.mimetype
        });

        const response = await axios.post(`${AI_URL}/ocr-evaluate`, formData, {
            headers: { ...formData.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 180000
        });

        try {
            fs.unlinkSync(file.path);
        } catch (cleanupErr) {
            console.warn('Failed to delete temp OCR file:', cleanupErr);
        }

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('evaluateOcr error:', error.response?.data || error.message);

        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch {}
        }

        res.status(500).json({ error: error.message });
    }
};
