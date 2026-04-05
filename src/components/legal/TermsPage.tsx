import { ArrowLeft, FileText, Bot, Scale, Shield, AlertTriangle, Mail } from "lucide-react";
import { useNavigate } from "react-router";

const LAST_UPDATED = "5 April 2026";
const COMPANY = "InternIQ";
const EMAIL = "hello@interniq.co.uk";
const WEBSITE = "interniq.co.uk";

const linkStyle: React.CSSProperties = {
  color: "var(--accent-dim)",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="iq-root" style={{ backgroundImage: "none", background: "var(--bg)" }}>
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Terms of Service</span>
          <div className="iq-nav-links">
            <button onClick={() => navigate(-1)} className="iq-btn-ghost">
              <ArrowLeft size={13} /> Back
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ padding: "64px var(--pad) 48px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div className="iq-kicker">
            <span className="iq-kicker-line" />Legal · England & Wales
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", margin: "16px 0 12px", lineHeight: 1.1 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ padding: "40px var(--pad)", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
            The short version
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <SummaryCard icon={<FileText size={16} />} text="Use InternIQ for personal CV improvement only — not commercial use" />
            <SummaryCard icon={<Bot size={16} />} text="AI scores are feedback, not hiring decisions or career advice" />
            <SummaryCard icon={<Shield size={16} />} text="We assess skills and job fit only — never protected characteristics" />
            <SummaryCard icon={<Scale size={16} />} text="Governed by the laws of England and Wales" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px var(--pad) 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>

          <Section num="01" title="Acceptance of terms">
            <p>
              By accessing or using {WEBSITE} ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the Service.
            </p>
          </Section>

          <Section num="02" title="Description of service">
            <p>
              {COMPANY} provides an AI-powered CV analysis tool that reviews uploaded CVs against
              job descriptions and provides feedback including ATS compatibility scores, keyword
              analysis, and improvement suggestions. The Service is intended for personal,
              non-commercial use by internship and job applicants.
            </p>
          </Section>

          <Section num="03" title="Acceptable use">
            <p>You agree not to:</p>
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                "Upload files that are not genuine CVs (malware, exploits, or other harmful content)",
                "Attempt to circumvent rate limits or access controls",
                "Use automated scripts or bots to access the Service",
                "Upload CVs belonging to other people without their consent",
                "Use the Service in any way that violates applicable UK law",
                "Attempt to extract, reverse-engineer, or replicate our AI prompts or models",
              ].map((item) => (
                <div key={item} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <span style={{ color: "#ef4444", fontSize: "16px", lineHeight: 1, flexShrink: 0, marginTop: "1px" }}>×</span>
                  <span style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section num="04" title="CV data and privacy">
            <div style={{
              background: "var(--accent-tint)",
              border: "1px solid rgba(90,158,0,0.25)",
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              marginBottom: "8px",
            }}>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-dim)", marginBottom: "4px" }}>
                Your CV is never stored
              </p>
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.6 }}>
                Your CV is processed entirely in memory and deleted immediately after analysis.
                It is never written to our servers or any database.
              </p>
            </div>
            <p>
              Analysis is performed by Anthropic's Claude API (US-based). Anthropic does not use
              API inputs for model training. By uploading a CV, you confirm you have the right to
              share its contents and consent to this processing. See our{" "}
              <a href="/privacy" style={linkStyle}>Privacy Policy</a> for full details.
            </p>
          </Section>

          <Section num="05" title="AI-generated content — limitations">
            <div style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "var(--radius)",
              padding: "16px 20px",
              display: "flex",
              gap: "12px",
              marginBottom: "8px",
            }}>
              <AlertTriangle size={16} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.6 }}>
                <strong style={{ color: "var(--ink)" }}>{COMPANY} is not a substitute for professional CV advice, career coaching, or legal counsel.</strong>{" "}
                Always apply your own judgement.
              </p>
            </div>
            <p>
              Scores, grades, keyword analysis, and suggestions are generated by an AI model and
              provided <strong>for informational and self-improvement purposes only</strong>. They
              do not constitute professional career advice, recruitment advice, or legal counsel.
            </p>
            <p>
              {COMPANY} makes no guarantee that following our suggestions will result in a job
              offer, interview invitation, or any other outcome.
            </p>
          </Section>

          <Section num="06" title="Scoring methodology and automated assessments">
            <p>
              Our ATS compatibility score (0–100) and section scores are produced by an AI model
              evaluating your CV against the specific job description you provide.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "12px 0" }}>
              <ScoreNote label="What scores mean" positive>
                Estimated keyword alignment and content quality relative to the specific job description provided
              </ScoreNote>
              <ScoreNote label="What scores don't mean" positive={false}>
                A universal employability rating, a hiring decision, or a prediction of interview success
              </ScoreNote>
            </div>
            <p>
              If you believe an assessment is inaccurate or has disadvantaged you, contact us at{" "}
              <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>. You have the right to
              request human review under UK GDPR Article 22.
            </p>
          </Section>

          <Section num="07" title="Non-discrimination">
            <p>
              {COMPANY} does not consider or assess any protected characteristic — including age,
              gender, ethnicity, nationality, disability, or religion — when generating CV feedback.
              Our AI evaluates CVs based solely on skills, experience, and alignment with job requirements.
            </p>
            <p>
              {COMPANY} does not advise users to alter or remove information relating to protected
              characteristics. Restructuring suggestions are based solely on professional presentation
              and keyword optimisation.
            </p>
            <p>
              If you believe any suggestion reflects or promotes discrimination, contact us immediately
              at <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>. We take such reports
              seriously and will investigate promptly.
            </p>
          </Section>

          <Section num="08" title="Intellectual property">
            <p>
              The {COMPANY} name, logo, website design, and software are the intellectual property
              of {COMPANY}. You retain all rights to your CV content. By uploading your CV, you
              grant us a limited, temporary licence to process it solely for the purpose of
              providing your analysis.
            </p>
          </Section>

          <Section num="09" title="Limitation of liability">
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "16px 20px",
            }}>
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.7 }}>
                To the maximum extent permitted by UK law, {COMPANY} shall not be liable for any
                indirect, incidental, special, or consequential damages arising from your use of
                the Service — including loss of employment opportunity, loss of data, or loss of
                income. Our total liability shall not exceed the amount you paid us in the 30 days
                preceding the claim.
              </p>
            </div>
          </Section>

          <Section num="10" title="Service availability">
            <p>
              We aim to keep {COMPANY} available at all times but make no guarantee of uptime.
              We reserve the right to modify, suspend, or discontinue the Service at any time
              with reasonable notice where possible.
            </p>
          </Section>

          <Section num="11" title="Changes to these terms">
            <p>
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the updated terms. Material changes will be
              communicated via email to registered users.
            </p>
          </Section>

          <Section num="12" title="Governing law">
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              <Scale size={16} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
                These terms are governed by the laws of <strong style={{ color: "var(--ink)" }}>England and Wales</strong>.
                Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>
          </Section>

          <Section num="13" title="Contact">
            <p style={{ marginBottom: "12px" }}>For any questions about these terms:</p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}>
              <Mail size={13} style={{ color: "var(--ink-4)" }} />
              <a href={`mailto:${EMAIL}`} style={{ ...linkStyle, fontSize: "13px", fontFamily: "var(--font-mono)" }}>{EMAIL}</a>
            </div>
          </Section>

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
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-4)", flexShrink: 0 }}>{num}</span>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      <div style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--ink-2)", display: "flex", flexDirection: "column", gap: "12px" }}>
        {children}
      </div>
    </section>
  );
}

function SummaryCard({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      background: "var(--bg)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      padding: "14px 16px",
    }}>
      <span style={{ color: "var(--accent-dim)", flexShrink: 0, marginTop: "1px" }}>{icon}</span>
      <p style={{ fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function ScoreNote({ label, positive, children }: { label: string; positive: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 16px",
      background: "var(--bg-elevated)",
      border: `1px solid ${positive ? "rgba(90,158,0,0.2)" : "rgba(239,68,68,0.15)"}`,
      borderRadius: "var(--radius-sm)",
    }}>
      <p style={{
        fontSize: "11px",
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        color: positive ? "var(--accent-dim)" : "#ef4444",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: "6px",
      }}>{label}</p>
      <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.5 }}>{children}</p>
    </div>
  );
}
