import React, { useState, useEffect, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  LeadPopup – Email capture popup offering the free first chapter    */
/*  Shows after 15s on landing/blog pages, respects localStorage.      */
/* ------------------------------------------------------------------ */

const DISMISSED_KEY = "codigos_lead_dismissed";
const CAPTURED_KEY  = "codigos_lead_captured";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const COLORS = {
  bg:          "#FBF7F1",
  cherry:      "#C2506A",
  cherryHover: "#A8445A",
  burgundy:    "#4A1A2E",
  gold:        "#B8936A",
  muted:       "#7A6652",
  border:      "#F3EBE0",
  overlay:     "rgba(0,0,0,0.5)",
  white:       "#FFFFFF",
};

type Lang = "es" | "en" | "it";

const TEXT: Record<Lang, {
  headline:     string;
  subtext:      string;
  placeholder:  string;
  optinLabel:   string;
  cta:          string;
  privacy:      string;
  successTitle: string;
  successBody:  string;
  readNow:      string;
  readLater:    string;
  errorEmail:   string;
}> = {
  es: {
    headline:     "📖 Lee el primer capítulo gratis",
    subtext:      "Descubre los códigos que están transformando la vida de miles de mujeres.",
    placeholder:  "Tu correo electrónico",
    optinLabel:   "Sí, también quiero recibir inspiración y consejos de Dayana.",
    cta:          "Recibir mi capítulo gratis",
    privacy:      "🔒 Tu privacidad es importante. Puedes darte de baja cuando quieras.",
    successTitle: "¡Aquí está tu capítulo!",
    successBody:  "También te lo enviamos por correo para que lo tengas siempre.",
    readNow:      "Leer ahora →",
    readLater:    "Leer después",
    errorEmail:   "Ingresa un correo válido",
  },
  en: {
    headline:     "📖 Read the first chapter free",
    subtext:      "Discover the codes that are transforming the lives of thousands of women.",
    placeholder:  "Your email address",
    optinLabel:   "Yes, I'd also like to receive inspiration and tips from Dayana.",
    cta:          "Get my free chapter",
    privacy:      "🔒 Your privacy matters. Unsubscribe any time.",
    successTitle: "Your chapter is ready!",
    successBody:  "We also sent it to your email so you always have it.",
    readNow:      "Read now →",
    readLater:    "Read later",
    errorEmail:   "Enter a valid email",
  },
  it: {
    headline:     "📖 Leggi il primo capitolo gratis",
    subtext:      "Scopri i codici che stanno trasformando la vita di migliaia di donne.",
    placeholder:  "La tua email",
    optinLabel:   "Sì, voglio anche ricevere ispirazione e consigli da Dayana.",
    cta:          "Ricevi il mio capitolo gratis",
    privacy:      "🔒 La tua privacy è importante. Puoi disiscriverti quando vuoi.",
    successTitle: "Il tuo capitolo è pronto!",
    successBody:  "Te lo abbiamo inviato anche via email così lo hai sempre con te.",
    readNow:      "Leggi ora →",
    readLater:    "Leggi dopo",
    errorEmail:   "Inserisci un'email valida",
  },
};

function detectLang(): Lang {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "en") return "en";
    if (params.get("lang") === "it") return "it";
    if (navigator.language?.startsWith("en")) return "en";
    if (navigator.language?.startsWith("it")) return "it";
  } catch { /* fallback */ }
  return "es";
}

function shouldShowPopup(): boolean {
  const path = window.location.pathname;
  const allowed = path === "/" || path === "/blog" || path.startsWith("/blog/");
  if (!allowed) return false;
  if (localStorage.getItem(CAPTURED_KEY)) return false;
  const dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed) {
    const ts = parseInt(dismissed, 10);
    if (!isNaN(ts) && Date.now() - ts < SEVEN_DAYS_MS) return false;
  }
  return true;
}

export default function LeadPopup() {
  const [show,             setShow]           = useState(false);
  const [visible,          setVisible]        = useState(false);
  const [email,            setEmail]          = useState("");
  const [newsletterOptIn,  setNewsletterOptIn] = useState(true);
  const [loading,          setLoading]        = useState(false);
  const [success,          setSuccess]        = useState(false);
  const [sampleUrl,        setSampleUrl]      = useState<string | null>(null);
  const [error,            setError]          = useState("");
  const lang = detectLang();
  const t    = TEXT[lang];

  useEffect(() => {
    if (!shouldShowPopup()) return;
    const timer = setTimeout(() => {
      setShow(true);
      requestAnimationFrame(() => setVisible(true));
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }, 300);
  }, []);

  function validateEmailField(val: string) {
    if (!val.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
      setError(t.errorEmail);
    } else {
      setError("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || loading) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t.errorEmail);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/store/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          lang,
          newsletterOptIn,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setSampleUrl(data.sampleUrl ?? `/api/store/sample?lang=${lang}`);
      setSuccess(true);
      localStorage.setItem(CAPTURED_KEY, "1");
    } catch {
      setError(
        lang === "es"
          ? "Hubo un error. Inténtalo de nuevo."
          : "Something went wrong. Try again."
      );
    }
    setLoading(false);
  }

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes leadPopIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          backgroundColor: COLORS.overlay,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%", zIndex: 10001,
          transform: visible
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.3s ease",
          width: "92vw", maxWidth: 420,
          backgroundColor: COLORS.bg,
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 32, height: 32, borderRadius: "50%",
            border: "none", backgroundColor: "transparent",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            color: COLORS.muted, fontSize: 20, transition: "background-color 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = COLORS.border)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {/* Decorative top bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${COLORS.cherry}, ${COLORS.gold})` }} />

        <div style={{ padding: "32px 28px 28px" }}>
          {!success ? (
            <>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 22, fontWeight: 700, color: COLORS.burgundy,
                margin: "0 0 10px", lineHeight: 1.3, paddingRight: 24,
              }}>
                {t.headline}
              </h2>

              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 15, color: COLORS.muted, lineHeight: 1.6, margin: "0 0 24px",
              }}>
                {t.subtext}
              </p>

              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (error) setError(""); }}
                  placeholder={t.placeholder}
                  autoComplete="email"
                  style={{
                    width: "100%", padding: "14px 16px",
                    border: `1.5px solid ${error ? "#E74C3C" : COLORS.border}`,
                    borderRadius: 10, fontSize: 15,
                    fontFamily: "'Nunito', sans-serif",
                    backgroundColor: COLORS.white, outline: "none",
                    transition: "border-color 0.2s", boxSizing: "border-box",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = COLORS.cherry)}
                  onBlur={e => {
                    validateEmailField(e.target.value);
                    e.currentTarget.style.borderColor = error ? "#E74C3C" : COLORS.border;
                  }}
                />

                {error && (
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#E74C3C", margin: "6px 0 0" }}>
                    {error}
                  </p>
                )}

                {/* Newsletter opt-in */}
                <label style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  margin: "14px 0 0", cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={e => setNewsletterOptIn(e.target.checked)}
                    style={{
                      marginTop: 2, flexShrink: 0,
                      width: 16, height: 16, accentColor: COLORS.cherry, cursor: "pointer",
                    }}
                  />
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: COLORS.muted, lineHeight: 1.5 }}>
                    {t.optinLabel}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", marginTop: 16, padding: "14px 24px",
                    backgroundColor: loading ? COLORS.gold : COLORS.cherry,
                    color: COLORS.white, border: "none", borderRadius: 10,
                    fontSize: 15, fontWeight: 700,
                    fontFamily: "'Nunito', sans-serif",
                    cursor: loading ? "default" : "pointer",
                    transition: "background-color 0.2s, transform 0.15s",
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = COLORS.cherryHover; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = COLORS.cherry; }}
                  onMouseDown={e  => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
                  onMouseUp={e    => { if (!loading) e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {loading ? (lang === "es" ? "Enviando..." : "Sending...") : t.cta}
                </button>
              </form>

              <p style={{
                fontFamily: "'Nunito', sans-serif", fontSize: 12,
                color: COLORS.muted, textAlign: "center", margin: "16px 0 0", lineHeight: 1.5,
              }}>
                {t.privacy}
              </p>
            </>
          ) : (
            /* ── Success state ─────────────────────────────────────────── */
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                backgroundColor: "#F9EFF5",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill={COLORS.cherry}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>

              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 20, fontWeight: 700, color: COLORS.burgundy,
                margin: "0 0 8px", lineHeight: 1.3,
              }}>
                {t.successTitle}
              </p>

              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 14, color: COLORS.muted, margin: "0 0 24px", lineHeight: 1.5,
              }}>
                {t.successBody}
              </p>

              {/* Primary CTA — open chapter immediately */}
              {sampleUrl && (
                <a
                  href={sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block", padding: "14px 24px",
                    backgroundColor: COLORS.cherry, color: COLORS.white,
                    borderRadius: 10, textDecoration: "none",
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 15, fontWeight: 700, letterSpacing: "0.04em",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = COLORS.cherryHover)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = COLORS.cherry)}
                >
                  {t.readNow}
                </a>
              )}

              {/* Secondary — close popup */}
              <button
                onClick={dismiss}
                style={{
                  marginTop: 12, background: "none", border: "none",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 13, color: COLORS.muted,
                  cursor: "pointer", textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {t.readLater}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
