import sys
import re

file_path = 'ai-services/src/main.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# --- 1. Fix generate-quiz prompt ---
# In generate_quiz, we need to modify how the prompt is built.
quiz_prompt_regex = r'(                prompt = f"""\s*                Generate a study quiz based on the text below\.\s*                The quiz MUST contain exactly \{num_mcq\} Multiple Choice Questions \(MCQ\) and exactly \{num_essay\} Essay/Short Answer questions\.\s*                \s*)(                For MCQs:.*?\s*                For Essays:.*?\s*                Output the result STRICTLY as a JSON object matching this schema:\s*                \{\{\s*                  "questions": \[)'

# Since the regex might be tricky, let's use a simpler text replacement approach
def patch_quiz_generation(c):
    # This block exists twice (one for fallback, one for main groq)
    # We'll just replace the prompt construction manually
    
    # Let's search for `The quiz MUST contain exactly {num_mcq} Multiple Choice Questions`
    # and replace the static strings.
    new_code = """
                mcq_instruction = f"The quiz MUST contain exactly {num_mcq} Multiple Choice Questions (MCQ)." if num_mcq > 0 else ""
                essay_instruction = f"The quiz MUST contain exactly {num_essay} Essay/Short Answer questions." if num_essay > 0 else ""
                
                mcq_format = \"\"\"
                For MCQs:
                - The questions must be deep, conceptual, and check real-world logic or application.
                - Avoid simple blank fill-ins or direct word matching.
                - Each MCQ must have exactly 4 options.
                - The "options" list must contain the plain texts.
                - The "formatted_options" list must be prefixed with "A. ", "B. ", "C. ", "D. ".
                - One option must be the correct answer.
                - "correct_letter" must be 'A', 'B', 'C', or 'D', matching the correct option.
                - Include a detailed educational "explanation" for why it is correct.
                - A quality "score" between 80 and 100.
                \"\"\" if num_mcq > 0 else ""
                
                essay_format = \"\"\"
                For Essays:
                - The questions must ask the student to explain core concepts, relationships between mechanisms, or summary of main themes in the text.
                - "context" must be a supporting reference sentence from the text.
                - "answer" must be a comprehensive reference master answer.
                - "explanation" must be educational criteria for a correct response.
                \"\"\" if num_essay > 0 else ""
                
                prompt = f\"\"\"
                Generate a study quiz based on the text below. 
                {mcq_instruction}
                {essay_instruction}
                
                {mcq_format}
                
                {essay_format}
                
                Output the result STRICTLY as a JSON object matching this schema:
                {{
                  "questions": [
"""
    # Replace the chunk
    pattern = r'(                prompt = f"""\n                Generate a study quiz based on the text below. \n                The quiz MUST contain exactly \{num_mcq\} Multiple Choice Questions \(MCQ\) and exactly \{num_essay\} Essay/Short Answer questions\.\n                \n                For MCQs:.*?\n                For Essays:.*?\n                Output the result STRICTLY as a JSON object matching this schema:\n                \{\{\n                  "questions": \[)'
    return re.sub(pattern, new_code, c, flags=re.DOTALL)

content = patch_quiz_generation(content)


# --- 2. Fix explain-incorrect ---
explain_regex = r'(        if groq_available:\n            try:\n                \n                prompt = f"""\nYou are an expert tutor explaining a wrong answer to a university student\.\n)(.*?)(\n                "\n                response = model\.generate_content\(\n                    prompt,\n                    generation_config=\{"response_mime_type": "application/json"\}\n                \)\n                payload = json\.loads\(strip_json_markdown\(response\.text\)\))'

explain_replacement = r'''\1Use the deterministic teaching notes below as the factual base. Expand them, do not replace them with vague filler.
Combine the specific context from the user's uploaded text with your own broad, general knowledge of the topic. Your goal is to make the knowledge full and comprehensive.

Question:
{question}

Student answer:
{user_answer}

Correct answer:
{correct_answer}

Context from lesson / source material:
{context}

Full material excerpt selected from the original course text:
{source_reference}

Deterministic teaching notes:
{json.dumps(deterministic_payload, ensure_ascii=False, indent=2)}

Task:
1. Explain the concept deeply and clearly in 2-4 short paragraphs, drawing from both the source excerpt and your broader knowledge of the field.
2. Explain why the student's answer is wrong.
3. Explain the real meaning of the correct answer in this context.
4. Break the concept into a simple concept breakdown with concrete wording.
5. Give one simple memory tip or analogy.
6. Recommend useful search terms for further study.
7. Use the course excerpt directly to ground the explanation. Do NOT answer with vague filler like "key term", "important term", or "essential concept".

Return valid JSON only with this schema:
{{
  "explanation": "full explanation with line breaks",
  "why_wrong": "why the selected answer is incorrect",
  "real_meaning": "what the correct answer actually means in this context",
  "concept_breakdown": "a simple breakdown of the idea in student-friendly language",
  "memory_tip": "a short memory aid",
  "suggestions": "what the student should study next",
  "search_terms": ["term 1", "term 2", "term 3"],
  "source_excerpt": "the most relevant part of the course text used for the answer"
}}
"""
                chat_completion = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a helpful study buddy AI. You output strictly valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3
                )
                payload = json.loads(chat_completion.choices[0].message.content)'''

content = re.sub(explain_regex, explain_replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ai-services/src/main.py")
