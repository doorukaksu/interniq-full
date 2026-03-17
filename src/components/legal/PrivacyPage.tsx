import { FileText, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

const LAST_UPDATED = "17 March 2026";
const COMPANY = "InternIQ";
const EMAIL = "privacy@interniq.co.uk";
const WEBSITE = "interniq.co.uk";

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <FileText className="w-6 h-6" />
            <span className="text-xl tracking-tight">{COMPANY}</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-medium mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-neutral max-w-none space-y-8 text-sm leading-relaxed">

          <Section title="1. Who we are">
            <p>
              {COMPANY} ("{COMPANY}", "we", "us", or "our") operates the website {WEBSITE} and
              provides AI-powered CV analysis services. We are the data controller for personal
              data processed through our services.
            </p>
            <p>
              For privacy-related enquiries, contact us at:{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>
            </p>
          </Section>

          <Section title="2. What data we collect">
            <p>We collect and process the following categories of data:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>CV content</strong> — the text extracted from your uploaded PDF. This is
                processed in memory to generate your analysis and is <strong>never stored on
                our servers</strong>. It is deleted immediately after your analysis is complete.
              </li>
              <li>
                <strong>Job description text</strong> — the job description you paste into the
                tool. This is also processed in memory only and never stored.
              </li>
              <li>
                <strong>Email address</strong> — if you join our waitlist. Used only to notify
                you when {COMPANY} launches and to send product updates.
              </li>
              <li>
                <strong>Usage data</strong> — anonymised request logs including IP address,
                timestamp, and whether the analysis succeeded. This contains no personal CV content.
              </li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <p>We use your data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To provide the CV analysis service you requested</li>
              <li>To send you product launch and update emails (waitlist only, with your consent)</li>
              <li>To detect and prevent abuse, fraud, and unauthorised access</li>
              <li>To improve our service using anonymised, aggregated usage statistics</li>
            </ul>
          </Section>

          <Section title="4. Legal basis for processing (UK GDPR)">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Contract performance</strong> — processing your CV to deliver the analysis
                you requested (Article 6(1)(b))
              </li>
              <li>
                <strong>Consent</strong> — sending marketing emails to waitlist subscribers
                (Article 6(1)(a)). You can withdraw consent at any time by clicking unsubscribe.
              </li>
              <li>
                <strong>Legitimate interests</strong> — anonymised logging for security and service
                improvement (Article 6(1)(f))
              </li>
            </ul>
          </Section>

          <Section title="5. Data retention">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>CV content and job descriptions</strong> — deleted immediately after analysis. Never written to disk.</li>
              <li><strong>Waitlist emails</strong> — retained until you unsubscribe or request deletion.</li>
              <li><strong>Anonymised usage logs</strong> — retained for up to 90 days.</li>
            </ul>
          </Section>

          <Section title="6. Third-party services">
            <p>We use the following third-party services to operate {COMPANY}:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>Anthropic</strong> — our AI analysis is powered by Claude. CV text and
                job descriptions are sent to Anthropic's API for processing. Anthropic's privacy
                policy applies: anthropic.com/privacy
              </li>
              <li>
                <strong>Vercel</strong> — our hosting provider. Infrastructure-level data processing.
              </li>
              <li>
                <strong>Supabase</strong> — waitlist email storage. Data stored in EU data centres.
              </li>
            </ul>
          </Section>

          <Section title="7. Your rights">
            <p>Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Access</strong> — request a copy of your personal data</li>
              <li><strong>Rectification</strong> — correct inaccurate data</li>
              <li><strong>Erasure</strong> — request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction</strong> — restrict how we process your data</li>
              <li><strong>Portability</strong> — receive your data in a portable format</li>
              <li><strong>Object</strong> — object to processing based on legitimate interests</li>
              <li><strong>Withdraw consent</strong> — at any time for marketing communications</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>.
              We will respond within 30 days.
            </p>
            <p className="mt-2">
              You also have the right to lodge a complaint with the UK Information Commissioner's
              Office (ICO) at ico.org.uk.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              {COMPANY} does not currently use tracking cookies or third-party analytics. We may
              use essential session cookies required for the service to function. We will update
              this policy if our cookie usage changes.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this privacy policy from time to time. We will notify waitlist
              subscribers of any material changes by email. The date at the top of this page
              shows when it was last updated.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              For any privacy-related questions or to exercise your rights, contact us at:{" "}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-3">{title}</h2>
      <div className="text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}
