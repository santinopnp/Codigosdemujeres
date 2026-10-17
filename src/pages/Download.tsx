import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

type State = "loading" | "redirecting" | "not_found" | "not_paid" | "expired" | "error";

const COPY = {
  es: {
    loading:     "Preparando tu descarga…",
    redirecting: "Abriendo tu descarga…",
    not_found:   "Enlace no válido",
    not_found_d: "Este enlace de descarga no existe. Revisa tu correo o contáctanos.",
    not_paid:    "Pago pendiente",
    not_paid_d:  "Tu pago aún no ha sido confirmado. Si ya pagaste, espera unos minutos y recarga.",
    expired:     "Enlace expirado",
    expired_d:   "Los enlaces de descarga son válidos por 30 días. Contáctanos para obtener uno nuevo.",
    error:       "Error inesperado",
    error_d:     "Algo salió mal. Intenta de nuevo o contáctanos.",
    retry:       "Reintentar",
    home:        "Volver al inicio",
    contact:     "Contáctanos",
  },
  en: {
    loading:     "Preparing your download…",
    redirecting: "Opening your download…",
    not_found:   "Invalid link",
    not_found_d: "This download link doesn't exist. Check your email or contact us.",
    not_paid:    "Payment pending",
    not_paid_d:  "Your payment hasn't been confirmed yet. If you already paid, wait a few minutes and reload.",
    expired:     "Link expired",
    expired_d:   "Download links are valid for 30 days. Contact us to get a new one.",
    error:       "Unexpected error",
    error_d:     "Something went wrong. Please try again or contact us.",
    retry:       "Retry",
    home:        "Back to home",
    contact:     "Contact us",
  },
  it: {
    loading:     "Preparazione del download in corso…",
    redirecting: "Apertura del download in corso…",
    not_found:   "Link non valido",
    not_found_d: "Questo link di download non esiste. Controlla la tua email o contattaci.",
    not_paid:    "Pagamento in sospeso",
    not_paid_d:  "Il tuo pagamento non è ancora stato confermato. Se hai già pagato, attendi qualche minuto e ricarica.",
    expired:     "Link scaduto",
    expired_d:   "I link di download sono validi per 30 giorni. Contattaci per ottenerne uno nuovo.",
    error:       "Errore imprevisto",
    error_d:     "Qualcosa è andato storto. Riprova o contattaci.",
    retry:       "Riprova",
    home:        "Torna alla home",
    contact:     "Contattaci",
  },
} as const;

type Lang = keyof typeof COPY;

function detectLang(): Lang {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "it") return "it";
    if (params.get("lang") === "en") return "en";
  } catch { /* noop */ }
  const nav = (navigator.language ?? "es").toLowerCase();
  if (nav.startsWith("it")) return "it";
  if (nav.startsWith("en")) return "en";
  return "es";
}

export default function Download() {
  const { token } = useParams<{ token: string }>();
  const navigate  = useNavigate();
  const [state, setState] = useState<State>("loading");
  const lang = detectLang();
  const t = COPY[lang];

  useEffect(() => {
    if (!token) { setState("not_found"); return; }
    let cancelled = false;

    async function attempt() {
      setState("loading");
      try {
        const res = await fetch(`/api/store/download/${token}`, {
          method: "GET",
          redirect: "manual",
        });

        if (cancelled) return;

        if (res.type === "opaqueredirect" || res.status === 302 || res.status === 301) {
          // fetch with redirect:"manual" gives an opaqueredirect — use the URL directly
          setState("redirecting");
          window.location.href = `/api/store/download/${token}`;
          return;
        }

        if (res.ok) {
          setState("redirecting");
          window.location.href = `/api/store/download/${token}`;
          return;
        }

        const data = await res.json().catch(() => ({}));
        const err  = (data.error ?? "") as string;

        if (err === "not_found")  { setState("not_found");  return; }
        if (err === "not_paid")   { setState("not_paid");   return; }
        if (err === "expired")    { setState("expired");    return; }

        setState("error");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    attempt();
    return () => { cancelled = true; };
  }, [token]);

  const isError = state !== "loading" && state !== "redirecting";

  const iconMap: Record<string, JSX.Element> = {
    redirecting: (
      <svg className="w-9 h-9" style={{ color: "#C2506A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
    not_found: (
      <svg className="w-9 h-9" style={{ color: "#C44D4D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    not_paid: (
      <svg className="w-9 h-9" style={{ color: "#C2506A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    expired: (
      <svg className="w-9 h-9" style={{ color: "#A89882" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    error: (
      <svg className="w-9 h-9" style={{ color: "#C44D4D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="square" strokeLinejoin="miter" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  };

  const accentColor = (state === "not_found" || state === "error") ? "#C44D4D"
    : state === "expired" ? "#A89882"
    : "#C2506A";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#FBF7F1" }}>
      <span className="font-editorial text-xl mb-12" style={{ color: "#C2506A", letterSpacing: "0.12em" }}>Códigos</span>

      <div
        className="flex items-center justify-center mb-6"
        style={{ width: 72, height: 72, backgroundColor: "#F3EBE0", border: `2px solid ${accentColor}` }}
      >
        {(state === "loading") ? (
          <div style={{ width: 28, height: 28, border: "3px solid #D9C9B0", borderTopColor: "#C2506A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        ) : iconMap[state]}
      </div>

      {state === "loading" && (
        <p className="text-base" style={{ color: "#7A6652" }}>{t.loading}</p>
      )}

      {state === "redirecting" && (
        <p className="text-base" style={{ color: "#7A6652" }}>{t.redirecting}</p>
      )}

      {isError && (
        <div className="text-center" style={{ maxWidth: 340 }}>
          <h1 className="mb-3" style={{ fontSize: "1.5rem", color: accentColor }}>{t[state]}</h1>
          <p className="text-sm mb-8" style={{ color: "#7A6652", lineHeight: 1.7 }}>{t[`${state}_d` as keyof typeof t]}</p>

          <div className="flex flex-col gap-3">
            {state === "not_paid" && (
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                {t.retry}
              </button>
            )}
            <button onClick={() => navigate("/")} className={state === "not_paid" ? "btn-outline" : "btn-primary"}>
              {t.home}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
