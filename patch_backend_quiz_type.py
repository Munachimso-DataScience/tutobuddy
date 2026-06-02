import sys
import re

file_path = 'backend/src/controllers/quizController.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update extract variables
extract_regex = r'        const \{ materialId, adaptiveScore \} = req\.body;'
extract_replacement = r'        const { materialId, adaptiveScore, quizType } = req.body;'
content = re.sub(extract_regex, extract_replacement, content)

# 2. Update adaptiveConfig
adaptive_regex = r'        const adaptiveConfig = buildAdaptiveQuizConfig\(adaptiveDifficulty\);'
adaptive_replacement = """        const adaptiveConfig = buildAdaptiveQuizConfig(adaptiveDifficulty);
        
        // Override counts based on quizType
        let finalNumMcq = adaptiveConfig.num_mcq;
        let finalNumEssay = adaptiveConfig.num_essay;
        const totalQuestions = finalNumMcq + finalNumEssay;
        
        if (quizType === 'objective') {
            finalNumMcq = totalQuestions;
            finalNumEssay = 0;
        } else if (quizType === 'theory') {
            finalNumMcq = 0;
            finalNumEssay = totalQuestions;
        }"""
content = re.sub(adaptive_regex, adaptive_replacement, content)

# 3. Update AI Request Payload
# Let's find the axios.post to generate-quiz
#          num_mcq: adaptiveConfig.num_mcq,
#          num_essay: adaptiveConfig.num_essay,

ai_post_regex = r'        const quizRes = await axios\.post\(`\$\{finalAiUrl\}/generate-quiz`, \{([^\}]+)\}, \{ timeout: 300000 \}\);'

def replace_post(match):
    inner = match.group(1)
    inner = inner.replace('num_mcq: adaptiveConfig.num_mcq,', 'num_mcq: finalNumMcq,')
    inner = inner.replace('num_essay: adaptiveConfig.num_essay,', 'num_essay: finalNumEssay,')
    inner = inner.replace('num_questions: adaptiveConfig.num_mcq + adaptiveConfig.num_essay,', 'num_questions: finalNumMcq + finalNumEssay,')
    return f'        const quizRes = await axios.post(`${{finalAiUrl}}/generate-quiz`, {{{inner}}}, {{ timeout: 300000 }});'

content = re.sub(ai_post_regex, replace_post, content)

# Also update the logging statement
log_regex = r'        console\.log\(`Requesting adaptive quiz \(\$\{adaptiveConfig\.num_mcq\} MCQs, \$\{adaptiveConfig\.num_essay\} Essays\) from AI for \$\{text\.length\} chars\.\.\.`\);'
log_replacement = r'        console.log(`Requesting adaptive quiz (${finalNumMcq} MCQs, ${finalNumEssay} Essays) from AI for ${text.length} chars...`);'
content = re.sub(log_regex, log_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated backend/src/controllers/quizController.ts")
