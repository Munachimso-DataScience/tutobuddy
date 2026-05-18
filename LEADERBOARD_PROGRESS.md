# Leaderboard Progress Log

## Current state
- The leaderboard page now fetches live ranking data from the backend.
- The page uses the logged-in user's JWT to request `/api/leaderboard`.
- The backend calculates XP from real profile, course, quiz, and activity data.

## Why it looks non-dynamic
- This is now resolved.
- Rankings, global rank, league counts, and the current user highlight are all data-backed.

## What we should do next
1. Decide whether the XP formula needs tuning.
2. Add pagination or infinite scroll if the user base grows large.
3. Consider caching the leaderboard if the query becomes expensive.

## Notes
- The current UI is still the same polished design, but now the numbers are live.
- The leaderboard is filtered client-side by league and search.
