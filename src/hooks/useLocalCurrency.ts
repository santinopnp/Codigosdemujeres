import { useState, useEffect } from "react";

interface LocalPrice {
  amount: string;   // e.g. "COP 24.500" or "MXN 102"
  loading: boolean;
}

const cache: { currency?: string; rate?: number } = {};

export function useLocalCurrency(usdAmount: number): LocalPrice {
  const [result, setResult] = useState<LocalPrice>({ amount: "", loading: true });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        // Step 1: get visitor currency (cached)
        if (!cache.currency) {
          const geo = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
          const data = await geo.json();
          cache.currency = data.currency || "USD";
        }

        const currency = cache.currency!;
        if (currency === "USD") {
          if (!cancelled) setResult({ amount: "", loading: false });
          return;
        }

        // Step 2: get exchange rate (cached)
        if (!cache.rate) {
          const fx = await fetch(`https://open.er-api.com/v6/latest/USD`, { signal: AbortSignal.timeout(4000) });
          const fxData = await fx.json();
          cache.rate = fxData.rates?.[currency] ?? null;
        }

        if (!cache.rate) {
          if (!cancelled) setResult({ amount: "", loading: false });
          return;
        }

        const localAmount = usdAmount * cache.rate;
        const formatted = new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          maximumFractionDigits: localAmount >= 100 ? 0 : 2,
        }).format(localAmount);

        if (!cancelled) setResult({ amount: formatted, loading: false });
      } catch {
        if (!cancelled) setResult({ amount: "", loading: false });
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [usdAmount]);

  return result;
}
