import { useState, useRef, useEffect } from "react";
import { Upload, ArrowLeft, Loader2, RotateCcw, ShieldCheck, FileText, LogOut, UserCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { analyzeCV } from "../lib/api";
import AnalysisResults from "./AnalysisResults";
import UpgradeModal from "./UpgradeModal";
import { useUserStatus } from "../hooks/useUserStatus";
import type { AnalysisResult } from "../types/analysis";

type AppState = "idle" | "analyzing" | "results" | "error";
type UpgradeReason = "free_limit_reached" | "pro_weekly_limit_reached";

export default function OptimizePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userStatus = useUserStatus();

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isPartial, setIsPartial] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null);

  // Refetch status after a successful Stripe checkout redirect
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      userStatus.refetch();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload a PDF file.");
      setAppState("error");
      return;
    }
    setUploadedFile(file);
    setPdfDataUrl(URL.createObjectURL(file));
    setResult(null);
    setAppState("idle");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload a PDF file.");
      setAppState("error");
      return;
    }
    setUploadedFile(file);
    setPdfDataUrl(URL.createObjectURL(file));
    setResult(null);
    setAppState("idle");
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPdfDataUrl(null);
    setResult(null);
    setAppState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !jobDescription.trim()) return;
    setAppState("analyzing");
    setErrorMessage("");
    try {
      const response = await analyzeCV(uploadedFile, jobDescription, getToken);
      if (response.success && response.result) {
        setResult(response.result);
        setIsPartial(response.is_partial ?? false);
        setAppState("results");
        userStatus.refetch();
      } else {
        throw new Error(response.error ?? "Analysis failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      // Usage limit errors — show upgrade modal instead of inline error
      if (msg === "free_limit_reached" || msg === "pro_weekly_limit_reached") {
        setUpgradeReason(msg as UpgradeReason);
        setAppState("idle");
      } else {
        setErrorMessage(msg);
        setAppState("error");
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isRateLimited = errorMessage.toLowerCase().includes("too many requests");
  const canAnalyze = !!uploadedFile && jobDescription.trim().length > 20;

  const displayName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "there";

  // Usage counter label shown in nav
  const usageLabel = (() => {
    if (userStatus.isLoading) return null;
    if (userStatus.plan === "pro") return `${userStatus.weekly_used}/10 this week`;
    if (userStatus.plan === "free") return `${userStatus.lifetime_used}/1 free`;
    return null; // unlimited — no counter needed
  })();

  return (
    <>
      {upgradeReason && (
        <UpgradeModal
          reason={upgradeReason}
          topupCredits={userStatus.topup_credits}
          onClose={() => setUpgradeReason(null)}
        />
      )}
    <div className="iq-root" style={{ backgroundImage: "none", background: "var(--bg)" }}>
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">CV Analysis Tool</span>
          <div className="iq-nav-links">
            <button onClick={() => navigate("/")} className="iq-btn-ghost">
              <ArrowLeft size={13} /> Home
            </button>
            {usageLabel && (
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-4)",
                padding: "4px 8px",
                background: "var(--bg-sunken)",
                borderRadius: "var(--radius-sm)",
              }}>
                {usageLabel}
              </span>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "8px",
              borderLeft: "1px solid var(--border)",
            }}>
              <button
                onClick={() => navigate("/account")}
                title="Account"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  padding: "4px 6px",
                  borderRadius: "var(--radius-sm)",
                  transition: "color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.background = "var(--border)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "var(--ink-4)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <UserCircle size={13} />
                {displayName}
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-4)",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "var(--radius-sm)",
                  transition: "color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "var(--ink)";
                  e.currentTarget.style.background = "var(--border)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "var(--ink-4)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Results — full page two-column layout */}
      {appState === "results" && result ? (
        <>
          <div style={{ padding: "32px var(--pad) 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ maxWidth: "var(--max-w)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  Analysis complete
                </p>
                <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
                  {uploadedFile?.name ?? "Your CV"}
                </h1>
              </div>
              <button
                onClick={() => { setResult(null); setAppState("idle"); setErrorMessage(""); }}
                className="iq-btn-ghost"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <RotateCcw size={13} /> Analyse again
              </button>
            </div>
          </div>
          <div style={{
            maxWidth: "var(--max-w)",
            margin: "0 auto",
            padding: "32px var(--pad) 64px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            alignItems: "start",
          }}>
            <AnalysisResults result={result} isPartial={isPartial} column="left" />
            <AnalysisResults result={result} isPartial={isPartial} column="right" />
          </div>
        </>
      ) : null}

      {/* Input layout — hidden when results showing */}
      {appState !== "results" && (
      <>
      {/* Page header */}
      <div className="iq-opt-header">
        <div className="iq-kicker">
          <span className="iq-kicker-line" />Upload · Analyse · Improve
        </div>
        <h1 className="iq-opt-title">Optimise your CV</h1>
        <p className="iq-opt-sub">
          Upload your CV and paste the job description. Your full analysis is ready in under 30 seconds.
        </p>
      </div>

      <div className="iq-section-rule" style={{ margin: "0 var(--pad)" }} />

      {/* Main layout */}
      <div className="iq-opt-layout">

        {/* Left — inputs */}
        <div className="iq-opt-left">

          {/* Upload panel */}
          <div className="iq-opt-panel">
            <div className="iq-opt-panel-header">
              <span className="iq-opt-panel-num">01</span>
              <span className="iq-opt-panel-title">Your CV</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            {!uploadedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="iq-upload-zone"
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  background: "var(--bg-sunken)",
                  borderRadius: "var(--radius)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  color: "var(--ink-3)",
                }}>
                  <Upload size={20} />
                </div>
                <p className="iq-upload-main">Click or drag to upload</p>
                <p className="iq-upload-sub">PDF only · Max 5MB</p>
              </div>
            ) : (
              <div className="iq-file-row">
                <div style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--accent-tint)",
                  border: "1px solid rgba(163,230,53,0.3)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "#4a7c00",
                }}>
                  <FileText size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="iq-file-name">{uploadedFile.name}</p>
                  <p className="iq-file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={handleRemoveFile} className="iq-file-remove">Remove</button>
              </div>
            )}

            <div className="iq-privacy-note">
              <ShieldCheck size={12} style={{ flexShrink: 0, marginTop: "1px", color: "var(--ink-4)" }} />
              <span>
                Your CV is processed in memory and{" "}
                <strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>never stored</strong>.
                Analysis is performed by{" "}
                <strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>Anthropic Claude API (US-based)</strong>
                {" "}and deleted immediately after.{" "}
                <a href="/privacy" style={{ color: "var(--accent-dim)", textDecoration: "underline" }}>
                  Privacy policy
                </a>
              </span>
            </div>
          </div>

          {/* Job description panel */}
          <div className="iq-opt-panel">
            <div className="iq-opt-panel-header">
              <span className="iq-opt-panel-num">02</span>
              <span className="iq-opt-panel-title">Job description</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job listing here — requirements, responsibilities, qualifications..."
              className="iq-textarea"
            />
            <div className="iq-char-count">
              {jobDescription.length} characters
              {jobDescription.length < 20 && jobDescription.length > 0 && (
                <span style={{ color: "var(--accent-dim)", marginLeft: "8px" }}>
                  — add more detail for better results
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {appState === "error" && (
            <div className={`iq-error-box ${isRateLimited ? "iq-error-warn" : ""}`}>
              <p className="iq-error-title">
                {isRateLimited ? "Rate limit reached" : "Analysis failed"}
              </p>
              <p className="iq-error-msg">{errorMessage}</p>
            </div>
          )}

          {/* Analyse button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || appState === "analyzing"}
            className="iq-btn-primary iq-analyse-btn"
          >
            {appState === "analyzing" ? (
              <><Loader2 size={14} className="iq-spin" /> Analysing your CV...</>
            ) : (
              "Analyse CV"
            )}
          </button>

          {!uploadedFile && !jobDescription && (
            <p style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--ink-4)",
              textAlign: "center",
            }}>
              Upload your CV and paste a job description to begin
            </p>
          )}
        </div>

        {/* Right — preview / analyzing state */}
        <div className="iq-opt-right">
          {appState === "analyzing" ? (
            <div className="iq-opt-panel iq-analyzing-state">
              <div style={{
                width: "48px",
                height: "48px",
                background: "var(--accent-tint)",
                border: "1px solid rgba(163,230,53,0.3)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#4a7c00",
              }}>
                <Loader2 size={22} className="iq-spin" />
              </div>
              <p className="iq-analyzing-title">Analysing your CV</p>
              <p className="iq-analyzing-sub">Checking ATS score, keywords, bullet strength...</p>
            </div>
          ) : pdfDataUrl ? (
            <div className="iq-opt-panel" style={{ padding: 0, overflow: "hidden", height: "calc(100vh - 280px)", minHeight: "400px" }}>
              <div className="iq-opt-panel-header">
                <span className="iq-opt-panel-num">03</span>
                <span className="iq-opt-panel-title">CV Preview</span>
              </div>
              <iframe
                src={pdfDataUrl}
                style={{ width: "100%", height: "calc(100% - 49px)", border: "none" }}
                title="CV Preview"
              />
            </div>
          ) : (
            <div className="iq-opt-panel iq-empty-preview">
              <div style={{
                width: "48px",
                height: "48px",
                background: "var(--bg-sunken)",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-4)",
                marginBottom: "16px",
              }}>
                <FileText size={22} />
              </div>
              <p className="iq-empty-title">CV preview</p>
              <p className="iq-empty-sub">
                Your CV will appear here after upload. Results will show here after analysis.
              </p>
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* Footer */}
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo" style={{ cursor: "default", fontSize: "16px" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <p className="iq-footer-copy">© 2026 InternIQ</p>
          <div className="iq-footer-links">
            <a href="/privacy" className="iq-footer-link">Privacy</a>
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}