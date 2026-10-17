import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Facebook Pixel – lightweight React wrapper                        */
/*  Reads pixel ID from prop or VITE_FB_PIXEL_ID env variable.        */
/*  If no ID is available the component is a no-op.                   */
/* ------------------------------------------------------------------ */

type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead";

type EventParams = Record<string, string | number | boolean | undefined>;

/* Extend window for the fbq global */
declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq: typeof window.fbq;
  }
}

/* ---- public helper ---- */

/**
 * Fire a Facebook Pixel standard or custom event.
 * Safe to call even before the pixel script loads – calls are queued.
 * If no pixel is configured the call is silently ignored.
 */
export function trackEvent(eventName: StandardEvent | string, params?: EventParams): void {
  if (typeof window === "undefined" || !window.fbq) return;
  if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
}

/* ---- component ---- */

interface FacebookPixelProps {
  pixelId?: string;
}

export default function FacebookPixel({ pixelId }: FacebookPixelProps) {
  const id = pixelId || import.meta.env.VITE_FB_PIXEL_ID;

  useEffect(() => {
    if (!id) return;

    // Prevent double-init (HMR / StrictMode)
    if (window.fbq && (window.fbq as unknown as { _loaded?: boolean })._loaded) return;

    /* ---------- fbq stub (identical to Facebook's snippet) ---------- */
    const n: Window["fbq"] = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        (n.queue as unknown[]).push(args);
      }
    } as Window["fbq"];

    if (!window.fbq) {
      window.fbq = n;
      window._fbq = n;
    }

    const fbq = window.fbq;
    fbq.queue = fbq.queue || [];
    (fbq as unknown as { loaded: boolean }).loaded = true;
    (fbq as unknown as { version: string }).version = "2.0";

    /* ---------- inject script ---------- */
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    /* ---------- noscript pixel fallback ---------- */
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    /* ---------- init + first PageView ---------- */
    window.fbq("init", id);
    window.fbq("track", "PageView");

    /* Cleanup on unmount */
    return () => {
      script.remove();
      noscript.remove();
    };
  }, [id]);

  return null;
}
