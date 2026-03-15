// ─── Analysis Types ────────────────────────────────────────────────────────
// All shared types for the CV analysis feature.
// Add new analysis categories here as the product grows.

export interface ATSScore {
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  summary: string;
}

export interface KeywordAnalysis {
  matched: string[];
  missing: string[];
  recommended: string[];
}

export interface BulletFeedback {
  original: string;
  improved: string;
  reason: string;
}

export interface SectionScore {
  name: string;
  score: number; // 0–100
  feedback: string;
}

export interface AnalysisResult {
  ats: ATSScore;
  keywords: KeywordAnalysis;
  bullets: BulletFeedback[];
  sections: SectionScore[];
  overallSuggestions: string[];
  topPriorities: string[]; // max 3 — the most impactful fixes
}

export interface AnalyzeRequest {
  jobDescription: string;
  // cv text is extracted server-side from the uploaded PDF
}

export interface AnalyzeResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
}
