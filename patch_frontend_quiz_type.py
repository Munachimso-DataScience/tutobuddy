import sys
import re

file_path = 'frontend/src/app/dashboard/courses/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add quizType state
state_addition = """    const [quizType, setQuizType] = useState<'mixed' | 'objective' | 'theory'>('mixed');
    const [generatingQuiz, setGeneratingQuiz] = useState(false);"""

content = re.sub(r'    const \[generatingQuiz, setGeneratingQuiz\] = useState\(false\);', state_addition, content, count=1)

# 2. Update handleGenerateQuiz payload
axios_payload_regex = r'const response = await axios\.post\(`\$\{API_URL\}/api/quizzes/generate`, \{\s+materialId,\s+adaptiveScore\s+\}'
axios_payload_replacement = """const response = await axios.post(`${API_URL}/api/quizzes/generate`, {
                materialId,
                adaptiveScore,
                quizType
            }"""

content = re.sub(axios_payload_regex, axios_payload_replacement, content)

# 3. Add UI selector before the "Generate Quiz" button
ui_regex = r'(<button[^>]+onClick=\{handleGenerateQuiz\}[^>]*>\s*(?:<Loader2[^>]+>\s*)?Generate Quiz\s*</button>)'

ui_replacement = """<div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                                <div className="flex rounded-md shadow-sm" role="group">
                                    <button
                                        type="button"
                                        onClick={() => setQuizType('mixed')}
                                        className={`px-4 py-2 text-sm font-medium border rounded-l-lg transition-colors ${quizType === 'mixed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'}`}
                                    >
                                        Mixed
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuizType('objective')}
                                        className={`px-4 py-2 text-sm font-medium border-t border-b border-r transition-colors ${quizType === 'objective' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'}`}
                                    >
                                        Objective Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setQuizType('theory')}
                                        className={`px-4 py-2 text-sm font-medium border-t border-b border-r rounded-r-lg transition-colors ${quizType === 'theory' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'}`}
                                    >
                                        Theory Only
                                    </button>
                                </div>
                                \\1
                            </div>"""

content = re.sub(ui_regex, ui_replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend/src/app/dashboard/courses/[id]/page.tsx")
