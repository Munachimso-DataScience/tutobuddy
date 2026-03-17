# TutorBuddy Migration & Connection Guide

Follow these steps to move your app to high-performance free hosting.

## 1. AI Service (Hugging Face Spaces) - 16GB RAM
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. **Name:** `tutorbuddy-ai`
3. **SDK:** Select **Docker**.
4. **Hardware:** Select **CPU Basic (Free • 2 vCPU • 16GB RAM)**.
5. **Privacy:** Public (to allow your backend to reach it).
6. **Upload:** Upload everything inside your `ai-services` folder (including the new `Dockerfile`).
7. **Wait:** It will build. Once "Running," your URL will look like: `https://[username]-tutorbuddy-ai.hf.space`

---

## 2. Frontend (Vercel) - Fast Next.js
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New > Project**.
3. Import your `tutobuddy` repository.
4. **Configuration:**
   - **Root Directory:** select `frontend`.
   - **Framework Preset:** Next.js.
5. **Environment Variables:** Add these:
   - `NEXT_PUBLIC_API_URL`: (Your Render Backend URL, e.g., `https://tutobuddy-backend.onrender.com`)
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`: `https://fra.cloud.appwrite.io/v1`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`: `tutorbuddy`
6. Click **Deploy**.

---

## 3. The Backend (Connection)
Now, you need to tell your Backend where the new AI service is:
1. Go to your **Render Dashboard** for `tutobuddy-backend`.
2. Go to **Environment**.
3. Update `AI_SERVICE_URL`. Change it from the internal one to your new Hugging Face URL.
   - **Example:** `https://munachimso-tutorbuddy-ai.hf.space`
4. **RESTART** the backend service.

---

## Why this is better:
- **No more 502s:** Hugging Face stays "warm" better and has 32x more RAM than Render Free.
- **Fast Load:** Vercel Global CDN makes your dashboard load in milliseconds.
- **Internal DNS:** We no longer rely on Render's internal DNS (`tutobuddy-ai`), which was causing the `ENOTFOUND` error.
