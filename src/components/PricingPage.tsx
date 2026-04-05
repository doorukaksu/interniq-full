import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import { Check, Loader2 } from "lucide-react";
import { createCheckout } from "../lib/api";
import { useUserStatus } from "../hooks/useUserStatus";

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, unlimited: 2 };

const PRICES = {
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY as string,
  PRO_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL as string,
  UNLIMITED_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_UNLIMITED_MONTHLY as string,
  UNLIMITED_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_UNLIMITED_ANNUAL as string,
  TOPUP: import.meta.env.VITE_STRIPE_PRICE_TOPUP as string,
};

type Billing = "monthly" | "annual";

interface Plan {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  annualNote: string;
  description: string;
  features: string[];
  priceIdMonthly: string;
  priceIdAnnual: string;
  cta: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    monthlyPrice: "£0",
    annualPrice: "£0",
    annualNote: "",
    description: "Try InternIQ with one analysis.",
    features: [
      "1 lifetime analysis",
      "ATS score & grade",
      "ATS summary",
      "1 bullet point improvement",
    ],
    priceIdMonthly: "",
    priceIdAnnual: "",
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: "£7.99",
    annualPrice: "£5.99",
    annualNote: "billed £71.88/yr",
    description: "For active job seekers applying regularly.",
    features: [
      "10 analyses per week",
      "Full keyword analysis",
      "All section scores",
      "Overall suggestions",
      "Top 3 priorities",
      "Top-up credits available",
    ],
    priceIdMonthly: PRICES.PRO_MONTHLY,
    priceIdAnnual: PRICES.PRO_ANNUAL,
    cta: "Get Pro",
    highlighted: false,
  },
  {
    name: "Unlimited",
    monthlyPrice: "£14.99",
    annualPrice: "£11.99",
    annualNote: "billed £143.88/yr",
    description: "Apply to as many roles as you like.",
    features: [
      "Unlimited analyses",
      "Full keyword analysis",
      "All section scores",
      "Overall suggestions",
      "Top 3 priorities",
      "Priority support",
    ],
    priceIdMonthly: PRICES.UNLIMITED_MONTHLY,
    priceIdAnnual: PRICES.UNLIMITED_ANNUAL,
    cta: "Get Unlimited",
    highlighted: true,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const userStatus = useUserStatus();
  const currentPlan = isSignedIn ? userStatus.plan : null;
  const [billing, setBilling] = useState<Billing>("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePlanClick(plan: Plan) {
    if (plan.name === "Free") {
      navigate(isSignedIn ? "/optimize" : "/sign-up");
      return;
    }

    if (!isSignedIn) {
      navigate("/sign-up", { state: { returnTo: "/pricing" } });
      return;
    }

    // Already on this plan — go to account
    const planKey = plan.name.toLowerCase() as "pro" | "unlimited";
    if (currentPlan === planKey) {
      navigate("/account");
      return;
    }

    const priceId = billing === "monthly" ? plan.priceIdMonthly : plan.priceIdAnnual;
    setLoading(priceId);
    try {
      const url = await createCheckout(priceId, "subscription", getToken);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  function getPlanCta(plan: Plan): string {
    if (!isSignedIn || !currentPlan) return plan.cta;
    const planKey = plan.name.toLowerCase();
    if (currentPlan === planKey) return "Current plan";
    if (planKey === "free") return "Downgrade";
    if (PLAN_ORDER[planKey] > PLAN_ORDER[currentPlan]) return `Upgrade to ${plan.name}`;
    return `Switch to ${plan.name}`;
  }

  function isPlanCurrent(plan: Plan): boolean {
    if (!currentPlan) return false;
    return plan.name.toLowerCase() === currentPlan;
  }

  return (
    <div className="iq-root" style={{ backgroundImage: "none", background: "var(--bg)" }}>
      <div className="iq-top-rule" />

      {/* Nav */}
      <nav className="iq-nav">
        <div className="iq-nav-inner">
          <div className="iq-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <span className="iq-nav-edition">Pricing</span>
          <div className="iq-nav-links">
            <button onClick={() => navigate("/")} className="iq-btn-ghost">Home</button>
            {isSignedIn ? (
              <button onClick={() => navigate("/optimize")} className="iq-btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                Go to app
              </button>
            ) : (
              <button onClick={() => navigate("/sign-in")} className="iq-btn-primary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="iq-opt-header">
        <div className="iq-kicker">
          <span className="iq-kicker-line" />Simple, transparent pricing
        </div>
        <h1 className="iq-opt-title">Choose your plan</h1>
        <p className="iq-opt-sub">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="iq-section-rule" style={{ margin: "0 var(--pad)" }} />

      {/* Billing toggle */}
      <div style={{ display: "flex", justifyContent: "center", margin: "32px 0 0" }}>
        <div style={{ display: "flex", gap: "4px", background: "var(--bg-sunken, #e8e8e9)", borderRadius: "8px", padding: "4px" }}>
          {(["monthly", "annual"] as Billing[]).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "8px 20px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                background: billing === b ? "var(--paper)" : "transparent",
                color: billing === b ? "var(--ink)" : "var(--ink-4)",
                boxShadow: billing === b ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {b === "monthly" ? "Monthly" : "Annual · save 25%"}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "20px",
        maxWidth: "900px",
        margin: "32px auto 64px",
        padding: "0 var(--pad, 24px)",
      }}>
        {PLANS.map((plan) => {
          const priceId = billing === "monthly" ? plan.priceIdMonthly : plan.priceIdAnnual;
          const isLoading = loading === priceId;
          const displayPrice = billing === "monthly" ? plan.monthlyPrice : plan.annualPrice;

          return (
            <div
              key={plan.name}
              style={{
                border: plan.highlighted ? "2px solid var(--accent)" : "1px solid var(--border)",
                borderRadius: "12px",
                padding: "28px",
                background: plan.highlighted ? "var(--accent-tint)" : "var(--paper)",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--accent)",
                  color: "var(--accent-dim)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: "100px",
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>
                  Most popular
                </div>
              )}

              <div>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                  {plan.name}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ fontSize: "36px", fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{displayPrice}</span>
                  {plan.name !== "Free" && (
                    <span style={{ fontSize: "14px", color: "var(--ink-4)" }}>/mo</span>
                  )}
                </div>
                {billing === "annual" && plan.annualNote && (
                  <p style={{ fontSize: "12px", color: "var(--ink-4)", marginTop: "2px" }}>{plan.annualNote}</p>
                )}
                <p style={{ fontSize: "14px", color: "var(--ink-3)", marginTop: "8px", lineHeight: 1.4 }}>
                  {plan.description}
                </p>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "14px", color: "var(--ink-2)" }}>
                    <Check size={14} style={{ color: "var(--accent-dim)", marginTop: "2px", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanClick(plan)}
                disabled={!!loading || isPlanCurrent(plan)}
                style={{
                  background: isPlanCurrent(plan) ? "transparent" : plan.highlighted ? "var(--accent-dim)" : "var(--bg-sunken, #e8e8e9)",
                  color: isPlanCurrent(plan) ? "var(--ink-4)" : plan.highlighted ? "#fff" : "var(--ink)",
                  border: isPlanCurrent(plan) ? "1px solid var(--border)" : "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: (loading || isPlanCurrent(plan)) ? "not-allowed" : "pointer",
                  opacity: loading && !isLoading ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.15s ease",
                }}
              >
                {isLoading && <Loader2 size={14} className="iq-spin" />}
                {getPlanCta(plan)}
              </button>
            </div>
          );
        })}
      </div>

      {/* Top-up section */}
      <div style={{
        maxWidth: "900px",
        margin: "0 auto 64px",
        padding: "0 var(--pad, 24px)",
      }}>
        <div className="iq-section-rule" style={{ margin: "0 0 32px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "16px", color: "var(--ink)", marginBottom: "4px" }}>Need one more?</p>
            <p style={{ fontSize: "14px", color: "var(--ink-3)", lineHeight: 1.4 }}>
              Pro users who've hit their weekly limit can buy a top-up credit for a single extra analysis.
            </p>
          </div>
          <button
            onClick={() => navigate(isSignedIn ? "/optimize" : "/sign-up")}
            style={{
              background: "transparent",
              border: "1.5px solid var(--border)",
              borderRadius: "8px",
              padding: "10px 20px",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              color: "var(--ink)",
              whiteSpace: "nowrap",
            }}
          >
            £2.99 top-up
          </button>
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
