import { ArrowLeft, Shield, Database, Cpu, Clock, UserCheck, Mail, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";

const LAST_UPDATED = "5 April 2026";
const COMPANY = "InternIQ";
const EMAIL = "privacy@interniq.co.uk";
const WEBSITE = "interniq.co.uk";

export default function PrivacyPage() {
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
          <span className="iq-nav-edition">Privacy Policy</span>
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
            <span className="iq-kicker-line" />Legal · UK GDPR Compliant
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", margin: "16px 0 12px", lineHeight: 1.1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "15px", color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Quick summary cards */}
      <div style={{ padding: "40px var(--pad)", borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
            The short version
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            <SummaryCard icon={<Shield size={16} />} text="Your CV is never stored — deleted immediately after analysis" />
            <SummaryCard icon={<Database size={16} />} text="We store only your email, plan, and usage counts" />
            <SummaryCard icon={<Cpu size={16} />} text="AI analysis runs via Anthropic API (US). They don't train on your data." />
            <SummaryCard icon={<UserCheck size={16} />} text="You can delete your account and all data at any time" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "64px var(--pad) 96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>

          <Section num="01" title="Who we are">
            <p>
              {COMPANY} ("{COMPANY}", "we", "us", or "our") operates the website {WEBSITE} and
              provides AI-powered CV analysis services. We are the data controller for personal
              data processed through our services under the UK General Data Protection Regulation
              (UK GDPR) and the Data Protection Act 2018.
            </p>
            <ContactPill email={EMAIL} />
          </Section>

          <Section num="02" title="What data we collect">
            <p>We collect and process the following categories of data:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              <DataRow label="CV content" badge="Never stored" badgeGreen>
                Processed in memory only. Deleted immediately after your analysis — never written to disk or any database.
              </DataRow>
              <DataRow label="Job description" badge="Never stored" badgeGreen>
                Processed in memory only, never stored.
              </DataRow>
              <DataRow label="Account data" badge="Stored">
                Your email and name, collected via Clerk when you create an account.
              </DataRow>
              <DataRow label="Usage records" badge="Stored">
                Timestamped log of each analysis (date, plan tier, top-up used). No CV content.
              </DataRow>
              <DataRow label="Payment data" badge="Via Stripe">
                Handled entirely by Stripe. We store only your Stripe customer ID.
              </DataRow>
              <DataRow label="Technical logs" badge="90 days">
                Anonymised IP + timestamp logs for security and rate limiting.
              </DataRow>
            </div>
          </Section>

          <Section num="03" title="How we use your data">
            <BulletList items={[
              "To provide the CV analysis service you requested",
              "To enforce usage limits appropriate to your subscription tier",
              "To process payments and manage your subscription via Stripe",
              "To detect and prevent abuse, fraud, and unauthorised access",
              "To improve our service using anonymised, aggregated usage statistics",
            ]} />
          </Section>

          <Section num="04" title="Legal basis for processing (UK GDPR)">
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <LegalBasis article="Art. 6(1)(b)" title="Contract performance">
                Processing your CV and account data to deliver the analysis service you contracted us to provide.
              </LegalBasis>
              <LegalBasis article="Art. 6(1)(f)" title="Legitimate interests">
                Anonymised logging for security, fraud prevention, and service improvement.
              </LegalBasis>
              <LegalBasis article="Art. 6(1)(c)" title="Legal obligation">
                Retaining transactional records as required by UK financial regulation.
              </LegalBasis>
            </div>
          </Section>

          <Section num="05" title="Third-party data processors">
            <p style={{ marginBottom: "20px" }}>
              We act as data controller. The following third parties act as data processors on our behalf
              under written data processing agreements. By using {COMPANY}, you acknowledge that your
              data will be processed by these sub-processors.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Processor
                name="Anthropic, Inc."
                role="AI analysis provider"
                location="United States"
                transfer="UK IDTA / Standard Contractual Clauses"
                retention="Not retained — Anthropic does not use API inputs to train models. Data is used solely to generate your response."
                link="https://www.anthropic.com/privacy"
              />
              <Processor
                name="Supabase, Inc."
                role="Database — account data, usage records"
                location="EU (AWS eu-west)"
                transfer="No international transfer required"
                retention="Retained until account deletion. Purged within 30 days of deletion request."
                link="https://supabase.com/privacy"
              />
              <Processor
                name="Clerk, Inc."
                role="Authentication — email, session tokens"
                location="United States"
                transfer="Standard Contractual Clauses"
                retention="Retained until account deletion."
                link="https://clerk.com/privacy"
              />
              <Processor
                name="Stripe, Inc."
                role="Payment processing"
                location="United States"
                transfer="Standard Contractual Clauses"
                retention="Retained per financial regulation (typically 7 years)."
                link="https://stripe.com/privacy"
              />
              <Processor
                name="Vercel, Inc."
                role="Hosting and serverless infrastructure"
                location="United States / EU edge nodes"
                transfer="Standard Contractual Clauses"
                retention="Server logs retained up to 30 days."
                link="https://vercel.com/legal/privacy-policy"
              />
            </div>
          </Section>

          <Section num="06" title="Automated decision-making (Art. 22)">
            <p>
              {COMPANY} provides automated CV assessments including an ATS compatibility score (0–100),
              a grade (A–F), keyword gap analysis, and section-level scores. We are required to be
              transparent about this automated processing.
            </p>
            <div style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "20px 24px",
              marginTop: "16px",
            }}>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                How scores are calculated
              </p>
              <BulletList items={[
                "Your CV text and job description are sent to Claude (Anthropic's AI model).",
                "Claude evaluates keyword alignment, formatting clarity, bullet strength, and section completeness relative to the specific job description.",
                "The ATS score reflects compatibility with that specific job description — not a universal employability rating.",
                "Scores will differ across different job descriptions for the same CV.",
              ]} />
            </div>
            <p style={{ marginTop: "16px" }}>
              Our analysis is indicative feedback only — not a hiring decision or substitute for professional career advice.
              You retain full control over whether and how to act on any suggestion.
            </p>
            <p style={{ marginTop: "12px" }}>
              <strong>Right to contest:</strong> If you believe our analysis has disadvantaged you, contact us at{" "}
              <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a> to request a human review.
            </p>
          </Section>

          <Section num="07" title="Data retention">
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "CV content & job descriptions", value: "Deleted immediately — never stored" },
                { label: "Account data (email, name)", value: "Active account lifetime + 30 days after deletion" },
                { label: "Usage records", value: "Active account lifetime + 30 days after deletion" },
                { label: "Payment records (Stripe)", value: "7 years (financial regulation)" },
                { label: "Technical logs", value: "90 days" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "24px",
                  padding: "14px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ fontSize: "14px", color: "var(--ink-2)" }}>{row.label}</span>
                  <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--ink-4)", textAlign: "right", flexShrink: 0 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section num="08" title="Account deletion">
            <p>
              You can delete your account at any time from your{" "}
              <a href="/account" style={linkStyle}>Account page</a>.
              Deleting your account permanently removes:
            </p>
            <BulletList items={[
              "Your account profile (email, name)",
              "All usage records",
              "Your subscription status and top-up credit balance",
            ]} />
            <p style={{ marginTop: "16px" }}>
              Deletion is processed within 30 days. Stripe payment records are retained as required
              by financial regulation and cannot be deleted. Your CV content is never stored and
              therefore requires no deletion.
            </p>
            <p style={{ marginTop: "12px" }}>
              Deleting your account cancels any active subscription. You will not receive a prorated
              refund — please cancel via the Billing Portal first if applicable.
            </p>
          </Section>

          <Section num="09" title="Your rights">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {[
                ["Access", "Request a copy of your personal data"],
                ["Rectification", "Correct inaccurate data"],
                ["Erasure", "Request deletion (right to be forgotten)"],
                ["Restriction", "Restrict how we process your data"],
                ["Portability", "Receive your data in a portable format"],
                ["Object", "Object to processing based on legitimate interests"],
                ["Contest decisions", "Request human review of any automated assessment"],
              ].map(([right, desc]) => (
                <div key={right} style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px 16px",
                }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "4px" }}>{right}</p>
                  <p style={{ fontSize: "12px", color: "var(--ink-3)", lineHeight: 1.4 }}>{desc}</p>
                </div>
              ))}
            </div>
            <p>
              To exercise any right, email{" "}
              <a href={`mailto:${EMAIL}`} style={linkStyle}>{EMAIL}</a>. We will respond within 30 days.
            </p>
            <p style={{ marginTop: "12px" }}>
              You also have the right to lodge a complaint with the ICO at{" "}
              <a href="https://ico.org.uk" style={linkStyle} target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
            </p>
          </Section>

          <Section num="10" title="Cookies">
            <p>
              {COMPANY} does not use tracking cookies or third-party analytics. Clerk may set essential
              session cookies required for authentication. We will update this policy if our cookie usage changes.
            </p>
          </Section>

          <Section num="11" title="Changes to this policy">
            <p>
              We may update this policy from time to time. Registered users will be notified of
              material changes by email. The date at the top of this page shows when it was last updated.
            </p>
          </Section>

          <Section num="12" title="Contact">
            <ContactPill email={EMAIL} />
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
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const linkStyle: React.CSSProperties = {
  color: "var(--accent-dim)",
  textDecoration: "underline",
  textUnderlineOffset: "3px",
};

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

function DataRow({ label, badge, badgeGreen, children }: { label: string; badge: string; badgeGreen?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "140px 1fr",
      gap: "12px",
      alignItems: "start",
      padding: "12px 16px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>{label}</p>
        <span style={{
          display: "inline-block",
          fontSize: "10px",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          padding: "2px 7px",
          borderRadius: "100px",
          background: badgeGreen ? "var(--accent-tint)" : "var(--bg-sunken)",
          color: badgeGreen ? "var(--accent-dim)" : "var(--ink-4)",
          border: badgeGreen ? "1px solid rgba(90,158,0,0.25)" : "1px solid var(--border)",
          letterSpacing: "0.04em",
        }}>{badge}</span>
      </div>
      <p style={{ fontSize: "13px", color: "var(--ink-3)", lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function LegalBasis({ article, title, children }: { article: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "auto 1fr",
      gap: "16px",
      alignItems: "start",
      padding: "14px 16px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: "4px",
        background: "var(--bg-sunken)",
        color: "var(--ink-4)",
        whiteSpace: "nowrap",
        border: "1px solid var(--border)",
        marginTop: "1px",
      }}>{article}</span>
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", marginBottom: "3px" }}>{title}</p>
        <p style={{ fontSize: "13px", color: "var(--ink-3)", lineHeight: 1.6 }}>{children}</p>
      </div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item) => (
        <li key={item} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent-dim)", flexShrink: 0, marginTop: "7px" }} />
          <span style={{ fontSize: "14px", color: "var(--ink-2)", lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Processor({ name, role, location, transfer, retention, link }: {
  name: string; role: string; location: string; transfer: string; retention: string; link: string;
}) {
  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
      background: "var(--bg-elevated)",
    }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <p style={{ fontWeight: 700, fontSize: "14px", color: "var(--ink)" }}>{name}</p>
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ ...linkStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          Privacy policy <ExternalLink size={11} />
        </a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
        {[
          { label: "Role", value: role },
          { label: "Data location", value: location },
          { label: "Transfer", value: transfer },
          { label: "Retention", value: retention },
        ].map((row, i) => (
          <div key={row.label} style={{
            padding: "12px 20px",
            borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
            borderBottom: i < 2 ? "1px solid var(--border)" : "none",
          }}>
            <p style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{row.label}</p>
            <p style={{ fontSize: "12px", color: "var(--ink-2)", lineHeight: 1.5 }}>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPill({ email }: { email: string }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 16px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-sm)",
      marginTop: "4px",
    }}>
      <Mail size={13} style={{ color: "var(--ink-4)" }} />
      <a href={`mailto:${email}`} style={{ ...linkStyle, fontSize: "13px", fontFamily: "var(--font-mono)" }}>{email}</a>
    </div>
  );
}
