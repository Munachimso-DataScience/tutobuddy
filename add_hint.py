import sys
import re

file_path = 'ai-services/src/main.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

hint_endpoint = '''
@app.post("/get-hint")
async def get_hint(data: dict):
    try:
        question = data.get("question", "")
        correct_answer = data.get("correct_answer", "")
        
        if not question:
            raise HTTPException(status_code=400, detail="Missing question")
            
        prompt = f"""
You are a helpful AI tutor. A student is struggling with the following question:
Question: {question}
Correct Answer: {correct_answer}

Provide a brief, encouraging hint that points them in the right direction without directly giving away the answer. Keep it to 1-2 short sentences.
Return valid JSON only:
{{
    "hint": "your hint here"
}}
"""
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful study buddy AI. You output strictly valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        payload = json.loads(chat_completion.choices[0].message.content)
        return payload
    except Exception as e:
        print(f"Hint Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
'''

# Add it before the final app run or just at the end of the file
if "@app.post(\"/get-hint\")" not in content:
    # Let's insert it before the if __name__ == "__main__":
    content = content.replace('if __name__ == "__main__":', hint_endpoint + '\nif __name__ == "__main__":')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added /get-hint endpoint")
else:
    print("Endpoint already exists")
