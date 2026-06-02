import sys
import re

# 1. FIX FRONTEND
file_path = 'frontend/src/app/dashboard/courses/[id]/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I am going to replace lines 465-468 manually since I know the exact content there.
header_regex = r'                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">\n                            <div>\n                                <h2 className="text-lg font-bold">Study Resources</h2>\n                                <span className="text-sm text-gray-400 font-medium block mt-1">\{materials\.length\} files</span>\n                            </div>\n                            <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end">\n                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quiz Preference</span>\n                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">\n                                    <button \n                                        onClick=\{\(\) => setQuizType\(\'mixed\'\)\}\n                                        className=\{`px-3 py-1\.5 rounded-md text-\[10px\] font-bold transition-all \$\{quizType === \'mixed\' \? \'bg-white dark:bg-gray-700 shadow-sm text-blue-600\' : \'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300\'\}`\}\n                                    >\n                                        Mixed\n                                    </button>\n                                    <button \n                                        onClick=\{\(\) => setQuizType\(\'objective\'\)\}\n                                        className=\{`px-3 py-1\.5 rounded-md text-\[10px\] font-bold transition-all \$\{quizType === \'objective\' \? \'bg-white dark:bg-gray-700 shadow-sm text-blue-600\' : \'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300\'\}`\}\n                                    >\n                                        Objective\n                                    </button>\n                                    <button \n                                        onClick=\{\(\) => setQuizType\(\'theory\'\)\}\n                                        className=\{`px-3 py-1\.5 rounded-md text-\[10px\] font-bold transition-all \$\{quizType === \'theory\' \? \'bg-white dark:bg-gray-700 shadow-sm text-blue-600\' : \'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300\'\}`\}\n                                    >\n                                        Theory\n                                    </button>\n                                </div>\n                            </div>\n                        </div>'

# Let's check if the previous replace_file_content already succeeded!
if 'Quiz Preference' in content:
    print("Frontend already has the selector!")
else:
    print("Wait, replace_file_content said it succeeded earlier! Let me double check.")

