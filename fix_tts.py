import sys
import re

file_path = 'frontend/src/app/dashboard/courses/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the interval hack
content = re.sub(r'    // Hack to prevent Chrome/Android.*?(?=    useEffect\(\(\) => {\n        if \(\!ttsActive\))', '', content, flags=re.DOTALL)

# 2. Replace handleReadAloud, handleTtsPlayPause, handleTtsStop, handleTtsSpeedChange
tts_block_regex = r'    const handleReadAloud = async.*?    const handleTtsSpeedChange = \(speed: number\) => {.*?\n    };\n'
tts_replacement = """    const playChunks = (chunksToPlay: string[], startIndex: number, speed: number) => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        
        chunksToPlay.forEach((chunk, index) => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = speed;
            
            utterance.onstart = () => {
                setTtsChunkIndex(startIndex + index);
                setTtsProgress(Math.floor(((startIndex + index) / (startIndex + chunksToPlay.length)) * 100));
                setTtsPlaying(true);
            };
            
            utterance.onend = () => {
                if (index === chunksToPlay.length - 1) {
                    setTtsPlaying(false);
                    setTtsProgress(100);
                }
            };
            
            utterance.onerror = (e) => {
                if (e.error !== 'canceled' && e.error !== 'interrupted') {
                    console.error("TTS Chunk Error:", e);
                }
            };
            
            window.speechSynthesis.speak(utterance);
        });
    };

    const handleReadAloud = async (materialId: string, title: string) => {
        if (typeof window === 'undefined') return;
        
        const unlockUtterance = new SpeechSynthesisUtterance(' ');
        unlockUtterance.volume = 0;
        window.speechSynthesis.speak(unlockUtterance);

        if (ttsActive) {
            window.speechSynthesis.cancel();
        }
        
        setLoadingTTS(materialId);
        try {
            const jwt = await getCachedJWT();
            const res = await axios.get(`${API_URL}/api/materials/${materialId}/text`, {
                headers: { Authorization: `Bearer ${jwt}` }
            });
            const text = res.data.text;
            if (!text || text.trim().length === 0) {
                toast.error("This resource does not have any speakable text.");
                return;
            }
            
            const chunks = splitTextIntoChunks(text);
            const spokenText = chunks.join(' ');

            ttsChunkRefs.current = [];
            setTtsText(spokenText);
            setTtsChunks(chunks);
            setTtsChunkIndex(0);
            setTtsTitle(title);
            setTtsActive(true);
            setTtsProgress(0);
            
            playChunks(chunks, 0, ttsSpeed);
            
        } catch (error) {
            console.error("TTS failed:", error);
            toast.error("Failed to load text for audio playback.");
        } finally {
            setLoadingTTS(null);
        }
    };

    const handleTtsPlayPause = () => {
        if (typeof window === 'undefined') return;
        
        if (ttsPlaying) {
            window.speechSynthesis.pause();
            setTtsPlaying(false);
        } else {
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            } else {
                const remainingChunks = ttsChunks.slice(ttsChunkIndex);
                if (remainingChunks.length > 0) {
                    playChunks(remainingChunks, ttsChunkIndex, ttsSpeed);
                }
            }
            setTtsPlaying(true);
        }
    };

    const handleTtsStop = () => {
        if (typeof window === 'undefined') return;
        window.speechSynthesis.cancel();
        setTtsPlaying(false);
        setTtsActive(false);
        setTtsUtterance(null);
        setTtsProgress(0);
        setTtsChunkIndex(0);
        setTtsChunks([]);
        ttsChunkRefs.current = [];
    };

    const handleTtsSpeedChange = (speed: number) => {
        setTtsSpeed(speed);
        if (typeof window === 'undefined') return;
        
        if (ttsActive) {
            const remainingChunks = ttsChunks.slice(ttsChunkIndex);
            if (remainingChunks.length > 0) {
                playChunks(remainingChunks, ttsChunkIndex, speed);
            }
        }
    };
"""

content = re.sub(tts_block_regex, tts_replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
