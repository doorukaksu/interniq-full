import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { ArrowLeft, Loader2, CreditCard, Zap, LogOut } from "lucide-react";
import { useUserStatus } from "../hooks/useUserStatus";
import { getBillingPortal, createCheckout } from "../lib/api";

const PRICES = {
  UNLIMITED_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_UNLIMITED_MONTHLY as string,
};

const PLAN_LABELS: Record<string, string> = { free: "Free", pro: "Pro", unlimited: "Unlimited" };
const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, unlimited: 2 };

export default function AccountPage() {
  const navigate = useNavigate();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const status = useUserStatus();
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const displayName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
    "there";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";

  const isPro = status.plan === "pro";
  const isUnlimited = status.plan === "unlimited";
  const isFree = status.plan === "free";
  const hasSub = isPro || isUnlimited;

  async function handleBillingPortal() {
    setPortalLoading(true);
    try {
      const url = await getBillingPortal(getToken);
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade() {
    setUpgradeLoading(true);
    try {
      const url = await createCheckout(PRICES.UNLIMITED_MONTHLY, "subscription", getToken);
      window.location.href = url;
    } catch {
      setUpgradeLoading(false);
    }
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
          <span className="iq-nav-edition">Account</span>
          <div className="iq-nav-links">
            <button onClick={() => navigate("/optimize")} className="iq-btn-ghost">
              <ArrowLeft size={13} /> Back to app
            </button>
            <button onClick={() => signOut().then(() => navigate("/"))} className="iq-btn-ghost">
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Page title row */}
      <div style={{ padding: "48px var(--pad, 40px) 0" }}>
        <div className="iq-kicker">
          <span className="iq-kicker-line" />Your account
        </div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink)", margin: 0, lineHeight: 1 }}>
            {displayName}
          </h1>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-4)" }}>
            {email}
          </span>
        </div>
      </div>

      <div className="iq-thick-rule" style={{ marginTop: "32px" }} />

      {/* Section — Plan */}
      <Row label="01 · Plan">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>
                {PLAN_LABELS[status.plan]}
              </span>
              {hasSub && (
                <span style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "100px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: status.sub_status === "active" ? "var(--accent-tint)" : "rgba(239,68,68,0.08)",
                  color: status.sub_status === "active" ? "var(--accent-dim)" : "#dc2626",
                  border: `1px solid ${status.sub_status === "active" ? "rgba(163,230,53,0.3)" : "rgba(239,68,68,0.2)"}`,
                }}>
                  {status.sub_status}
                </span>
              )}
            </div>
            <p style={{ fontSize: "14px", color: "var(--ink-4)", marginTop: "8px", fontFamily: "var(--font-mono)" }}>
              {isFree && "1 lifetime analysis · Partial results"}
              {isPro && "10 analyses per week · Full results"}
              {isUnlimited && "Unlimited analyses · Full results"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {hasSub && (
              <button onClick={handleBillingPortal} disabled={portalLoading} className="iq-btn-ghost" style={{ fontSize: "13px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                {portalLoading ? <Loader2 size={13} className="iq-spin" /> : <CreditCard size={13} />}
                Manage billing
              </button>
            )}
            {isPro && (
              <button onClick={handleUpgrade} disabled={upgradeLoading} className="iq-btn-primary" style={{ fontSize: "13px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                {upgradeLoading ? <Loader2 size={13} className="iq-spin" /> : <Zap size={13} />}
                Upgrade to Unlimited
              </button>
            )}
            {isFree && (
              <button onClick={() => navigate("/pricing")} className="iq-btn-primary" style={{ fontSize: "13px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={13} /> View plans
              </button>
            )}
          </div>
        </div>
      </Row>

      <div className="iq-thick-rule" />

      {/* Section — Usage */}
      <Row label="02 · Usage">
        {isUnlimited ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--ink)", lineHeight: 1 }}>
              {status.lifetime_used}
            </span>
            <span style={{ fontSize: "16px", color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>
              total analyses · no limit
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "560px" }}>
            {isPro && (
              <UsageBar
                label="This week"
                used={status.weekly_used}
                max={10}
                unit="analyses"
              />
            )}
            {isFree && (
              <UsageBar
                label="Lifetime"
                used={status.lifetime_used}
                max={1}
                unit="analysis"
              />
            )}
            {isPro && status.topup_credits > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Zap size={14} style={{ color: "var(--accent-dim)", flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>
                  {status.topup_credits} top-up credit{status.topup_credits !== 1 ? "s" : ""} remaining
                </span>
              </div>
            )}
          </div>
        )}
      </Row>

      <div className="iq-thick-rule" />

      {/* Section — All plans */}
      <Row label="03 · Plans">
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {(["free", "pro", "unlimited"] as const).map((p, i) => {
            const isCurrent = p === status.plan;
            const isHigher = PLAN_ORDER[p] > PLAN_ORDER[status.plan];
            return (
              <div key={p}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 0",
                  opacity: PLAN_ORDER[p] < PLAN_ORDER[status.plan] ? 0.4 : 1,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--ink-4)",
                      width: "24px",
                    }}>
                      0{i + 1}
                    </span>
                    <span style={{
                      fontSize: "20px",
                      fontWeight: isCurrent ? 800 : 500,
                      color: "var(--ink)",
                      letterSpacing: "-0.01em",
                    }}>
                      {PLAN_LABELS[p]}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "100px",
                        background: "var(--accent)",
                        color: "var(--accent-dim)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}>
                        Current
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-4)" }}>
                      {p === "free" ? "£0" : p === "pro" ? "£7.99/mo" : "£14.99/mo"}
                    </span>
                    {isHigher && (
                      <button
                        onClick={() => navigate("/pricing")}
                        className="iq-btn-ghost"
                        style={{ fontSize: "12px", padding: "6px 14px" }}
                      >
                        Upgrade →
                      </button>
                    )}
                  </div>
                </div>
                {i < 2 && <div className="iq-section-rule" />}
              </div>
            );
          })}
        </div>
      </Row>

      <div className="iq-thick-rule" />

      {/* Footer */}
      <footer className="iq-footer">
        <div className="iq-footer-inner">
          <div className="iq-logo" style={{ cursor: "default", fontSize: "16px" }}>
            Intern<span className="iq-logo-accent">IQ</span>
          </div>
          <p className="iq-footer-copy">© 2026 InternIQ</p>
          <div className="iq-footer-links">
            <a href="/pricing" className="iq-footer-link">Pricing</a>
            <a href="/privacy" className="iq-footer-link">Privacy</a>
            <a href="/terms" className="iq-footer-link">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ── Row layout ────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px 1fr",
      gap: "40px",
      padding: "40px var(--pad, 40px)",
      alignItems: "start",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
        color: "var(--ink-4)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        paddingTop: "6px",
      }}>
        {label}
      </span>
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
}


// ── Usage bar ─────────────────────────────────────────────────────────────────

function UsageBar({ label, used, max, unit }: { label: string; used: number; max: number; unit: string }) {
  const pct = Math.min(used / max, 1);
  const barColor = pct >= 1 ? "#ef4444" : pct >= 0.7 ? "#f59e0b" : "var(--accent-dim)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ fontSize: "13px", color: "var(--ink-4)", fontFamily: "var(--font-mono)" }}>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--ink-2)", fontWeight: 600 }}>
          {used} / {max} {unit}
        </span>
      </div>
      <div style={{ height: "3px", background: "var(--border)", borderRadius: "100px", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct * 100}%`,
          background: barColor,
          borderRadius: "100px",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}
