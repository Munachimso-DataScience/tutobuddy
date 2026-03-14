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

# Global NLP model
_nlp = None

def get_nlp():
    global _nlp
    if _nlp is not None:
        return _nlp
    
    try:
        # Avoid hanging on load - if this fails or hangs, we use fallbacks
        import spacy
        print("Loading Spacy model en_core_web_sm...")
        _nlp = spacy.load("en_core_web_sm")
        print("Spacy model loaded successfully.")
    except Exception as e:
        print(f"Warning: Spacy load failed ({e}). Using simple text fallback.")
        _nlp = None
    return _nlp

def get_simple_keywords(text):
    """Simple keyword extraction fallback when spacy is unavailable"""
    words = text.lower().split()
    # Filter out common stop words and short words
    stop_words = {'this', 'that', 'with', 'from', 'there', 'their', 'under', 'these', 'would', 'could', 'about', 'which'}
    keywords = [w.strip('.,!?;:"()') for w in words if len(w) > 4 and w not in stop_words and w.isalnum()]
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
        elif file.filename.endswith('.docx'):
            try:
                import docx
                doc = docx.Document(io.BytesIO(content))
                text = "\n".join([para.text for para in doc.paragraphs])
                return {"text": text}
            except ImportError:
                raise HTTPException(status_code=500, detail="python-docx not installed on server")
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
            
        nlp = get_nlp()
        if nlp:
            doc = nlp(text)
            # 1. Extract Keywords (Nouns/Proper Nouns)
            keywords = [token.text for token in doc if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 4]
            keyword_freq = Counter(keywords).most_common(20)
            top_keywords = [k[0] for k in keyword_freq]
            
            # 2. Extract Sentences containing top keywords
            sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 30]
        else:
            # Simple fallback extraction
            top_keywords = Counter(get_simple_keywords(text)).most_common(20)
            top_keywords = [k[0] for k in top_keywords]
            sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 30]
        
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
        context = data.get("context", "")
        
        # Simple rule-based explanation
        explanation = f"You selected '{user_answer}', but the correct answer is '{correct_answer}'.\n\n"
        
        if context:
            explanation += f"Referencing your study notes: \"{context}\".\n\n"
        
        explanation += f"In the context of the study material provided, '{correct_answer}' is the precise term that fulfills the requirements of the question. "
        explanation += "Review the relevant section to strengthen your understanding of this concept."
        
        topic_query = correct_answer if correct_answer else "General knowledge"
        safe_query = topic_query.replace(' ', '+')
        
        links = [
            { "title": f"Understanding {topic_query} - Khan Academy", "url": f"https://www.khanacademy.org/search?page_search_query={safe_query}" },
            { "title": f"{topic_query} Tutorial - YouTube", "url": f"https://www.youtube.com/results?search_query={safe_query}" },
            { "title": f"Articles on {topic_query} - Wikipedia", "url": f"https://en.wikipedia.org/wiki/Special:Search?search={safe_query}" }
        ]

        return {
            "explanation": explanation,
            "suggestions": f"Consider reviewing introductory materials and video lectures on '{topic_query}' to strengthen your core understanding before attempting another similar quiz.",
            "links": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get-hint")
async def get_hint(data: dict):
    try:
        correct_answer = data.get("correct_answer", "")
        question = data.get("question", "")
        
        hint_text = ""
        if correct_answer:
            hint_text = f"Think about a term that starts with '{correct_answer[0]}' and has {len(correct_answer)} letters."
        else:
            hint_text = "Try identifying the core subject mentioned in the question."

        # Generate external links for the hint
        search_query = correct_answer if correct_answer else question[:30]
        safe_query = search_query.replace(' ', '+')
        
        links = [
            { "title": "Watch related Video", "url": f"https://www.youtube.com/results?search_query={safe_query}+explained" },
            { "title": "Read Article", "url": f"https://en.wikipedia.org/wiki/Special:Search?search={safe_query}" }
        ]

        return {
            "hint": hint_text,
            "resources": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reinforcement-template")
async def reinforcement_template(data: dict):
    """Generates a structured revision template based on quiz performance"""
    try:
        topic = data.get("topic", "General Study")
        weaknesses = data.get("weaknesses", [])
        
        template = f"# study reinforcement: {topic}\n\n"
        template += "## 🎯 Key Learning Objective\n"
        template += f"Master the fundamental concepts of {topic}, specifically focusing on area(s): {', '.join(weaknesses) if weaknesses else 'core principles'}.\n\n"
        
        template += "## 🧠 Active Recall Questions\n"
        for i, w in enumerate(weaknesses[:3] if weaknesses else ["primary concept", "secondary application"]):
            template += f"{i+1}. How would you define {w} in your own words?\n"
            template += f"{i+1}b. What is a real-world example of {w}?\n"
            
        template += "\n## 📝 Targeted Notes Area\n"
        template += "> Use this space to summarize the logic behind your previous incorrect answers.\n\n\n"
        
        template += "## 🚀 Next Steps\n"
        template += "1. Review the Wikipedia articles linked in your hints.\n"
        template += "2. Explain this topic to a friend (Feynman Technique).\n"
        template += "3. Re-take the AI quiz in 24 hours (Spaced Repetition).\n"

        return {"template": template}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-essay")
async def evaluate_essay(data: dict):
    try:
        question = data.get("question", "")
        student_answer = data.get("student_answer", "")
        context = data.get("context", "") # The study material text
        
        if not student_answer:
            return {
                "score": 0,
                "feedback": "No answer provided.",
                "relevance": "None",
                "model_answer_highlights": "Please provide an answer for evaluation."
            }

        nlp = get_nlp()
        if not nlp:
            # Fallback simple evaluation
            relevance = "Medium" if any(word in context.lower() for word in student_answer.lower().split() if len(word) > 5) else "Low"
            return {
                "score": 40 if relevance == "Medium" else 10,
                "feedback": "Automated evaluation suggests your answer has " + relevance.lower() + " relevance to the material.",
                "relevance": relevance,
                "model_answer_highlights": "Review the core concepts in your study material related to the question."
            }

        # NLP based evaluation
        q_doc = nlp(question)
        a_doc = nlp(student_answer)
        c_doc = nlp(context[:5000]) # Use first 5k chars for context to avoid overloading

        # 1. Check for keyword overlap with context
        context_keywords = {token.text.lower() for token in c_doc if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 4}
        answer_keywords = {token.text.lower() for token in a_doc if token.pos_ in ('NOUN', 'PROPN') and len(token.text) > 4}
        
        matching_keywords = context_keywords.intersection(answer_keywords)
        relevance_score = len(matching_keywords) / max(len(answer_keywords), 1)

        # 2. Basic Feedback logic
        if relevance_score > 0.4:
            score = 85
            feedback = "excellent! Your answer demonstrates a strong understanding of the material and uses appropriate terminology."
        elif relevance_score > 0.15:
            score = 60
            feedback = "Good start, but you could include more specific details from the study material to strengthen your argument."
        else:
            score = 25
            feedback = "Your answer doesn't seem to align well with the provided study material. Try to incorporate key terms and concepts from your notes."

        # 3. Generate "Model Highlights" based on context keywords related to the question
        question_keywords = [token.text.lower() for token in q_doc if token.pos_ in ('NOUN', 'PROPN')]
        suggested_terms = [kw for kw in context_keywords if any(qk in kw or kw in qk for qk in question_keywords)][:5]
        
        if not suggested_terms:
            suggested_terms = list(context_keywords)[:5]

        return {
            "score": score,
            "feedback": feedback,
            "relevance": "High" if relevance_score > 0.4 else "Medium" if relevance_score > 0.15 else "Low",
            "matching_concepts": list(matching_keywords)[:10],
            "model_answer_highlights": f"A complete answer should focus on: {', '.join(suggested_terms)}. Refer back to these specific terms in your material."
        }
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
        nlp = get_nlp()
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
