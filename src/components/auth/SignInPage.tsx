import { SignUp } from "@clerk/clerk-react";
import { useNavigate } from "react-router";

export default function SignUpPage() {
  const navigate = useNavigate();

  return (
    <div className="iq-root" style={{ backgroundImage: "none" }}>
      <div className="iq-top-rule" />

      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Join the Beta</span>
          <div className="iq-nav-links">
            <button onClick={() => navigate("/")} className="iq-btn-ghost">
              ← Home
            </button>
          </div>
        </div>
      </nav>

      <div style={{
        maxWidth: "var(--max-w)",
        margin: "0 auto",
        padding: "72px var(--pad)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "72px",
        alignItems: "center",
      }}>
        {/* Left */}
        <div>
          <div className="iq-kicker">
            <span className="iq-kicker-line" />
            Closed Beta · Request Access
          </div>
          <h1 style={{
            fontFamily: "var(--font)",
            fontSize: "clamp(36px, 4vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: "-2px",
            color: "var(--ink)",
            marginBottom: "20px",
          }}>
            Join the<br />waitlist.
          </h1>

          {/* Legal-safe disclaimer */}
          <div style={{
            border: "1px solid rgba(163,230,53,0.35)",
            borderLeft: "3px solid var(--accent)",
            padding: "14px 16px",
            marginBottom: "24px",
            background: "var(--accent-tint)",
            borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
          }}>
            <p style={{
              fontFamily: "var(--font)",
              fontSize: "12px",
              fontWeight: 600,
              color: "#4a7c00",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>
              Beta access — invite only
            </p>
            <p style={{
              fontFamily: "var(--font)",
              fontSize: "13px",
              color: "var(--ink-3)",
              lineHeight: 1.55,
            }}>
              Creating an account registers your interest. Access is rolled out
              in batches — you will be emailed when your spot is confirmed.
              Access is not guaranteed at time of registration.
            </p>
          </div>

          <p style={{
            fontFamily: "var(--font)",
            fontSize: "15px",
            color: "var(--ink-3)",
            lineHeight: 1.65,
            maxWidth: "360px",
            marginBottom: "32px",
          }}>
            AI analysis of your CV against any job description — ATS score,
            keyword gaps, bullet rewrites, and priority fixes in under 30 seconds.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              "CV is never stored — processed in memory only",
              "UK GDPR compliant · No data sold to third parties",
              "Secured by Clerk — enterprise-grade auth",
            ].map(line => (
              <div key={line} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font)",
                fontSize: "13px",
                color: "var(--ink-3)",
              }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                }} />
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Clerk */}
        <div>
          <SignUp
            routing="hash"
            afterSignUpUrl="/optimize"
            signInUrl="/sign-in"
            appearance={clerkAppearance}
          />
        </div>
      </div>

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

const clerkAppearance = {
  variables: {
    colorPrimary: "#0A0A0B",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F4F4F5",
    colorInputText: "#0A0A0B",
    colorText: "#0A0A0B",
    colorTextSecondary: "#6B6B6F",
    colorDanger: "#dc2626",
    borderRadius: "8px",
    fontFamily: "'DM Sans', -apple-system, sans-serif",
    fontSize: "14px",
  },
  elements: {
    card: {
      boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      border: "1px solid rgba(10,10,11,0.08)",
      borderRadius: "16px",
      background: "#FFFFFF",
    },
    headerTitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "20px",
      fontWeight: "700",
      color: "#0A0A0B",
      letterSpacing: "-0.5px",
    },
    headerSubtitle: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "13px",
      color: "#6B6B6F",
    },
    formButtonPrimary: {
      backgroundColor: "#0A0A0B",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px",
      fontWeight: "600",
      borderRadius: "8px",
      letterSpacing: "-0.1px",
    },
    formFieldInput: {
      borderRadius: "8px",
      border: "1px solid rgba(10,10,11,0.14)",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px",
      backgroundColor: "#F4F4F5",
    },
    footerActionLink: {
      color: "#4a7c00",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "13px",
      fontWeight: "500",
    },
    dividerLine: { backgroundColor: "rgba(10,10,11,0.08)" },
    dividerText: {
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "12px",
      color: "#A1A1A6",
    },
    socialButtonsBlockButton: {
      borderRadius: "8px",
      border: "1px solid rgba(10,10,11,0.12)",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "13px",
      fontWeight: "500",
    },
  },
};