# OCR Progress Log

## What we have now
- A dedicated OCR route exists at `/dashboard/ocr`.
- The OCR page now has its own landing section, guidance panel, and scanner area.
- The scanner supports:
  - image upload
  - drag and drop
  - preview rendering
  - loading state
  - basic validation
  - reset/retry flow

## Accessibility work completed
- Dashboard icon buttons now have discernible labels.
- Mobile open/close controls have `aria-label` and `title`.
- Notification badge is marked decorative.

## Current issue to watch
- If the browser shows `Failed to load resource: the server responded with a status of 404`, that was coming from the frontend calling the AI service directly on the wrong local URL.
- We moved the browser request to the backend route `/api/ocr/evaluate`.

## What that means
- Local development is now insulated from AI host/port drift.
- The backend now proxies OCR requests to the AI service using `AI_SERVICE_URL`.
- The OCR routes currently available in the AI service are:
  - `POST /ocr-evaluate`
  - `POST /evaluate-handwritten`

## Next debugging steps
1. Check the browser Network tab and identify the exact URL returning 404.
2. Confirm which AI service port is actually running in the current environment.
3. Verify `NEXT_PUBLIC_AI_URL` in the frontend environment matches that running service.
4. If needed, route OCR through the backend for a single stable API surface.

## Suggested next fix
- Keep the browser pointed at the backend for OCR and only let the backend talk to the AI service.
- If deployment changes again, update `AI_SERVICE_URL` in one place instead of touching the frontend.

## Current production failure mode
- If the browser shows `404` for `POST /api/ocr/evaluate`, the deployed backend does not currently expose the OCR route.
- That usually means the live Render deployment is still running an older build or the latest commit has not been deployed yet.
- If the browser shows `net::ERR_CONNECTION_CLOSED`, the backend reached the route but failed while calling the Hugging Face Space.
- The browser session being active is unrelated; login is working and the OCR request is failing later in the chain.

## Production checklist
1. Confirm the backend Render service has auto-deploy enabled for `main`.
2. Trigger a manual redeploy of `tutobuddy-backend`.
3. Verify the deployed commit includes `backend/src/index.ts` with `POST /api/ocr/evaluate`.
4. Only after that, test whether the backend can reach `https://patienceigwe-tutorbuddy-ai.hf.space`.
