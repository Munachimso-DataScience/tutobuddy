# Analytics Progress Log

## Why weakness labels showed `Unknown`
- The weakness pipeline was analyzing placeholder text like `Unknown question` and `N/A`.
- Older quiz-inaccurate logs may not have had the same detail keys as newer logs.
- The AI analyzer then extracted generic nouns from those placeholders, which surfaced as junk labels.

## What we changed
- Normalized and filtered the backend payload in `backend/src/controllers/analyticsController.ts`.
- Made the AI weakness analyzer ignore generic terms like `question`, `unknown`, `answer`, and `concept`.

## Result
- Weakness areas should now come from real subject terms instead of placeholder text.
- If older bad logs still exist, they are now less likely to pollute the analysis.

## Next checks
1. Re-run a few quizzes and confirm the new incorrect-answer logs produce meaningful weakness labels.
2. If needed, add a data cleanup script for legacy placeholder activity entries.

