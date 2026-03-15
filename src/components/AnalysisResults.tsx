import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Zap } from "lucide-react";
import type { AnalysisResult } from "../types/analysis";

interface Props {
  result: AnalysisResult;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function gradeColor(grade: string) {
  const map: Record<string, string> = {
    A: "text-green-600 bg-green-50 border-green-200",
    B: "text-blue-600 bg-blue-50 border-blue-200",
    C: "text-yellow-600 bg-yellow-50 border-yellow-200",
    D: "text-orange-600 bg-orange-50 border-orange-200",
    F: "text-red-600 bg-red-50 border-red-200",
  };
  return map[grade] ?? map["C"];
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-2">
      <div
        className={`h-2 rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function ATSScoreCard({ ats }: { ats: AnalysisResult["ats"] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium mb-1">ATS Score</h3>
          <p className="text-sm text-muted-foreground">
            How well your CV passes applicant tracking systems
          </p>
        </div>
        <div
          className={`text-3xl font-bold w-16 h-16 rounded-xl border-2 flex items-center justify-center ${gradeColor(
            ats.grade
          )}`}
        >
          {ats.grade}
        </div>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className="text-4xl font-bold">{ats.score}</span>
        <span className="text-muted-foreground mb-1">/ 100</span>
      </div>
      <ScoreBar score={ats.score} />
      <p className="text-sm text-muted-foreground mt-3">{ats.summary}</p>
    </div>
  );
}

function KeywordsCard({ keywords }: { keywords: AnalysisResult["keywords"] }) {
  const matched = keywords?.matched ?? [];
  const missing = keywords?.missing ?? [];
  const recommended = keywords?.recommended ?? [];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4">Keyword Analysis</h3>

      <div className="space-y-4">
        {/* Matched */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">
              Matched ({matched.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.length > 0 ? (
              matched.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-xs"
                >
                  {kw}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">None found</span>
            )}
          </div>
        </div>

        {/* Missing */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">
              Missing ({missing.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.length > 0 ? (
              missing.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-md text-xs"
                >
                  {kw}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">
                Great — no missing keywords!
              </span>
            )}
          </div>
        </div>

        {/* Recommended */}
        {recommended.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">
                Recommended to add ({recommended.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommended.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-xs"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BulletPointsCard({ bullets }: { bullets: AnalysisResult["bullets"] }) {
  const safeB = bullets ?? [];
  if (safeB.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5" />
        <h3 className="text-lg font-medium">Bullet Point Improvements</h3>
      </div>
      <div className="space-y-4">
        {safeB.map((b, i) => (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <div className="p-3 bg-red-50 border-b border-red-100">
              <p className="text-xs font-medium text-red-600 mb-1">Original</p>
              <p className="text-sm text-red-800">{b.original}</p>
            </div>
            <div className="p-3 bg-green-50 border-b border-green-100">
              <p className="text-xs font-medium text-green-600 mb-1">Improved</p>
              <p className="text-sm text-green-800">{b.improved}</p>
            </div>
            <div className="p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Why: </span>
                {b.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionScoresCard({ sections }: { sections: AnalysisResult["sections"] }) {
  const safeS = sections ?? [];
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-medium mb-4">Section Scores</h3>
      <div className="space-y-4">
        {safeS.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{s.name}</span>
              <span className="text-sm text-muted-foreground">{s.score}/100</span>
            </div>
            <ScoreBar score={s.score} />
            <p className="text-xs text-muted-foreground mt-1">{s.feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopPrioritiesCard({ priorities }: { priorities: string[] }) {
  const safeP = priorities ?? [];
  return (
    <div className="bg-primary text-primary-foreground rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5" />
        <h3 className="text-lg font-medium">Top 3 Priorities</h3>
      </div>
      <p className="text-sm text-primary-foreground/70 mb-4">
        Fix these first for the biggest impact.
      </p>
      <ol className="space-y-3">
        {safeP.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary-foreground/20 text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-primary-foreground/90">{p}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function AnalysisResults({ result }: Props) {
  // Handle both camelCase (frontend) and snake_case (direct from Python API)
  const topPriorities = result.topPriorities ?? (result as any).top_priorities ?? [];
  const overallSuggestions = result.overallSuggestions ?? (result as any).overall_suggestions ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <TopPrioritiesCard priorities={topPriorities} />
      <ATSScoreCard ats={result.ats} />
      <KeywordsCard keywords={result.keywords} />
      <SectionScoresCard sections={result.sections} />
      <BulletPointsCard bullets={result.bullets} />

      {overallSuggestions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-medium mb-4">Additional Suggestions</h3>
          <ul className="space-y-2">
            {overallSuggestions.map((s: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
