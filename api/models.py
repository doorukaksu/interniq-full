from pydantic import BaseModel, Field
from typing import Literal


# ─── ATS ──────────────────────────────────────────────────────────────────────

class ATSScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    grade: Literal["A", "B", "C", "D", "F"]
    summary: str


# ─── Keywords ─────────────────────────────────────────────────────────────────

class KeywordAnalysis(BaseModel):
    matched: list[str]
    missing: list[str]
    recommended: list[str]


# ─── Bullets ──────────────────────────────────────────────────────────────────

class BulletFeedback(BaseModel):
    original: str
    improved: str
    reason: str


# ─── Sections ─────────────────────────────────────────────────────────────────

class SectionScore(BaseModel):
    name: str
    score: int = Field(..., ge=0, le=100)
    feedback: str


# ─── Full Result ──────────────────────────────────────────────────────────────

class AnalysisResult(BaseModel):
    ats: ATSScore
    keywords: KeywordAnalysis
    bullets: list[BulletFeedback]
    sections: list[SectionScore]
    overall_suggestions: list[str]
    top_priorities: list[str] = Field(..., max_length=3)


# ─── Response wrapper ─────────────────────────────────────────────────────────

class AnalyzeResponse(BaseModel):
    success: bool
    result: AnalysisResult | None = None
    error: str | None = None
    is_partial: bool = False  # True for free-tier users — some fields are masked


# ─── Payments ─────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    price_id: str
    mode: Literal["subscription", "payment"]


class CheckoutResponse(BaseModel):
    url: str


class PaymentStatusResponse(BaseModel):
    plan: Literal["free", "pro", "unlimited"]
    sub_status: str
    topup_credits: int
    weekly_used: int
    lifetime_used: int
