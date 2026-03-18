import { useState, useRef } from "react";
import { Upload, ArrowLeft, Loader2, RotateCcw, ShieldCheck, FileText } from "lucide-react";
import { useNavigate } from "react-router";
import { analyzeCV } from "../lib/api";
import AnalysisResults from "./AnalysisResults";
import type { AnalysisResult } from "../types/analysis";

type AppState = "idle" | "analyzing" | "results" | "error";

export default function OptimizePage() {
  const navigate = useNavigate();
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
      const response = await analyzeCV(uploadedFile, jobDescription);
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

  const isRateLimited = errorMessage.toLowerCase().includes("too many requests");
  const canAnalyze = !!uploadedFile && jobDescription.trim().length > 20;

  return (
    <div className="iq-root" style={{backgroundImage:'none', background:'var(--paper)'}}>
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate("/")} style={{cursor:'pointer'}}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">CV Analysis Tool</span>
          <div className="iq-nav-links">
            {appState === "results" && (
              <button onClick={() => { setResult(null); setAppState("idle"); setErrorMessage(""); }} className="iq-btn-ghost" style={{display:'flex',alignItems:'center',gap:'6px',border:'none',padding:0,background:'none',cursor:'pointer',font:'inherit'}}>
                <RotateCcw size={12}/> Analyse again
              </button>
            )}
            <button onClick={() => navigate("/")} className="iq-btn-ghost" style={{display:'flex',alignItems:'center',gap:'6px',border:'none',padding:0,background:'none',cursor:'pointer',font:'inherit'}}>
              <ArrowLeft size={12}/> Home
            </button>
          </div>
        </div>
      </nav>
      <div className="iq-thick-rule" />

      {/* Page header */}
      <div className="iq-opt-header">
        <div className="iq-kicker"><span className="iq-kicker-line"/>Upload · Analyse · Improve</div>
        <h1 className="iq-opt-title">Optimise your CV</h1>
        <p className="iq-opt-sub">Upload your CV and paste the job description. Your full analysis is ready in under 30 seconds.</p>
      </div>

      <div className="iq-section-rule" style={{margin:'0 var(--pad) 0'}}/>

      {/* Main layout */}
      <div className="iq-opt-layout">

        {/* Left — inputs */}
        <div className="iq-opt-left">

          {/* Upload */}
          <div className="iq-opt-panel">
            <div className="iq-opt-panel-header">
              <span className="iq-opt-panel-num">01</span>
              <span className="iq-opt-panel-title">Your CV</span>
            </div>
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />

            {!uploadedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="iq-upload-zone"
              >
                <Upload size={24} style={{color:'var(--stone)',marginBottom:'10px'}}/>
                <p className="iq-upload-main">Click or drag to upload</p>
                <p className="iq-upload-sub">PDF only · Max 5MB</p>
              </div>
            ) : (
              <div className="iq-file-row">
                <FileText size={20} style={{color:'var(--copper)',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p className="iq-file-name">{uploadedFile.name}</p>
                  <p className="iq-file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={handleRemoveFile} className="iq-file-remove">Remove</button>
              </div>
            )}

            <div className="iq-privacy-note">
              <ShieldCheck size={13} style={{flexShrink:0,color:'var(--stone)'}}/>
              <span>
                Your CV is processed in memory and{" "}
                <strong style={{color:'var(--ink)'}}>never stored</strong>.
                Deleted immediately after analysis.{" "}
                <a href="/privacy" style={{color:'var(--copper)',textDecoration:'underline'}}>Privacy policy</a>
              </span>
            </div>
          </div>

          {/* Job description */}
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
                <span style={{color:'var(--copper)',marginLeft:'8px'}}>— add more detail for better results</span>
              )}
            </div>
          </div>

          {/* Error */}
          {appState === "error" && (
            <div className={`iq-error-box ${isRateLimited ? 'iq-error-warn' : ''}`}>
              <p className="iq-error-title">{isRateLimited ? "Rate limit reached" : "Analysis failed"}</p>
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
              <><Loader2 size={14} className="iq-spin"/> Analysing your CV...</>
            ) : (
              "Analyse CV"
            )}
          </button>

          {!uploadedFile && !jobDescription && (
            <p style={{fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--stone)',textAlign:'center',letterSpacing:'0.06em'}}>
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
              <Loader2 size={28} className="iq-spin" style={{color:'var(--copper)'}}/>
              <p className="iq-analyzing-title">Analysing your CV</p>
              <p className="iq-analyzing-sub">Checking ATS score, keywords, bullet strength...</p>
            </div>
          ) : pdfDataUrl ? (
            <div className="iq-opt-panel" style={{padding:0,overflow:'hidden',height:'calc(100vh - 280px)',minHeight:'400px'}}>
              <div className="iq-opt-panel-header" style={{padding:'14px 20px'}}>
                <span className="iq-opt-panel-num">03</span>
                <span className="iq-opt-panel-title">CV Preview</span>
              </div>
              <iframe src={pdfDataUrl} style={{width:'100%',height:'calc(100% - 48px)',border:'none'}} title="CV Preview"/>
            </div>
          ) : (
            <div className="iq-opt-panel iq-empty-preview">
              <FileText size={32} style={{color:'var(--ink-faint)',marginBottom:'12px'}}/>
              <p className="iq-empty-title">CV preview</p>
              <p className="iq-empty-sub">Your CV will appear here after upload. Results will show here after analysis.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="iq-thick-rule" style={{marginTop:'64px'}}/>
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo">Intern<span className="iq-logo-accent">IQ</span></div>
          <p className="iq-footer-copy">© 2026 InternIQ</p>
          <div className="iq-footer-links">
            <a href="/privacy" className="iq-footer-link">Privacy</a>
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
      <div className="iq-top-rule"/>
    </div>
  );
}
