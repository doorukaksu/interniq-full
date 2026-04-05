import { useState } from "react";
import { Zap, CheckCircle2, XCircle, AlertCircle, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "../types/analysis";

interface Props {
  result: AnalysisResult;
  isPartial?: boolean;
  column?: "left" | "right";
}

// ─── Colour helpers ──────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 75) return "#4ade80";
  if (score >= 50) return "#fbbf24";
  return "#f87171";
}

function gradeStyle(grade: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    A: { color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.30)" },
    B: { color: "#60a5fa", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.30)" },
    C: { color: "#fbbf24", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.30)" },
    D: { color: "#fb923c", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.30)" },
    F: { color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.30)" },
  };
  return map[grade] ?? map["C"];
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 600,
        color: "var(--ink-4)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: "16px",
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

// ─── Score bar ───────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ height: "3px", background: "var(--border)", borderRadius: "100px", overflow: "hidden", marginTop: "6px" }}>
      <div style={{
        height: "100%",
        width: `${score}%`,
        background: scoreColor(score),
        borderRadius: "100px",
        transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
      }} />
    </div>
  );
}

// ─── Keyword chip ────────────────────────────────────────────────────────────

function Chip({ label, variant }: { label: string; variant: "matched" | "missing" | "recommended" }) {
  const styles: Record<string, React.CSSProperties> = {
    matched:     { color: "#4ade80", background: "rgba(74,222,128,0.10)",  border: "1px solid rgba(74,222,128,0.22)" },
    missing:     { color: "#f87171", background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" },
    recommended: { color: "#fbbf24", background: "rgba(251,191,36,0.10)",  border: "1px solid rgba(251,191,36,0.22)" },
  };
  return (
    <span style={{
      ...styles[variant],
      fontFamily: "var(--font-mono)",
      fontSize: "11px",
      padding: "3px 10px",
      borderRadius: "100px",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── Collapsible bullet ──────────────────────────────────────────────────────

function BulletItem({ bullet, index }: { bullet: AnalysisResult["bullets"][0]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          padding: "14px 16px",
          background: "var(--bg-elevated)",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--accent-dim)",
            fontWeight: 700,
            flexShrink: 0,
            marginTop: "2px",
          }}>
            {String(index + 1).padStart(2, "0")}
          </span>
          <p style={{ fontSize: "13px", color: "var(--ink-3)", lineHeight: 1.5, margin: 0 }}>
            {bullet.original}
          </p>
        </div>
        <span style={{ color: "var(--ink-4)", flexShrink: 0, marginTop: "2px" }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div>
          <div style={{ padding: "14px 16px", background: "rgba(74,222,128,0.06)", borderTop: "1px solid rgba(74,222,128,0.15)" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#4ade80", fontWeight: 600, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Improved
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink)", lineHeight: 1.5, margin: 0 }}>
              {bullet.improved}
            </p>
          </div>
          <div style={{ padding: "10px 16px", background: "var(--bg-sunken)", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.5, margin: 0 }}>
              <span style={{ color: "var(--ink-4)", fontFamily: "var(--font-mono)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Why — </span>
              {bullet.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Blurred placeholder for free tier ───────────────────────────────────────

function LockedSection({ label }: { label: string }) {
  return (
    <Section label={label}>
      <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{
          padding: "20px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          filter: "blur(4px)",
          userSelect: "none",
          pointerEvents: "none",
        }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["placeholder", "keyword", "example", "locked", "content", "upgrade"].map(w => (
              <Chip key={w} label={w} variant="missing" />
            ))}
          </div>
        </div>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "rgba(14,17,23,0.6)",
          borderRadius: "10px",
        }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>Upgrade to unlock</span>
          <a href="/pricing" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent-dim)", textDecoration: "none" }}>
            View plans →
          </a>
        </div>
      </div>
    </Section>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function AnalysisResults({ result, isPartial = false, column }: Props) {
  const topPriorities = result.topPriorities ?? (result as any).top_priorities ?? [];
  const overallSuggestions = result.overallSuggestions ?? (result as any).overall_suggestions ?? [];
  const matched = result.keywords?.matched ?? [];
  const missing = result.keywords?.missing ?? [];
  const recommended = result.keywords?.recommended ?? [];

  // Two-column mode: left shows ATS + bullets, right shows the rest
  if (column === "right") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {topPriorities.length > 0 && (
          <Section label="Top priorities">
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topPriorities.map((p: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "14px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "10px" }}>
                  <span style={{ width: "22px", height: "22px", background: "var(--accent-tint)", border: "1px solid rgba(163,230,53,0.25)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-dim)", flexShrink: 0, marginTop: "1px" }}>
                    {i + 1}
                  </span>
                  <p style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{p}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Bullet Improvements (moved from left column) ─────────────── */}
        {result.bullets?.length > 0 && (
          <Section label={`Bullet improvements · ${result.bullets.length}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {result.bullets.map((b, i) => (
                <BulletItem key={i} bullet={b} index={i} />
              ))}
            </div>
          </Section>
        )}

        {isPartial ? <LockedSection label="Keyword analysis" /> : (
          <Section label="Keyword analysis">
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {matched.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <CheckCircle2 size={12} style={{ color: "#4ade80" }} />
                    <span style={{ fontSize: "12px", color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>Matched · {matched.length}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{matched.map(kw => <Chip key={kw} label={kw} variant="matched" />)}</div>
                </div>
              )}
              {missing.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <XCircle size={12} style={{ color: "#f87171" }} />
                    <span style={{ fontSize: "12px", color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>Missing · {missing.length}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{missing.map(kw => <Chip key={kw} label={kw} variant="missing" />)}</div>
                </div>
              )}
              {recommended.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <AlertCircle size={12} style={{ color: "#fbbf24" }} />
                    <span style={{ fontSize: "12px", color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>Recommended · {recommended.length}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{recommended.map(kw => <Chip key={kw} label={kw} variant="recommended" />)}</div>
                </div>
              )}
            </div>
          </Section>
        )}

        {isPartial ? <LockedSection label="Overall suggestions" /> : overallSuggestions.length > 0 ? (
          <Section label="Overall suggestions">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {overallSuggestions.map((s: string, i: number) => (
                <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ color: "var(--accent-dim)", flexShrink: 0, marginTop: "3px" }}><Lightbulb size={13} /></span>
                  <p style={{ fontSize: "13px", color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>{s}</p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {isPartial && (
          <div style={{ padding: "20px", background: "var(--accent-tint)", border: "1px solid rgba(163,230,53,0.20)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Zap size={16} style={{ color: "var(--accent-dim)", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: "var(--ink-2)", margin: 0 }}>
                <strong style={{ color: "var(--ink)" }}>Unlock full results</strong> — keywords, section scores, and more.
              </p>
            </div>
            <a href="/pricing" style={{ background: "var(--accent-dim)", color: "#fff", fontWeight: 700, fontSize: "13px", padding: "8px 18px", borderRadius: "8px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
              View plans
            </a>
          </div>
        )}
      </div>
    );
  }

  // Left column (or single column fallback) — ATS score + bullets
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── ATS Score ─────────────────────────────────────────────────── */}
      <div style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "20px" }}>
          <div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--ink-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
              ATS Score
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "56px", fontWeight: 800, color: scoreColor(result.ats.score), lineHeight: 1, letterSpacing: "-2px" }}>
                {result.ats.score}
              </span>
              <span style={{ fontSize: "18px", color: "var(--ink-4)", fontWeight: 400 }}>/100</span>
            </div>
          </div>
          <div style={{
            ...gradeStyle(result.ats.grade),
            width: "52px",
            height: "52px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: 800,
            flexShrink: 0,
          }}>
            {result.ats.grade}
          </div>
        </div>

        <div style={{ height: "4px", background: "var(--border)", borderRadius: "100px", overflow: "hidden", marginBottom: "16px" }}>
          <div style={{
            height: "100%",
            width: `${result.ats.score}%`,
            background: scoreColor(result.ats.score),
            borderRadius: "100px",
            transition: "width 1s cubic-bezier(0.25,0.46,0.45,0.94)",
          }} />
        </div>

        <p style={{ fontSize: "14px", color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>
          {result.ats.summary}
        </p>
      </div>

      {/* ── Section Scores ────────────────────────────────────────────── */}
      {isPartial ? <LockedSection label="Section scores" /> : result.sections?.length > 0 ? (
        <Section label="Section scores">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {result.sections.map(s => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>{s.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: scoreColor(s.score), fontWeight: 600 }}>{s.score}</span>
                </div>
                <ScoreBar score={s.score} />
                <p style={{ fontSize: "12px", color: "var(--ink-4)", marginTop: "5px", lineHeight: 1.5 }}>{s.feedback}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

    </div>
  );
}
