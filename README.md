# ALS Speech Assist — Web Frontend

A modern, responsive web application for ALS & dysarthric speech transcription powered by a fine-tuned Whisper model (`whisper-small-torgo`) on FastAPI.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui design system
- **Icons**: Lucide React
- **HTTP / API Communication**: Fetch API
- **Routing**: React Router DOM
- **Audio Upload**: HTML file input + FormData (`audio` parameter)
- **Audio Playback**: Native HTML5 Audio API
- **Deployment**: Vercel ready (with `vercel.json` SPA rewrite rules)

---

## Getting Started

### 1. Prerequisites

Ensure you have Node.js (v18+) and npm installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` if not already present:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## Backend Integration

The web frontend communicates with the FastAPI backend at `http://localhost:8000`.

- **Health Check**: `GET /health`
- **Transcription Endpoint**: `POST /transcribe`
  - Accepts multipart form data with field name: `audio`
  - Expected JSON response:
    ```json
    {
      "text": "predicted transcription"
    }
    ```
- **Live Talk Microphone Feature**:
  - Architecture: Browser Microphone &rarr; MediaRecorder (local chunks) &rarr; ONE complete audio Blob &rarr; `POST /transcribe`
  - Protocol: HTTP multipart/form-data (`audio: UploadFile`)
  - No WebSockets and no silence detection used for this feature
  - Simple 2-click UX: First click starts recording, second click stops, combines into one audio Blob, and posts to `/transcribe`
  - Infinitely repeatable: User can record utterance after utterance seamlessly

To run your FastAPI backend:

```bash
cd ../../Backend
# Activate virtual environment
.venv\Scripts\activate
# Start FastAPI
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Vercel Deployment

1. Push this repository to GitHub or GitLab.
2. Import the project in Vercel:
   - **Root Directory**: `Frontend/Website`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_BASE_URL` pointing to your deployed FastAPI backend URL.
3. The included `vercel.json` handles Single Page Application (SPA) routing rewrites.
