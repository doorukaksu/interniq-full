import type { AnalyzeResponse } from "../types/analysis";

const API_BASE = "/api";

/**
 * Send a CV (PDF file) and job description to the backend for analysis.
 * Returns structured AnalysisResult or throws on network/server error.
 */
export async function analyzeCV(
  cvFile: File,
  jobDescription: string
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("cv", cvFile);
  formData.append("job_description", jobDescription);

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail ?? `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Add an email to the waitlist.
 */
export async function joinWaitlist(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail ?? `Server error: ${response.status}`);
  }

  return response.json();
}
