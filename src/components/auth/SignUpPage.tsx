import { SignIn } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router";

/**
 * Sign-in page using Clerk's hosted UI component, themed to match
 * InternIQ's broadsheet editorial design system via Clerk's appearance API.
 *
 * After sign-in, Clerk redirects to the returnTo path saved in location
 * state (set by ProtectedRoute), or falls back to /optimize.
 */
export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string })?.returnTo ?? "/optimize";

  return (
    <div className="iq-root" style={{ backgroundImage: "none", background: "var(--paper)" }}>
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div
            className="iq-logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Beta Access</span>
          <div className="iq-nav-links">
            <button
              onClick={() => navigate("/")}
              className="iq-btn-ghost"
              style={{ border: "none", background: "none", cursor: "pointer", font: "inherit" }}
            >
              ← Home
            </button>
          </div>
        </div>
      </nav>
      <div className="iq-thick-rule" />

      {/* Auth layout */}
      <div style={{
        maxWidth: "var(--max-w)",
        margin: "0 auto",
        padding: "64px var(--pad)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "64px",
        alignItems: "start",
      }}>

        {/* Left — editorial copy */}
        <div style={{ paddingTop: "8px" }}>
          <div className="iq-kicker">
            <span className="iq-kicker-line" />
            Beta Access · Invite Only
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px, 4vw, 56px)",
            fontWeight: 700,
            lineHeight: 0.95,
            letterSpacing: "-1px",
            color: "var(--ink)",
            marginBottom: "20px",
          }}>
            Sign in to<br /><em style={{ fontStyle: "italic", fontWeight: 400, color: "var(--copper)" }}>InternIQ</em>
          </h1>
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 300,
            color: "var(--ink-mid)",
            lineHeight: 1.75,
            maxWidth: "340px",
            marginBottom: "32px",
          }}>
            InternIQ is currently in closed beta. Sign in if you have been
            granted access, or join the waitlist on the home page.
          </p>

          {/* Trust signals */}
          <div style={{
            borderTop: "1px solid var(--rule)",
            paddingTop: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            {[
              "Your CV is never stored — processed in memory only",
              "UK GDPR compliant · No data sold to third parties",
              "Secured by Clerk — enterprise-grade authentication",
            ].map((line) => (
              <div key={line} style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--stone)",
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}>
                <span style={{ color: "var(--copper)", flexShrink: 0 }}>—</span>
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Clerk component */}
        <div>
          <SignIn
            routing="hash"
            afterSignInUrl={returnTo}
            signUpUrl="/sign-up"
            appearance={{
              variables: {
                colorPrimary: "#B8692A",
                colorBackground: "#ffffff",
                colorInputBackground: "#f5f0e6",
                colorInputText: "#1C1208",
                colorText: "#1C1208",
                colorTextSecondary: "#7A6D5A",
                colorDanger: "#c0392b",
                borderRadius: "0px",
                fontFamily: "'Geist Mono', 'Courier New', monospace",
                fontSize: "13px",
              },
              elements: {
                card: {
                  boxShadow: "none",
                  border: "1px solid rgba(28,18,8,0.15)",
                  borderRadius: "0",
                  background: "#ffffff",
                },
                headerTitle: {
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1C1208",
                  letterSpacing: "-0.3px",
                },
                headerSubtitle: {
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "11px",
                  color: "#7A6D5A",
                },
                formButtonPrimary: {
                  backgroundColor: "#1C1208",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "11px",
                  fontWeight: "500",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: "0",
                  "&:hover": { backgroundColor: "#B8692A" },
                },
                formFieldInput: {
                  borderRadius: "0",
                  border: "1px solid rgba(28,18,8,0.2)",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "12px",
                  backgroundColor: "#f5f0e6",
                },
                footerActionLink: {
                  color: "#B8692A",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "11px",
                },
                dividerLine: { backgroundColor: "rgba(28,18,8,0.12)" },
                dividerText: {
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "10px",
                  color: "#8A7D68",
                },
                socialButtonsBlockButton: {
                  borderRadius: "0",
                  border: "1px solid rgba(28,18,8,0.15)",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "11px",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="iq-thick-rule" style={{ marginTop: "64px" }} />
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
      <div className="iq-top-rule" />
    </div>
  );
}