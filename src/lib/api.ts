/**
 * API client for InternIQ.
 *
 * analyzeCV attaches the Clerk session token as a Bearer token so the
 * backend can verify the request via Clerk's JWKS endpoint.
 *
 * getToken() is passed in from the calling component (OptimizePage) via
 * Clerk's useAuth() hook — we don't import Clerk here to keep this file
 * framework-agnostic and easily testable.
 */

const API_BASE = "/api";

// ── Analysis ──────────────────────────────────────────────────────────────────

export async function analyzeCV(
  cvFile: File,
  jobDescription: string,
  getToken: () => Promise<string | null>,
): Promise<AnalyzeResponse> {
  const token = await getToken();

  if (!token) {
    throw new Error("No active session. Please sign in and try again.");
  }

  const formData = new FormData();
  formData.append("cv", cvFile);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error: ${response.status}`);
  }

  return response.json();
}


// ── Payments ──────────────────────────────────────────────────────────────────

export async function getPaymentStatus(
  getToken: () => Promise<string | null>,
): Promise<PaymentStatus> {
  const token = await getToken();
  if (!token) throw new Error("No active session.");

  const response = await fetch(`${API_BASE}/payments/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error: ${response.status}`);
  }

  return response.json();
}

export async function createCheckout(
  priceId: string,
  mode: "subscription" | "payment",
  getToken: () => Promise<string | null>,
): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error("No active session.");

  const response = await fetch(`${API_BASE}/payments/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ price_id: priceId, mode }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string;
}

export async function getBillingPortal(
  getToken: () => Promise<string | null>,
): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error("No active session.");

  const response = await fetch(`${API_BASE}/payments/portal`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? `Server error: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string;
}


// ── Types ─────────────────────────────────────────────────────────────────────

interface ATSScore {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
}

interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  recommended: string[];
}

interface BulletFeedback {
  original: string;
  improved: string;
  reason: string;
}

interface SectionScore {
  name: string;
  score: number;
  feedback: string;
}

interface AnalysisResult {
  ats: ATSScore;
  keywords: KeywordAnalysis;
  bullets: BulletFeedback[];
  sections: SectionScore[];
  overallSuggestions: string[];
  topPriorities: string[];
}

interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
  is_partial?: boolean;
}

export interface PaymentStatus {
  plan: "free" | "pro" | "unlimited";
  sub_status: string;
  topup_credits: number;
  weekly_used: number;
  lifetime_used: number;
}
