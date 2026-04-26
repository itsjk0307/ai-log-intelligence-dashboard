# AI Log Intelligence Dashboard

A full-stack NLP project that analyzes system logs, classifies severity and issue type, extracts important keywords, and visualizes trends in a modern dark dashboard.

## Tech Stack

- **Backend:** FastAPI, scikit-learn, TF-IDF, Logistic Regression, joblib
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Deployment Targets:** Vercel (frontend), Render/Railway (backend)

## Project Structure

```text
.
├─ backend
│  ├─ main.py
│  ├─ train_model.py
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend
│  ├─ app
│  ├─ package.json
│  └─ Dockerfile
└─ docker-compose.yml
```

## Backend Setup (FastAPI)

1. Create and activate a virtual environment:

   ```bash
   cd backend
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Train models (creates `backend/models/*.joblib`):

   ```bash
   python train_model.py
   ```

4. Run the API:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Test endpoint:

   - `POST /analyze-log`
   - Body:

     ```json
     {
       "text": "Connection lost between device and server"
     }
     ```

## Frontend Setup (Next.js)

1. Install dependencies:

   ```bash
   cd frontend
   npm install
   ```

2. Configure environment variable:

   ```bash
   cp .env.example .env.local
   ```

   Set:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Docker (One-command run)

From project root:

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:8000](http://localhost:8000)

## Deployment

### Frontend on Vercel

1. Import the `frontend` directory as a Vercel project.
2. Set environment variable:
   - `NEXT_PUBLIC_API_URL=https://your-backend-url`
3. Build command: `npm run build`
4. Output/default settings: Next.js defaults.

### Backend on Render

1. Create a new Web Service from the `backend` directory.
2. Build command:

   ```bash
   pip install -r requirements.txt && python train_model.py
   ```

3. Start command:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

4. Deploy and copy service URL into frontend `NEXT_PUBLIC_API_URL`.

### Backend on Railway

1. Create service from the `backend` directory.
2. Add start command:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. Ensure models are generated during build (run `python train_model.py` in build step).

## Notes

- The backend trains two independent classifiers:
  - `log_level`: `error`, `warning`, `info`
  - `issue_category`: `network`, `hardware`, `system`, `performance`, `unknown`
- Keywords are extracted from top TF-IDF features for each input log.
- Frontend persists recent analysis history in `localStorage` and visualizes aggregate distributions.
- Dashboard includes a **Load Demo Scenario** control for interview/demo presentation mode.
