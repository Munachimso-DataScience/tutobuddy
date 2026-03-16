from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
import PyPDF2
import io
import random
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.tag import pos_tag
from collections import Counter
import re
import gc
import tempfile
import shutil

# Download NLTK data
def download_nltk():
    libs = ['wordnet', 'omw-1.4', 'punkt', 'averaged_perceptron_tagger', 'stopwords']
    data_path = os.environ.get('NLTK_DATA', '/opt/render/nltk_data')
    if not os.path.exists(data_path):
        os.makedirs(data_path, exist_ok=True)
    nltk.data.path.append(data_path)
    
    # Only download if a key directory doesn't exist to speed up startup
    if not os.path.exists(os.path.join(data_path, "corpora", "wordnet")):
        print("NLTK data missing. Downloading...")
        for lib in libs:
            nltk.download(lib, download_dir=data_path, quiet=True)
    else:
        print("NLTK data already present.")

download_nltk()

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NLP Objective Question Generator ---

def preprocess_text(text):
    """Clean and tokenize text into sentences"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    sentences = sent_tokenize(text)
    return [s for s in sentences if len(s.strip()) > 40]

def extract_keywords(sentence):
    """Extract candidate keywords using POS tagging (NN, NNS, NNP, JJ, VB)"""
    tokens = word_tokenize(sentence)
    tagged = pos_tag(tokens)
    
    # Filter for technical/important parts of speech
    candidates = []
    for word, pos in tagged:
        # Avoid stopwords and very short words
        if len(word) < 4 or not word.isalnum():
            continue
        
        # Include Nouns, Adjectives, and Verbs (per user request)
        if pos in ('NN', 'NNS', 'NNP', 'JJ', 'VB'):
            candidates.append((word, pos))
            
    return candidates

def get_wordnet_pos(treebank_tag):
    """Map treebank POS tags to WordNet POS tags"""
    if treebank_tag.startswith('J'):
        return wordnet.ADJ
    elif treebank_tag.startswith('V'):
        return wordnet.VERB
    elif treebank_tag.startswith('N'):
        return wordnet.NOUN
    elif treebank_tag.startswith('R'):
        return wordnet.ADV
    else:
        return wordnet.NOUN

def generate_distractors(target_word, pos_tag):
    """Generate distractors using WordNet strategies (hypernyms, hyponyms, coordinates)"""
    distractors = set()
    wn_pos = get_wordnet_pos(pos_tag)
    
    synsets = wordnet.synsets(target_word, pos=wn_pos)
    if not synsets:
        # Try without POS restriction if nothing found
        synsets = wordnet.synsets(target_word)
        
    if synsets:
        synset = synsets[0]
        
        # 1. Hypernym Strategy (Coordinate terms)
        for hypernym in synset.hypernyms():
            for hyponym in hypernym.hyponyms():
                name = hyponym.lemmas()[0].name().replace('_', ' ')
                if name.lower() != target_word.lower():
                    distractors.add(name)
                    if len(distractors) >= 10: break
            if len(distractors) >= 10: break
            
        # 2. Hyponym Strategy
        if len(distractors) < 5:
            for hyponym in synset.hyponyms():
                name = hyponym.lemmas()[0].name().replace('_', ' ')
                if name.lower() != target_word.lower():
                    distractors.add(name)
                    if len(distractors) >= 15: break

    return list(distractors)

def filter_distractors(distractors, target_word, sentence, pos_tag):
    """Apply filtering rules for high-quality distractors"""
    filtered = []
    target_len = len(target_word)
    
    # Pre-tokenize sentence for POS consistency check
    # (Simple check: distractors should likely be valid in context)
    
    for d in distractors:
        d = d.lower()
        # Rule: Not a synonym or duplicate
        if d == target_word.lower() or d in filtered:
            continue
            
        # Rule: Not a substring of the answer
        if d in target_word.lower() or target_word.lower() in d:
            continue
            
        # Rule: Similar POS (approximated by WordNet match or word structure)
        # Rule: Reasonable length (not wildly different from target)
        if abs(len(d) - target_len) > 8:
            continue
            
        filtered.append(d)
        if len(filtered) >= 3:
            break
            
    # Fallback to similar words if WordNet fails
    fallbacks = ["process", "system", "theory", "method", "concept", "approach", "framework"]
    while len(filtered) < 3:
        f = random.choice(fallbacks)
        if f not in filtered and f != target_word.lower():
            filtered.append(f)
            
    return filtered

def score_question(question_text, answer, distractors):
    """Simple scoring module (0-100)"""
    score = 100
    
    # 1. POS consistency (simple check: if answer is capitalized, distractors should be too - ignored for now)
    
    # 2. Option length similarity
    avg_len = sum(len(o) for o in distractors + [answer]) / 4
    for o in distractors + [answer]:
        if abs(len(o) - avg_len) > 10:
            score -= 10
            
    # 3. Duplicate check
    if len(set([answer] + distractors)) < 4:
        score -= 50
        
    return score

def generate_mcq(sentence, target_keyword_info):
    """Build a complete MCQ object following the pipeline"""
    word, pos = target_keyword_info
    
    # 1. Distractors
    raw_distractors = generate_distractors(word, pos)
    filtered = filter_distractors(raw_distractors, word, sentence, pos)
    
    # 2. Scoring
    q_score = score_question(sentence, word, filtered)
    if q_score < 70:
        return None # Reject low quality
    
    # 3. Format
    options = filtered + [word]
    random.shuffle(options)
    
    # Assign A, B, C, D
    mapping = {0: 'A', 1: 'B', 2: 'C', 3: 'D'}
    answer_letter = ''
    formatted_options = []
    for i, opt in enumerate(options):
        letter = mapping[i]
        formatted_options.append(f"{letter}. {opt}")
        if opt == word:
            answer_letter = letter
            
    return {
        "type": "mcq",
        "question": sentence.replace(word, "________"),
        "options": options,
        "formatted_options": formatted_options,
        "answer": word,
        "correct_letter": answer_letter,
        "explanation": f"The term '{word}' correctly completes the context of this statement found in your study material.",
        "score": q_score
    }

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"status": "OK", "service": "TutorBuddy AI Core", "version": "2.0 (NLP Pipeline)"}

@app.get("/health")
async def health():
    return {"status": "OK"}

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    filename = file.filename.lower()
    print(f"--- Ultra-Lean Extraction: {filename} ---")
    
    # Use a temporary file to keep RAM free
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        try:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
            tmp.close() # Close so other libs can open it

            if filename.endswith('.pdf'):
                reader = PyPDF2.PdfReader(tmp_path)
                pages_content = []
                # Extreme safety: 30 pages / 40k chars
                page_limit = min(len(reader.pages), 35)
                
                total_chars = 0
                for i in range(page_limit):
                    page_text = reader.pages[i].extract_text() or ""
                    pages_content.append(page_text)
                    total_chars += len(page_text)
                    if total_chars > 40000: break
                
                return {"text": "".join(pages_content)[:40000]}
                
            elif filename.endswith('.docx'):
                import docx
                doc = docx.Document(tmp_path)
                text = "\n".join([para.text for para in doc.paragraphs])
                return {"text": text[:40000]}
                
            elif filename.endswith('.txt'):
                with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                    return {"text": f.read(40000)}
            else:
                raise HTTPException(status_code=400, detail="Unsupported format")
        
        except Exception as e:
            print(f"Lean Extraction Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")
        finally:
            # Cleanup!
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
            # Force RAM cleanup
            gc.collect()
            await file.close()

@app.post("/generate-quiz")
async def generate_quiz(data: dict):
    try:
        text = data.get("text", "")
        num_requested = data.get("num_questions", 5)
        print(f"--- Quiz Generation Request Received ---")
        print(f"Text length: {len(text)} characters")
        
        if not text:
            raise HTTPException(status_code=400, detail="No text provided")

        # Truncate extremely large text to prevent memory/timeout issues on free tier
        # 50,000 characters is plenty for a 5-question quiz.
        if len(text) > 50000:
            print(f"Truncating text from {len(text)} to 50,000 chars for performance.")
            text = text[:50000]
            
        sentences = preprocess_text(text)
        if not sentences:
            raise HTTPException(status_code=400, detail="Text too short or invalid to generate questions")
            
        random.shuffle(sentences)
        
        quiz_questions = []
        used_words = set()
        
        # Phase 1: MCQs
        for sent in sentences:
            if len(quiz_questions) >= num_requested:
                break
                
            keywords = extract_keywords(sent)
            if not keywords:
                continue
                
            # Pick a lucky keyword
            random.shuffle(keywords)
            for kw_info in keywords:
                word = kw_info[0]
                if word.lower() in used_words:
                    continue
                    
                mcq = generate_mcq(sent, kw_info)
                if mcq:
                    quiz_questions.append(mcq)
                    used_words.add(word.lower())
                    break
        
        # Phase 2: Fill-ins / Short (if not enough MCQs)
        # (Already handled by MCQ logic, but we could add variety here)
        
        return {"quiz": {"questions": quiz_questions}}
    except Exception as e:
        print(f"Quiz Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain-incorrect")
async def explain_incorrect(data: dict):
    try:
        question = data.get("question", "")
        user_answer = data.get("user_answer", "")
        correct_answer = data.get("correct_answer", "")
        context = data.get("context", "")
        
        explanation = f"You selected '{user_answer}', but the correct answer is '{correct_answer}'.\n\n"
        
        # Extraction logic for 'Simplified Concept' notes
        tokens = word_tokenize(question + " " + correct_answer)
        tagged = pos_tag(tokens)
        topic_keywords = [word for word, pos in tagged if pos.startswith('N') and len(word) > 4]
        topic = topic_keywords[0] if topic_keywords else correct_answer
        
        explanation += f"**AI Simplified Concept:** {topic} refers to a core element in this context. "
        explanation += f"It is essential for understanding the relationship described in your material."
        
        safe_query = topic.replace(' ', '+')
        
        # Curated Resources
        links = [
            { 
                "title": f"Khan Academy: Practice {topic}", 
                "url": f"https://www.khanacademy.org/search?page_search_query={safe_query}",
                "type": "article"
            },
            { 
                "title": f"YouTube: {topic} Visual Tutorial", 
                "url": f"https://www.youtube.com/results?search_query={safe_query}+tutorial",
                "type": "video"
            },
            { 
                "title": f"Academic Summary: {topic}", 
                "url": f"https://en.wikipedia.org/wiki/{safe_query}",
                "type": "pdf" 
            }
        ]

        return {
            "explanation": explanation,
            "suggestions": f"Reviewing '{topic}' tutorials will help you master this specific concept.",
            "links": links
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-weakness")
async def analyze_weakness(data: dict):
    try:
        incorrect_data = data.get("incorrect_data", [])
        if not incorrect_data:
            return {"weaknesses": [], "recommendations": "Practice more to see your analytics!"}
            
        all_text = " ".join([d.get("question", "") + " " + d.get("correct_answer", "") for d in incorrect_data])
        
        # Use existing POS logic for consistency
        tokens = word_tokenize(all_text)
        tagged = pos_tag(tokens)
        keywords = [word for word, pos in tagged if pos in ('NN', 'NNS', 'NNP') and len(word) > 4]
            
        common = Counter(keywords).most_common(3)
        weaknesses = [k[0] for k in common]
        
        return {
            "weaknesses": weaknesses,
            "recommendations": f"Focus on reviewing concepts related to: {', '.join(weaknesses)}." if weaknesses else "Keep practicing to identify specific areas for improvement."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
