from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import PyPDF2
import io
import spacy
import random
import nltk
from nltk.corpus import wordnet
from collections import Counter

# Download NLTK data
nltk.download('wordnet')
nltk.download('omw-1.4')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Spacy model with robust fallback
nlp = None
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"Warning: Could not load spacy model en_core_web_sm. Exception: {e}")
    # Try one manual download but don't crash if it fails
    try:
        os.system(f"{os.sys.executable} -m spacy download en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
    except:
        print("Warning: Spacy model download failed. Using basic NLP fallback.")
        nlp = None

def get_simple_keywords(text):
    """Simple keyword extraction fallback when spacy is unavailable"""
    words = text.lower().split()
    # Filter out common stop words and short words
    stop_words = {'this', 'that', 'with', 'from', 'there', 'their', 'under', 'these', 'would', 'could'}
    keywords = [w.strip('.,!?;:"()') for w in words if len(w) > 4 and w not in stop_words]
    return keywords

@app.get("/")
async def root():
    return {"status": "OK", "service": "Custom AI Study Companion", "message": "Service is operational. Use /health for full check."}

@app.get("/health")
async def health():
    return {"status": "OK", "service": "Custom AI Study Companion"}

def get_distractors(word, context_words):
    """Simple distractor generation strategy"""
    distractors = set()
    syns = wordnet.synsets(word)
    if syns:
        hyper = syns[0].hypernyms()
        if hyper:
            for item in hyper[0].hyponyms():
                name = item.lemmas()[0].name().replace('_', ' ')
                if name.lower() != word.lower():
                    distractors.add(name)
    
    # If not enough distractors, use random nouns from context
    if len(distractors) < 3:
        for w in context_words:
            if w.lower() != word.lower() and len(w) > 3:
                distractors.add(w)
            if len(distractors) >= 3:
                break
                
    # Final fallback
    fallbacks = ["Unknown", "General Concept", "Related Theory", "Alternative Process"]
    while len(distractors) < 3:
        distractors.add(fallbacks[len(distractors) % len(fallbacks)])
        
    return list(distractors)[:3]

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if file.filename.endswith('.pdf'):
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return {"text": text}
        elif file.filename.endswith('.txt'):
            return {"text": content.decode('utf-8')}
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-quiz")
async def generate_quiz(data: dict):
    try:
        text = data.get("text", "")
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")
            
        doc = nlp(text)
        
        # 1. Extract Keywords (Nouns/Proper Nouns)
        keywords = [token.text for token in doc if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 4]
        keyword_freq = Counter(keywords).most_common(20)
        top_keywords = [k[0] for k in keyword_freq]
        
        # 2. Extract Sentences containing top keywords
        sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 30]
        
        questions = []
        
        # Generate MCQs (3)
        mcq_count = 0
        used_sents = set()
        
        for kw in top_keywords:
            if mcq_count >= 3: break
            for sent in sentences:
                if kw in sent and sent not in used_sents:
                    distractors = get_distractors(kw, top_keywords)
                    options = distractors + [kw]
                    random.shuffle(options)
                    
                    questions.append({
                        "type": "mcq",
                        "question": sent.replace(kw, "__________"),
                        "options": options,
                        "answer": kw,
                        "explanation": f"The term '{kw}' correctly completes the context of this statement found in your study material."
                    })
                    used_sents.add(sent)
                    mcq_count += 1
                    break

        # Generate Short Answers (2)
        short_count = 0
        for kw in reversed(top_keywords):
            if short_count >= 2: break
            for sent in sentences:
                if kw in sent and sent not in used_sents:
                    questions.append({
                        "type": "short",
                        "question": f"Based on the text, what term fits this description: '{sent.replace(kw, '...')}'?",
                        "answer": kw,
                        "explanation": f"This refers to {kw} as discussed in the material."
                    })
                    used_sents.add(sent)
                    short_count += 1
                    break
        
        # Generate Essay (1)
        if sentences:
            essay_sent = sentences[len(sentences)//2]
            questions.append({
                "type": "essay",
                "question": f"Analyze the following concept from your notes: '{essay_sent}'. Discuss its implications and provide examples where applicable.",
                "rubric": "Grade based on depth of analysis, correct usage of terminology, and logical structure."
            })

        return {"quiz": {"questions": questions}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-incorrect")
async def explain_incorrect(data: dict):
    try:
        question = data.get("question")
        user_answer = data.get("user_answer")
        correct_answer = data.get("correct_answer")
        
        # Simple rule-based explanation
        explanation = f"You selected '{user_answer}', but the correct answer is '{correct_answer}'. "
        explanation += f"In the context of the study material provided, '{correct_answer}' is the precise term that fulfills the requirements of the question. "
        explanation += "Review the relevant section to strengthen your understanding of this concept."
        
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-hint")
async def get_hint(data: dict):
    try:
        correct_answer = data.get("correct_answer", "")
        if correct_answer:
            hint = f"Think about concepts related to '{correct_answer[0]}...{correct_answer[-1]}'. It has {len(correct_answer)} letters."
        else:
            hint = "Try looking for definitions involving key nouns in the question."
        return {"hint": hint}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ocr-evaluate")
async def ocr_evaluate(file: UploadFile = File(...)):
    try:
        from PIL import Image
        import pytesseract
        
        content = await file.read()
        image = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(image)
        
        # Simple rule-based evaluation
        word_count = len(text.split())
        quality = "Good" if word_count > 50 else "Short"
        
        return {
            "text": text,
            "evaluation": {
                "word_count": word_count,
                "readability": quality,
                "feedback": "Handwritten notes processed. Ensure clarity for better evaluation."
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Error: {str(e)}")

@app.post("/analyze-weakness")
async def analyze_weakness(data: dict):
    try:
        incorrect_data = data.get("incorrect_data", [])
        if not incorrect_data:
            return {"weaknesses": [], "recommendations": "No sufficient data to identify weaknesses yet."}
            
        all_text = " ".join([d.get("question", "") + " " + d.get("correct_answer", "") for d in incorrect_data])
        
        keywords = []
        if nlp:
            doc = nlp(all_text)
            # Extract keywords from incorrect questions
            keywords = [token.text.lower() for token in doc if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 4]
        else:
            keywords = get_simple_keywords(all_text)
            
        common = Counter(keywords).most_common(3)
        
        weaknesses = [k[0] for k in common]
        
        return {
            "weaknesses": weaknesses,
            "recommendations": f"Focus on reviewing concepts related to: {', '.join(weaknesses)}." if weaknesses else "Keep practicing to identify specific areas for improvement."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
