# InternIQ — Claude Code Guide

## What This Project Is

InternIQ is an AI-powered CV optimiser for internship applicants. Users upload a CV (PDF) + job description and receive an ATS score, keyword gap analysis, bullet rewrites, and section scores. It is a live SaaS product deployed at **interniq.co.uk**.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind v4 + shadcn/ui (Radix) + Motion |
| Auth | Clerk (JWT issued to frontend, validated by backend) |
| Backend | Python 3.12 + FastAPI (serverless on Vercel) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Database | Supabase (Postgres) — users, usage, subscriptions |
| Payments | Stripe (Checkout Sessions + webhooks + Billing Portal) |
| Deploy | Vercel (frontend + serverless API functions) |

---

## Project Structure

```
├── api/                         # FastAPI backend (Vercel serverless)
│   ├── index.py                 # Vercel entry point
│   ├── main.py                  # App factory + CORS + router registration
│   ├── models.py                # Pydantic schemas
│   ├── routers/
│   │   ├── analyze.py           # POST /api/analyze
│   │   └── payments.py          # POST /api/payments/checkout
│   │                            # POST /api/payments/webhook
│   │                            # GET  /api/payments/portal
│   │                            # GET  /api/payments/status
│   └── services/
│       ├── analyzer.py          # Claude prompt + JSON parsing → AnalysisResult
│       ├── clerk_auth.py        # Clerk JWT verification (require_auth dependency)
│       ├── cv_parser.py         # PDF → plain text extraction
│       ├── file_validator.py    # PDF validation (size, mime, magic bytes)
│       ├── rate_limiter.py      # IP-based rate limiting (5 req/hr)
│       ├── stripe_service.py    # Checkout, portal, webhook handler
│       ├── supabase_client.py   # Supabase service-role client singleton
│       └── user_service.py      # User upsert, usage checks, credit management
│
├── src/                         # React frontend
│   ├── app/
│   │   ├── App.tsx              # Root component (Clerk provider wrapper)
│   │   └── routes.tsx           # React Router v7 route definitions
│   ├── components/
│   │   ├── HomePage.tsx         # Landing page
│   │   ├── OptimizePage.tsx     # Main upload + results page (protected)
│   │   ├── AnalysisResults.tsx  # Results display (ATS, keywords, bullets, sections)
│   │   ├── PricingPage.tsx      # Pricing tiers
│   │   ├── AccountPage.tsx      # User account + usage stats (protected)
│   │   ├── UpgradeModal.tsx     # Upsell modal for free-tier limits
│   │   ├── ErrorBoundary.tsx
│   │   ├── ImageWithFallback.tsx
│   │   ├── auth/
│   │   │   ├── SignInPage.tsx
│   │   │   ├── SignUpPage.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── legal/
│   │       ├── PrivacyPage.tsx
│   │       └── TermsPage.tsx
│   ├── hooks/                   # Custom React hooks
│   ├── lib/
│   │   └── api.ts               # All fetch calls to the backend
│   ├── styles/
│   ├── types/
│   │   └── analysis.ts          # Shared TypeScript types mirroring Pydantic models
│   └── ui/                      # shadcn/ui component library
```

---

## Business Model & Pricing Tiers

| Plan | Analyses | Notes |
|---|---|---|
| Free | 1 lifetime | Partial results only — ATS + 1 bullet, rest blurred |
| Pro | 10/week | Full results; top-up credits consumed when weekly limit hit |
| Unlimited | Unlimited | Full results always |

**Top-up credits** can be purchased as one-time payments (Stripe `mode: "payment"`). Subscriptions use `mode: "subscription"`.

Free-tier users receive a **partial/masked** `AnalysisResult`: keywords, sections, overall suggestions, and top priorities are stripped — the frontend renders these as blurred placeholder sections with an upgrade CTA.

---

## Data Models (api/models.py)

```
AnalysisResult
  ├── ats: ATSScore              { score: 0-100, grade: A-F, summary }
  ├── keywords: KeywordAnalysis  { matched, missing, recommended }
  ├── bullets: BulletFeedback[]  { original, improved, reason }
  ├── sections: SectionScore[]   { name, score: 0-100, feedback }
  ├── overall_suggestions: str[]
  └── top_priorities: str[3]     (exactly 3, highest-impact fixes)

AnalyzeResponse
  ├── success: bool
  ├── result: AnalysisResult | None
  ├── error: str | None
  └── is_partial: bool           (True for free-tier)

PaymentStatusResponse
  ├── plan: "free" | "pro" | "unlimited"
  ├── sub_status: str
  ├── topup_credits: int
  ├── weekly_used: int
  └── lifetime_used: int
```

---

## Backend Key Details

- **Auth**: All protected endpoints use `Depends(require_auth)` which validates a Clerk JWT. The webhook endpoint skips Clerk auth and uses Stripe signature verification instead.
- **Rate limiting**: IP-based, 5 requests/hour, secondary guard on top of usage limits.
- **CV processing**: PDF bytes are processed in memory, never persisted to disk or DB.
- **Claude prompt**: Returns strict JSON only — parsed directly into `AnalysisResult`. If Claude returns unparseable JSON, `analyse_cv()` raises `ValueError`.
- **Supabase**: Uses service-role key (bypasses RLS). Key Supabase RPCs: `free_usage_count`, `weekly_usage_count`, `consume_topup_credit`.
- **CORS origins**: `https://interniq.co.uk` and `http://localhost:5173`.

---

## Frontend Key Details

- **Router**: React Router v7 (`createBrowserRouter`). `/optimize` and `/account` are protected by `ProtectedRoute`.
- **State**: No global state manager — Clerk handles auth state, API calls are in `src/lib/api.ts`.
- **UI library**: shadcn/ui (Radix primitives) + Tailwind v4. Also uses MUI for some components.
- **Animations**: Motion (Framer Motion successor).

---

## Environment Variables

Required for local dev (`.env`):

```
ANTHROPIC_API_KEY
CLERK_ISSUER
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

The backend fails fast at startup if any of these are missing.

---

## Local Development

```bash
# Backend (terminal 1)
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uvicorn api.main:app --reload --port 8000

# Frontend (terminal 2)
npm run dev
```

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

---

## Extending the Analysis

To add a new analysis field (e.g. cover letter check):
1. Add field to `AnalysisResult` in `api/models.py`
2. Update `SYSTEM_PROMPT` in `api/services/analyzer.py`
3. Add matching TypeScript type in `src/types/analysis.ts`
4. Add display card in `src/components/AnalysisResults.tsx`
5. Update `_apply_partial_mask()` in `api/routers/analyze.py` if field should be gated

---

## Deployment

Vercel handles both frontend and serverless API. `vercel.json` routes `/api/*` to FastAPI. Add all required env vars in the Vercel dashboard before deploying.
