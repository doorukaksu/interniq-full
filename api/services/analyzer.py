import json
import os
import anthropic

from api.models import AnalysisResult

# ─── Prompt ───────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert CV reviewer and recruitment consultant specialising in 
graduate and internship applications. You have deep knowledge of ATS (Applicant Tracking Systems),
what top firms in finance, consulting, and tech look for, and how to write high-impact CVs.

You will be given a CV and a job description. Analyse the CV thoroughly and return ONLY a valid 
JSON object — no markdown, no explanation, no preamble. The JSON must exactly match this schema:

{
  "ats": {
    "score": <integer 0-100>,
    "grade": <"A"|"B"|"C"|"D"|"F">,
    "summary": <string — 1-2 sentences explaining the score>
  },
  "keywords": {
    "matched": [<keywords from JD that appear in the CV>],
    "missing": [<important keywords from JD NOT in the CV>],
    "recommended": [<additional keywords that would strengthen the CV for this role>]
  },
  "bullets": [
    {
      "original": <exact bullet text from CV that could be improved>,
      "improved": <your rewritten version — stronger verb, quantified where possible>,
      "reason": <1 sentence explaining the improvement>
    }
  ],
  "sections": [
    {
      "name": <section name e.g. "Work Experience", "Education", "Skills">,
      "score": <integer 0-100>,
      "feedback": <1-2 sentences of specific, actionable feedback>
    }
  ],
  "overall_suggestions": [<list of 3-5 actionable string suggestions>],
  "top_priorities": [<exactly 3 strings — the highest impact fixes, ordered by priority>]
}

Rules:
- bullets array: pick the 3-5 weakest bullet points that most need improvement
- sections: score every section you find in the CV
- top_priorities: must be exactly 3 items — the most impactful changes
- Be specific and honest — this helps students get internships
- Return ONLY the JSON object, nothing else"""


def build_user_prompt(cv_text: str, job_description: str) -> str:
    return f"""=== CV ===
{cv_text}

=== JOB DESCRIPTION ===
{job_description}

Analyse the CV against the job description and return the JSON analysis."""


# ─── Main analyser ────────────────────────────────────────────────────────────

def analyse_cv(cv_text: str, job_description: str) -> AnalysisResult:
    """
    Send CV text and job description to Claude.
    Returns a validated AnalysisResult.
    Raises ValueError if Claude returns unparseable JSON.
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": build_user_prompt(cv_text, job_description),
            }
        ],
    )

    raw = message.content[0].text.strip()

    # Strip markdown code fences if Claude wraps the JSON (safety net)
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Claude returned invalid JSON: {e}\n\nRaw response:\n{raw[:500]}")

    # Validate with Pydantic
    return AnalysisResult(**data)
