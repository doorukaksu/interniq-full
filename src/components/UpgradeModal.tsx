import { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { createCheckout } from "../lib/api";

interface Props {
  reason: "free_limit_reached" | "pro_weekly_limit_reached";
  topupCredits: number;
  onClose: () => void;
}

const PRICES = {
  PRO_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY as string,
  PRO_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL as string,
  UNLIMITED_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_UNLIMITED_MONTHLY as string,
  UNLIMITED_ANNUAL: import.meta.env.VITE_STRIPE_PRICE_UNLIMITED_ANNUAL as string,
  TOPUP: import.meta.env.VITE_STRIPE_PRICE_TOPUP as string,
};

export default function UpgradeModal({ reason, topupCredits, onClose }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  async function handleCheckout(priceId: string, mode: "subscription" | "payment") {
    setLoading(priceId);
    try {
      const url = await createCheckout(priceId, mode, getToken);
      window.location.href = url;
    } catch {
      setLoading(null);
    }
  }

  const isProLimit = reason === "pro_weekly_limit_reached";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,11,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg, 12px)",
          padding: "32px",
          width: "100%",
          maxWidth: "560px",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ink-4)",
            padding: "4px",
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Zap size={18} style={{ color: "var(--accent-dim)" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {isProLimit ? "Weekly limit reached" : "Upgrade to continue"}
            </span>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--ink)", margin: 0 }}>
            {isProLimit
              ? "You've used 10 analyses this week"
              : "You've used your free analysis"}
          </h2>
          <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--ink-3)", lineHeight: 1.5 }}>
            {isProLimit
              ? "Your weekly allowance resets on Monday. Upgrade to Unlimited or buy a top-up to continue now."
              : "Unlock full results, keyword analysis, section scores, and 10 analyses per week with Pro."}
          </p>
        </div>

        {/* Billing toggle */}
        {!isProLimit && (
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-sunken, #e8e8e9)", borderRadius: "8px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                style={{
                  padding: "6px 16px",
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
                {b === "monthly" ? "Monthly" : "Annual (save 25%)"}
              </button>
            ))}
          </div>
        )}

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Pro plan — shown for free limit; also shown for pro limit as upgrade path */}
          {!isProLimit && (
            <PlanCard
              name="Pro"
              price={billing === "monthly" ? "£7.99/mo" : "£5.99/mo"}
              note={billing === "annual" ? "billed £71.88/yr" : undefined}
              features={["10 analyses per week", "Full results & keyword analysis", "Section scores & priorities"]}
              priceId={billing === "monthly" ? PRICES.PRO_MONTHLY : PRICES.PRO_ANNUAL}
              mode="subscription"
              loading={loading}
              onCheckout={handleCheckout}
            />
          )}

          {/* Unlimited */}
          <PlanCard
            name="Unlimited"
            price={billing === "monthly" ? "£14.99/mo" : "£11.99/mo"}
            note={billing === "annual" ? "billed £143.88/yr" : undefined}
            features={["Unlimited analyses", "Full results, always", "Priority support"]}
            priceId={billing === "monthly" ? PRICES.UNLIMITED_MONTHLY : PRICES.UNLIMITED_ANNUAL}
            mode="subscription"
            loading={loading}
            onCheckout={handleCheckout}
            highlighted
          />

          {/* Top-up — only for Pro users at weekly limit */}
          {isProLimit && (
            <PlanCard
              name="Top-up credit"
              price="£2.99"
              note="one-time · 1 extra analysis"
              features={["Immediate access", "No subscription change", "Credits don't expire"]}
              priceId={PRICES.TOPUP}
              mode="payment"
              loading={loading}
              onCheckout={handleCheckout}
            />
          )}
        </div>
      </div>
    </div>
  );
}


// ── PlanCard sub-component ────────────────────────────────────────────────────

interface PlanCardProps {
  name: string;
  price: string;
  note?: string;
  features: string[];
  priceId: string;
  mode: "subscription" | "payment";
  loading: string | null;
  onCheckout: (priceId: string, mode: "subscription" | "payment") => void;
  highlighted?: boolean;
}

function PlanCard({ name, price, note, features, priceId, mode, loading, onCheckout, highlighted }: PlanCardProps) {
  const isLoading = loading === priceId;

  return (
    <div
      style={{
        border: highlighted ? "1.5px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "10px",
        padding: "20px",
        background: highlighted ? "var(--accent-tint)" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--ink)" }}>{name}</span>
          <span style={{ fontWeight: 700, fontSize: "18px", color: highlighted ? "var(--accent-dim)" : "var(--ink)" }}>{price}</span>
          {note && <span style={{ fontSize: "12px", color: "var(--ink-4)" }}>{note}</span>}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "2px" }}>
          {features.map((f) => (
            <li key={f} style={{ fontSize: "13px", color: "var(--ink-3)", display: "flex", gap: "6px" }}>
              <span style={{ color: "var(--accent-dim)" }}>✓</span> {f}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={() => onCheckout(priceId, mode)}
        disabled={!!loading}
        style={{
          background: highlighted ? "var(--accent-dim)" : "var(--ink)",
          color: highlighted ? "#fff" : "var(--paper)",
          border: "none",
          borderRadius: "8px",
          padding: "10px 20px",
          fontWeight: 600,
          fontSize: "13px",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading && !isLoading ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {isLoading && <Loader2 size={13} className="iq-spin" />}
        {mode === "payment" ? "Buy credit" : "Get started"}
      </button>
    </div>
  );
}
