import sys
import re

with open('ai-services/src/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports and Client Init
content = re.sub(
    r'import google\.generativeai as genai.*?return genai\.GenerativeModel\("gemini-1\.5-flash"\)',
    '''from groq import Groq

# Configure Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_available = False
groq_client = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        groq_available = True
        print("Groq API successfully configured!")
    except Exception as e:
        print(f"Error configuring Groq: {e}")

def get_groq_completion(prompt: str, model_name="llama3-70b-8192", response_format=None):
    if not groq_client:
        raise Exception("Groq client not initialized")
        
    completion_args = {
        "model": model_name,
        "messages": [{"role": "user", "content": prompt}],
    }
    
    if response_format:
        completion_args["response_format"] = response_format
        
    try:
        completion = groq_client.chat.completions.create(**completion_args)
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Failed to load primary model {model_name}: {e}. Trying fallback chain...")
        fallback_model = "mixtral-8x7b-32768"
        completion_args["model"] = fallback_model
        completion = groq_client.chat.completions.create(**completion_args)
        return completion.choices[0].message.content''',
    content,
    flags=re.DOTALL
)

# 2. Quiz Generation
content = content.replace('if gemini_available:', 'if groq_available:')
content = content.replace('print("Running Premium Gemini Quiz Generator...")', 'print("Running Premium Groq Quiz Generator...")')
quiz_gen_old = '''                try:
                    response = model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                except Exception as first_err:
                    print(f"Quiz generation with primary model failed ({first_err}), attempting fallback...")
                    fallback_model = get_gemini_model("gemini-2.0-flash")
                    try:
                        response = fallback_model.generate_content(
                            prompt,
                            generation_config={"response_mime_type": "application/json"}
                        )
                    except Exception:
                        response = fallback_model.generate_content(prompt)
                
                text_content = strip_json_markdown(response.text)'''
quiz_gen_new = '''                text_content = get_groq_completion(prompt, response_format={"type": "json_object"})
                text_content = strip_json_markdown(text_content)'''
content = content.replace(quiz_gen_old, quiz_gen_new)
content = content.replace('model = get_gemini_model("gemini-2.5-flash")', '')
content = content.replace('Gemini Quiz Generation successful!', 'Groq Quiz Generation successful!')
content = content.replace('Gemini response did not contain questions.', 'Groq response did not contain questions.')
content = content.replace('Gemini quiz generation failed', 'Groq quiz generation failed')

# 3. Summarize endpoint
summarize_old = '''                try:
                    response = model.generate_content(prompt)
                except Exception as first_err:
                    print(f"Summary generation with primary model failed ({first_err}), attempting fallback...")
                    fallback_model = get_gemini_model("gemini-2.0-flash")
                    response = fallback_model.generate_content(prompt)
                return {"summary": response.text}'''
summarize_new = '''                text_content = get_groq_completion(prompt)
                return {"summary": text_content}'''
content = content.replace(summarize_old, summarize_new)
content = content.replace('print("Generating Premium Gemini Summary...")', 'print("Generating Premium Groq Summary...")')
content = content.replace('Gemini summary generation failed', 'Groq summary generation failed')

# 4. Explain Incorrect endpoint
explain_old = '''            model = get_gemini_model("gemini-2.5-flash")
            try:
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            except Exception as first_err:
                fallback_model = get_gemini_model("gemini-2.0-flash")
                response = fallback_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
                
            text_content = strip_json_markdown(response.text)'''
explain_new = '''            text_content = get_groq_completion(prompt, response_format={"type": "json_object"})
            text_content = strip_json_markdown(text_content)'''
content = content.replace(explain_old, explain_new)

# 5. OCR endpoint
ocr_old = '''            model = get_gemini_model("gemini-2.5-flash")
            try:
                response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            except Exception as first_err:
                fallback_model = get_gemini_model("gemini-2.0-flash")
                response = fallback_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            
            text_content = strip_json_markdown(response.text)'''
content = content.replace(ocr_old, explain_new)

with open('ai-services/src/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
