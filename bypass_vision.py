import sys
import re

with open('ai-services/src/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix ocr_evaluate to skip Groq and use Tesseract directly
ocr_eval_target = '''        # --- Premium Gemini Vision Path ---
        if groq_available:
            print("Processing general OCR via Gemini Vision...")
            try:
                
                image_part = {
                    "mime_type": file.content_type or "image/png",
                    "data": img_bytes
                }
                
                prompt = f"""
                You are an expert OCR and educational document analyzer.
                I have attached an image of a student's study notes or textbook page.
                
                Please transcribe all readable text from the image verbatim. 
                Then evaluate the quality of the notes.
                
                Output the result STRICTLY as a JSON object matching this schema:
                {{
                  "text": "the transcribed text",
                  "evaluation": {{
                    "word_count": 150,
                    "readability": "Clear/Messy/Faded",
                    "feedback": "constructive feedback on note organization"
                  }}
                }}
                """
                text_content = get_groq_completion(prompt, response_format={"type": "json_object"})
                text_content = strip_json_markdown(text_content)
                result = json.loads(text_content)
                print(f"General OCR Gemini transcription complete! Word count: {result.get('evaluation', {}).get('word_count')}")
                return result
            except Exception as gemini_err:
                print(f"General OCR Gemini vision failed: {gemini_err}. Falling back to Tesseract...")'''

ocr_eval_replacement = '''        # --- Premium Gemini Vision Path ---
        # Groq text models do not support vision yet. Bypassing directly to Local Tesseract Fallback.
        if False:
            pass'''

content = content.replace(ocr_eval_target, ocr_eval_replacement)

# Fix evaluate_handwritten to skip Groq
eval_hw_target = '''        # --- Premium Gemini Vision Path ---
        if groq_available:
            print("Evaluating Handwritten Answer via Gemini Vision...")
            try:
                
                image_part = {
                    "mime_type": file.content_type or "image/png",
                    "data": img_bytes
                }
                
                prompt = f"""
                You are an expert university professor grading a student's handwritten answer.
                
                Question: {question}
                Reference Answer / Context: {reference_answer}
                
                First, transcribe the student's handwritten answer from the image.
                Second, grade the transcribed answer against the reference context.
                
                Output STRICTLY as a JSON object matching this schema:
                {{
                    "extracted_text": "the student's exact handwritten text",
                    "score": 85,
                    "relevance": "High/Medium/Low",
                    "feedback": "Detailed explanation of what they got right and wrong",
                    "improvement_tips": "Specific advice on what to study to get 100%",
                    "master_concept": "A one sentence summary of the core concept they must remember",
                    "links": [
                        {{"title": "Wikipedia", "url": "https://en.wikipedia.org/wiki/...", "type": "article"}}
                    ]
                }}
                """
                text_content = get_groq_completion(prompt, response_format={"type": "json_object"})
                text_content = strip_json_markdown(text_content)
                result = json.loads(text_content)
                print(f"Gemini vision grading complete! Score: {result.get('score')}%")
                return result
            except Exception as gemini_err:
                print(f"Gemini vision grading failed: {gemini_err}. Falling back to Tesseract...")'''

eval_hw_replacement = '''        # --- Premium Gemini Vision Path ---
        # Groq text models do not support vision yet. Bypassing directly to Local Tesseract Fallback.
        if False:
            pass'''

content = content.replace(eval_hw_target, eval_hw_replacement)

with open('ai-services/src/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
