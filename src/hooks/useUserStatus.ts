import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getPaymentStatus, type PaymentStatus } from "../lib/api";

interface UserStatusResult extends PaymentStatus {
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserStatus(): UserStatusResult {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPaymentStatus(getToken);
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load status.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [tick]);

  return {
    plan: status?.plan ?? "free",
    sub_status: status?.sub_status ?? "inactive",
    topup_credits: status?.topup_credits ?? 0,
    weekly_used: status?.weekly_used ?? 0,
    lifetime_used: status?.lifetime_used ?? 0,
    isLoading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
