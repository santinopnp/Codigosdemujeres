import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function fetchT(url: string, opts?: RequestInit, ms = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

type Status = "pending" | "paid" | "failed" | "refunded" | "unknown";

const COPY = {
  es: {
    title_pending:   "Esperando confirmación de pago",
    body_pending:    "Verificando tu transacción. Esto puede tomar hasta 2 minutos.",
    title_paid:      "¡Pago confirmado!",
    body_paid:       "Tu descarga está lista. Revisa tu correo o usa el botón de abajo.",
    title_failed:    "Pago fallido",
    body_failed:     "No pudimos confirmar tu pago. Si fuiste cobrado, contáctanos.",
    title_refunded:  "Pedido reembolsado",
    body_refunded:   "Este pedido fue reembolsado. Contáctanos si tienes preguntas.",
    title_unknown:   "Pedido no encontrado",
    body_unknown:    "No encontramos este pedido. Verifica el enlace o contáctanos.",
    download:        "Descargar ahora",
    home:            "Volver al inicio",
    checking:        "Verificando…",
    last_check:      "Última verificación",
  },
  en: {
    title_pending:   "Waiting for payment confirmation",
    body_pending:    "Verifying your transaction. This can take up to 2 minutes.",
    title_paid:      "Payment confirmed!",
    body_paid:       "Your download is ready. Check your email or use the button below.",
    title_failed:    "Payment failed",
    body_failed:     "We couldn't confirm your payment. If you were charged, contact us.",
    title_refunded:  "Order refunded",
    body_refunded:   "This order was refunded. Contact us if you have any questions.",
    title_unknown:   "Order not found",
    body_unknown:    "We couldn't find this order. Check the link or contact us.",
    download:        "Download now",
    home:            "Back to home",
    checking:        "Checking…",
    last_check:      "Last checked",
  },
  it: {
    title_pending:   "In attesa della conferma di pagamento",
    body_pending:    "Verifica della transazione in corso. Questo può richiedere fino a 2 minuti.",
    title_paid:      "Pagamento confermato!",
    body_paid:       "Il tuo download è pronto. Controlla la tua email o usa il pulsante qui sotto.",
    title_failed:    "Pagamento fallito",
    body_failed:     "Non siamo riusciti a confermare il pagamento. Se ti è stato addebitato, contattaci.",
    title_refunded:  "Ordine rimborsato",
    body_refunded:   "Questo ordine è stato rimborsato. Contattaci se hai domande.",
    title_unknown:   "Ordine non trovato",
    body_unknown:    "Non abbiamo trovato questo ordine. Verifica il link o contattaci.",
    download:        "Scarica ora",
    home:            "Torna alla home",
    checking:        "Verifica in corso…",
    last_check:      "Ultimo controllo",
  },
} as const;

type Lang = keyof typeof COPY;

function detectLang(): Lang {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "it") return "it";
    if (params.get("lang") === "en") return "en";
  } catch { /* noop */ }
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("it")) return "it";
  if (nav.startsWith("en")) return "en";
  return "es";
}

function fmtTime(d: Date, lang: Lang) {
  const locale = lang === "it" ? "it-IT" : lang === "en" ? "en-GB" : "es-419";
  return d.toLocaleTimeString(locale, { timeStyle: "short" });
}

export default function OrderStatus() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate    = useNavigate();
  const lang        = detectLang();
  const t           = COPY[lang];

  const [status,        setStatus]        = useState<Status>("pending");
  const [format,        setFormat]        = useState<string>("");
  const [libraryToken,  setLibraryToken]  = useState<string | null>(null);
  const [lastCheck,     setLastCheck]     = useState<Date | null>(null);
  const [checking,      setChecking]      = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const POLL_MS = 5_000;

  async function poll() {
    if (!orderId) { setStatus("unknown"); return; }
    setChecking(true);
    try {
      const res = await fetchT(`/api/store/order/${orderId}/status`, undefined, 10000);
      setLastCheck(new Date());
      if (res.status === 404) { setStatus("unknown"); return; }
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.status as Status);
      if (data.format) setFormat(data.format);
      if (data.status !== "pending") {
        // Stop polling once we have a terminal state
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Fetch library token for paid orders via checkout status endpoint
        if (data.status === "paid" && !libraryToken) {
          fetchT(`/api/store/checkout/${orderId}/status`, undefined, 10000)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.downloadToken) setLibraryToken(d.downloadToken); })
            .catch(() => {});
        }
      }
    } catch {
      // Network hiccup — keep polling
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orderId]);

  const isPending  = status === "pending";
  const isPaid     = status === "paid";
  const isTerminal = !isPending;

  const accentColor =
    isPaid              ? "#5A9E6F" :
    status === "failed" ? "#C44D4D" :
    status === "unknown"? "#7A4A58" :
    "#A12B52";

  const icon = isPaid ? (
    <svg className="w-9 h-9" style={{ color: "#5A9E6F" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
    </svg>
  ) : status === "failed" ? (
    <svg className="w-9 h-9" style={{ color: "#C44D4D" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ) : status === "unknown" ? (
    <svg className="w-9 h-9" style={{ color: "#7A4A58" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" strokeLinejoin="miter" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" />
    </svg>
  ) : (
    // Pending spinner
    <div style={{ width: 36, height: 36, border: "3px solid #F1DCE2", borderTopColor: "#A12B52", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
  );

  const downloadToken = undefined; // token comes from email link; orderId page just confirms status

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: "#FFF1F4" }}>
      <span className="font-editorial text-xl mb-12" style={{ color: "#A12B52", letterSpacing: "0.12em" }}>
        Códigos
      </span>

      <div
        className="flex items-center justify-center mb-6"
        style={{ width: 72, height: 72, backgroundColor: "#F1DCE2", border: `2px solid ${accentColor}` }}
      >
        {icon}
      </div>

      <h1 className="mb-3 text-center" style={{ fontSize: "1.4rem" }}>
        {t[`title_${status}` as keyof typeof t]}
      </h1>

      <p className="text-sm mb-2 text-center" style={{ color: "#7A4A58", maxWidth: 340, lineHeight: 1.7 }}>
        {t[`body_${status}` as keyof typeof t]}
      </p>

      {lastCheck && (
        <p className="text-xs mb-8" style={{ color: "#F1DCE2" }}>
          {t.last_check}: {fmtTime(lastCheck, lang)}
          {checking && <span style={{ color: "#A12B52" }}> · {t.checking}</span>}
        </p>
      )}

      {!lastCheck && (
        <p className="text-xs mb-8" style={{ color: "#7A4A58" }}>{t.checking}</p>
      )}

      {/* Pending: animated progress bar */}
      {isPending && (
        <div className="mb-8" style={{ width: "100%", maxWidth: 320, height: 3, backgroundColor: "#F1DCE2", overflow: "hidden" }}>
          <div style={{ height: "100%", backgroundColor: "#A12B52", animation: "progress 2s ease-in-out infinite" }} />
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 320 }} className="flex flex-col gap-3">
        {isPaid && libraryToken && (
          <button className="btn-primary" onClick={() => navigate(`/library/${libraryToken}`)}>
            {lang === "en" ? "Open my library" : lang === "it" ? "Apri la mia biblioteca" : "Abrir mi biblioteca"}
          </button>
        )}
        {isPaid && !libraryToken && (
          <p className="text-xs text-center mb-1" style={{ color: "#7A4A58" }}>
            {lang === "es"
              ? "El enlace de acceso fue enviado a tu correo."
              : lang === "it"
                ? "Il link di accesso è stato inviato alla tua email."
                : "The access link was sent to your email."}
          </p>
        )}
        <button className="btn-primary" style={isPaid && libraryToken ? { background: "transparent", border: "2px solid #F1DCE2", color: "#7A4A58" } : {}} onClick={() => navigate("/")}>
          {t.home}
        </button>
      </div>

      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes progress { 0% { width: 0%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 0%; margin-left: 100%; } }
      `}</style>
    </div>
  );
}
