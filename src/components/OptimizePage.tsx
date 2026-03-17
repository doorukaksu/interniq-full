import { useState, useRef } from "react";
import { FileText, Upload, ArrowLeft, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
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

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
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
        throw new Error(response.error ?? "Analysis failed. Please try again.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(msg);
      setAppState("error");
    }
  };

  const handleReset = () => {
    setResult(null);
    setAppState("idle");
    setErrorMessage("");
  };

  const canAnalyze = !!uploadedFile && jobDescription.trim().length > 20;
  const isRateLimited = errorMessage.toLowerCase().includes("too many requests");

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border sticky top-0 bg-background z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <FileText className="w-6 h-6" />
            <span className="text-xl tracking-tight">InternIQ</span>
          </div>
          <div className="flex items-center gap-4">
            {appState === "results" && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Analyse again
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-4xl mb-3">Optimise Your CV</h1>
          <p className="text-muted-foreground">
            Upload your CV and paste the job description for an instant AI analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Left Panel ── */}
          <div className="space-y-6">

            {/* CV Upload */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="mb-4">Upload Your CV</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-12 hover:border-primary/50 hover:bg-secondary/30 transition-colors flex flex-col items-center gap-4 cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="mb-1">Click or drag to upload your CV</p>
                    <p className="text-sm text-muted-foreground">PDF format only · Max 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Privacy trust statement */}
              <div className="flex items-start gap-2 mt-3 p-3 bg-secondary/50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Your CV is processed in memory and{" "}
                  <span className="font-medium text-foreground">never stored on our servers</span>.
                  It is deleted immediately after analysis.{" "}
                  <a href="/privacy" className="underline hover:text-foreground transition-colors">
                    Privacy policy
                  </a>
                </p>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="mb-1">Job Description</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste the full listing including requirements and responsibilities.
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="w-full h-64 px-4 py-3 bg-input-background rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {jobDescription.length} characters
                {jobDescription.length < 20 && jobDescription.length > 0 && (
                  <span className="text-destructive ml-2">— add more detail for better results</span>
                )}
              </p>
            </div>

            {/* Error state */}
            {appState === "error" && (
              <div className={`border rounded-xl p-4 ${isRateLimited ? "bg-yellow-50 border-yellow-200" : "bg-destructive/10 border-destructive/30"}`}>
                <p className={`text-sm font-medium mb-1 ${isRateLimited ? "text-yellow-800" : "text-destructive"}`}>
                  {isRateLimited ? "Rate limit reached" : "Analysis failed"}
                </p>
                <p className={`text-sm ${isRateLimited ? "text-yellow-700" : "text-destructive/80"}`}>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Analyse button */}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || appState === "analyzing"}
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {appState === "analyzing" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing your CV...
                </>
              ) : (
                "Analyse CV"
              )}
            </button>

            {!uploadedFile && !jobDescription && (
              <p className="text-sm text-muted-foreground text-center">
                Upload your CV and paste a job description to begin
              </p>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div>
            {appState === "results" && result ? (
              <AnalysisResults result={result} />
            ) : appState === "analyzing" ? (
              <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col items-center justify-center gap-4 min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium mb-1">Analysing your CV</p>
                  <p className="text-sm text-muted-foreground">
                    Checking ATS score, keywords, bullet strength...
                  </p>
                </div>
              </div>
            ) : pdfDataUrl ? (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="mb-4">CV Preview</h3>
                <div className="bg-muted rounded-lg overflow-hidden h-[calc(100vh-300px)]">
                  <iframe src={pdfDataUrl} className="w-full h-full" title="CV Preview" />
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 h-full">
                <h3 className="mb-4">CV Preview</h3>
                <div className="border-2 border-dashed border-border rounded-lg h-[calc(100vh-300px)] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-3 opacity-20" />
                    <p>Your CV will appear here</p>
                    <p className="text-sm mt-1">Results will show here after analysis</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 InternIQ</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
