import { useState, useRef } from "react";
import { Upload, ArrowLeft, Loader2, RotateCcw, ShieldCheck, FileText, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { analyzeCV } from "../lib/api";
import AnalysisResults from "./AnalysisResults";
import type { AnalysisResult } from "../types/analysis";

type AppState = "idle" | "analyzing" | "results" | "error";

export default function OptimizePage() {
  const navigate = useNavigate();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

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
        setAppState("results");
      } else {
        throw new Error(response.error ?? "Analysis failed.");
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setAppState("error");
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

  return (
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
            {appState === "results" && (
              <button
                onClick={() => { setResult(null); setAppState("idle"); setErrorMessage(""); }}
                className="iq-btn-ghost"
              >
                <RotateCcw size={13} /> Analyse again
              </button>
            )}
            <button onClick={() => navigate("/")} className="iq-btn-ghost">
              <ArrowLeft size={13} /> Home
            </button>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingLeft: "8px",
              borderLeft: "1px solid var(--border)",
            }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--ink-4)",
              }}>
                {displayName}
              </span>
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
                Deleted immediately after analysis.{" "}
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

        {/* Right — preview / results */}
        <div className="iq-opt-right">
          {appState === "results" && result ? (
            <AnalysisResults result={result} />
          ) : appState === "analyzing" ? (
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
  );
}