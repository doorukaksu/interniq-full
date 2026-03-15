# InternIQ — CV Analyser

AI-powered CV optimiser for internship applicants. Upload a CV PDF + job description → get ATS score, keyword gaps, bullet rewrites, and section scores.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind v4 + shadcn/ui |
| Backend | Python 3.12 + FastAPI |
| AI | Anthropic Claude (claude-sonnet-4) |
| Deploy | Vercel (frontend + serverless API) |

---

## Local Development

### 1. Get your Anthropic API key
Go to [console.anthropic.com](https://console.anthropic.com), create a key, copy it.

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and paste your ANTHROPIC_API_KEY
```

### 3. Install frontend dependencies
```bash
npm install
```

### 4. Install backend dependencies
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 5. Run both servers

**Backend (terminal 1):**
```bash
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

**Frontend (terminal 2):**
```bash
npm run dev
```

Frontend → http://localhost:5173  
API docs → http://localhost:8000/docs

---

## Deploying to Vercel

1. Push your repo to GitHub
2. Import the project in [vercel.com](https://vercel.com)
3. Add your environment variable in Vercel dashboard:
   - `ANTHROPIC_API_KEY` = your key
4. Deploy — Vercel handles the rest

> The `vercel.json` file routes all `/api/*` requests to the FastAPI serverless function automatically.

---

## Project Structure

```
├── api/                      # FastAPI backend
│   ├── index.py              # Vercel serverless entry point
│   ├── main.py               # App + middleware setup
│   ├── models.py             # Pydantic schemas
│   ├── routers/
│   │   ├── analyze.py        # POST /api/analyze
│   │   └── waitlist.py       # POST /api/waitlist
│   └── services/
│       ├── analyzer.py       # Claude prompt + response parsing
│       ├── cv_parser.py      # PDF text extraction
│       └── waitlist.py       # Email storage (swap for DB here)
│
├── src/                      # React frontend
│   ├── components/
│   │   ├── OptimizePage.tsx  # Main upload + results page
│   │   ├── AnalysisResults.tsx # Results display component
│   │   └── HomePage.tsx      # Landing page
│   ├── lib/
│   │   └── api.ts            # All fetch calls to the backend
│   └── types/
│       └── analysis.ts       # Shared TypeScript types
│
├── .env.example              # Required env vars
├── requirements.txt          # Python deps
├── vercel.json               # Vercel routing config
└── package.json              # Node deps
```

---

## Adding New Analysis Features

The analyzer is designed to be extended. To add a new analysis category (e.g. cover letter check, LinkedIn optimiser):

1. Add new fields to `AnalysisResult` in `api/models.py`
2. Update the `SYSTEM_PROMPT` in `api/services/analyzer.py` to request the new fields
3. Add the matching TypeScript types in `src/types/analysis.ts`
4. Add a new display card in `src/components/AnalysisResults.tsx`

---

## Swapping the Waitlist Store for a Database

The waitlist currently uses a local JSON file. To upgrade to Supabase:

1. `pip install supabase`
2. Open `api/services/waitlist.py`
3. Replace `_load()` and `_save()` with Supabase client calls
4. Add `SUPABASE_URL` and `SUPABASE_KEY` to your `.env`
