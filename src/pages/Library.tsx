import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";

function fetchT(url: string, opts?: RequestInit, ms = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChapterMeta {
  chapter_number: number;
  format: "ebook" | "audio";
  title_es: string;
  title_en?: string;
  duration_seconds?: number;
}

interface OrderInfo {
  format: "ebook" | "audio" | "bundle";
  email: string;
  allowedFormats: string[];
  chapters: ChapterMeta[];
}

interface ChapterContent {
  chapter_number: number;
  title: string;       // language-resolved by server
  body: string;        // language-resolved + watermarked by server
  totalChapters: number;
}

type Lang = "es" | "en" | "it";

const API = "/api/library";

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function useLang(): Lang {
  try {
    const p = new URLSearchParams(window.location.search);
    if (p.get("lang") === "it") return "it";
    if (p.get("lang") === "en") return "en";
  } catch { /* noop */ }
  const nav = (navigator.language || "es").toLowerCase();
  if (nav.startsWith("it")) return "it";
  if (nav.startsWith("en")) return "en";
  return "es";
}

function coverUrl(lang: Lang): string {
  return lang === "en" ? "/cover-en.png" : lang === "it" ? "/cover-it.png" : "/cover-es.png";
}

// ─── Per-language UI strings ──────────────────────────────────────────────────
const L = {
  es: {
    export: "Exportar", export_title: "Exportar / Enviar",
    read_device: "Leer en tu dispositivo",
    dl_epub: "Descargar EPUB", dl_epub_sub: "Apple Books, Google Play Books, Kobo",
    send_kindle: "Enviar a Kindle", send_kindle_sub: "Dispositivos y app Kindle",
    read_here: "Leer aquí", read_here_sub: "Lector integrado con progreso guardado",
    back: "← Volver",
    kindle_idle: "Enviar a Kindle", kindle_sending: "Enviando...", kindle_sent: "¡Enviado!", kindle_error: "Error - Reintentar",
    kindle_fail: "No se pudo enviar. Verifica el correo e intenta de nuevo.",
    search: "Buscar capítulo…",
    coming_soon: "Contenido próximamente",
    coming_body: "Tu libro aparecerá aquí cuando se carguen los capítulos.",
  },
  en: {
    export: "Export", export_title: "Export / Send",
    read_device: "Read on your device",
    dl_epub: "Download EPUB", dl_epub_sub: "Apple Books, Google Play Books, Kobo",
    send_kindle: "Send to Kindle", send_kindle_sub: "Amazon Kindle devices & app",
    read_here: "Read here", read_here_sub: "Built-in reader with progress sync",
    back: "← Back",
    kindle_idle: "Send to Kindle", kindle_sending: "Sending...", kindle_sent: "Sent!", kindle_error: "Error - Retry",
    kindle_fail: "Could not send. Check the email and try again.",
    search: "Search chapters…",
    coming_soon: "Content coming soon",
    coming_body: "Your book will appear here once the chapters are uploaded.",
  },
  it: {
    export: "Esporta", export_title: "Esporta / Invia",
    read_device: "Leggi sul tuo dispositivo",
    dl_epub: "Scarica EPUB", dl_epub_sub: "Apple Books, Google Play Books, Kobo",
    send_kindle: "Invia a Kindle", send_kindle_sub: "Dispositivi e app Amazon Kindle",
    read_here: "Leggi qui", read_here_sub: "Lettore integrato con progresso salvato",
    back: "← Indietro",
    kindle_idle: "Invia a Kindle", kindle_sending: "Invio...", kindle_sent: "Inviato!", kindle_error: "Errore - Riprova",
    kindle_fail: "Invio non riuscito. Controlla l'email e riprova.",
    search: "Cerca capitolo…",
    coming_soon: "Contenuto in arrivo",
    coming_body: "Il tuo libro apparirà qui quando i capitoli saranno caricati.",
  },
} as const;

// ─── WebReader ────────────────────────────────────────────────────────────────

function WebReader({
  token,
  chapters,
  email,
  initialChapter = 1,
}: {
  token: string;
  chapters: ChapterMeta[];
  email: string;
  initialChapter?: number;
}) {
  const lang = useLang();
  const [currentNum, setCurrentNum] = useState(initialChapter);
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [kindleMode, setKindleMode] = useState(false);
  const [kindleEmail, setKindleEmail] = useState("");
  const [kindleStatus, setKindleStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const contentRef = useRef<HTMLDivElement>(null);
  const total = chapters.length;

  const handleDownloadEpub = () => {
    const link = document.createElement("a");
    link.href = `${API}/${token}/export/epub`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportOpen(false);
  };

  const handleSendToKindle = async () => {
    if (!kindleEmail || !kindleEmail.includes("@")) return;
    setKindleStatus("sending");
    try {
      const res = await fetchT(`${API}/${token}/send-to-kindle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kindleEmail }),
      });
      if (!res.ok) throw new Error("send_failed");
      setKindleStatus("sent");
      setTimeout(() => { setKindleMode(false); setKindleStatus("idle"); setExportOpen(false); }, 2500);
    } catch {
      setKindleStatus("error");
    }
  };

  // Load chapter content
  const loadChapter = useCallback(
    async (num: number) => {
      setLoading(true);
      try {
        const res = await fetchT(`${API}/${token}/chapter/${num}?lang=${lang}`);
        if (!res.ok) throw new Error("fetch_failed");
        const data = await res.json();
        setChapter(data.chapter);
        setCurrentNum(num);
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setLoading(false);
      }
    },
    [token, lang]
  );

  // Save progress
  const saveProgress = useCallback(
    async (num: number) => {
      try {
        await fetchT(`${API}/${token}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format: "ebook", chapterNumber: num, position: 0 }),
        }, 10000);
      } catch (e) {
        console.warn("[library] progress save failed:", (e as Error).message);
      }
    },
    [token]
  );

  useEffect(() => {
    if (chapters.length > 0) loadChapter(currentNum);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) saveProgress(currentNum);
  }, [currentNum, loading]);

  // Swipe detection
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentNum < total) loadChapter(currentNum + 1);
      if (diff < 0 && currentNum > 1) loadChapter(currentNum - 1);
    }
  };

  const title = chapter?.title ?? "";
  const body = chapter?.body ?? "";

  const bg = dark ? "#1a1208" : "#FBF7F1";
  const fg = dark ? "#e8dcc8" : "#3D2B1F";
  const accent = "#C2506A";
  const progress = total > 0 ? ((currentNum - 1) / (total - 1)) * 100 : 0;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: bg, color: fg, fontFamily: "Nunito, Arial, sans-serif" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Anti-piracy + book typography */}
      <style>{`
        .reader-content { user-select: none; -webkit-user-select: none; }
        .reader-content * { user-select: none; -webkit-user-select: none; }
        .reader-content img { pointer-events: none; }
        @media print { body { display: none !important; } }

        /* ── Typography ── */
        .reader-content p {
          margin-bottom: 1.5em;
          text-align: justify;
          hyphens: auto;
        }
        .reader-content p.question {
          font-style: italic;
          color: ${dark ? "#c9967a" : "#8B4A3A"};
          margin-bottom: 0.8em;
        }

        /* ── Blockquotes ── */
        .reader-content blockquote {
          border-left: 3px solid #C2506A;
          padding: 0.6em 1.2em;
          margin: 1.8em 0;
          font-style: italic;
          font-family: Georgia, serif;
          font-size: 1.05em;
          line-height: 1.7;
          color: ${dark ? "#d4a0a8" : "#8B3A50"};
          background: ${dark ? "rgba(194,80,106,0.08)" : "rgba(194,80,106,0.05)"};
          border-radius: 0 4px 4px 0;
        }

        /* ── Ornamental dividers ── */
        .reader-content .ornament {
          text-align: center;
          margin: 2em 0;
          letter-spacing: 0.6em;
          color: #C2506A;
          opacity: 0.5;
          font-size: 12px;
        }

        /* ── Affirmations list ── */
        .reader-content ul.affirmations {
          list-style: none;
          padding: 1em 0;
          margin: 1.5em auto;
          text-align: center;
          max-width: 280px;
        }
        .reader-content ul.affirmations li {
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 1.1em;
          color: ${dark ? "#d4a0a8" : "#C2506A"};
          padding: 0.35em 0;
          border-bottom: 1px solid ${dark ? "rgba(194,80,106,0.15)" : "rgba(194,80,106,0.12)"};
        }
        .reader-content ul.affirmations li:last-child { border-bottom: none; }

        /* ── Checklist ── */
        .reader-content ul.checklist {
          list-style: none;
          padding: 0;
          margin: 1em 0 1.5em;
        }
        .reader-content ul.checklist li {
          padding: 0.45em 0 0.45em 1.8em;
          position: relative;
          border-bottom: 1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"};
          line-height: 1.5;
        }
        .reader-content ul.checklist li::before {
          content: "✦";
          position: absolute;
          left: 0;
          color: #C2506A;
          font-size: 10px;
          top: 0.6em;
        }

        /* ── Checklist section headers ── */
        .reader-content h3.checklist-section {
          font-family: Georgia, serif;
          font-size: 1em;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${dark ? "#d4a0a8" : "#C2506A"};
          margin: 1.8em 0 0.6em;
          font-weight: 400;
        }

        /* ── Dedicatoria block ── */
        .reader-content .dedicatoria {
          text-align: center;
          margin: 1em 0 2em;
        }
        .reader-content .dedicatoria blockquote {
          border-left: none;
          border-top: 1px solid ${dark ? "rgba(194,80,106,0.3)" : "rgba(194,80,106,0.2)"};
          border-bottom: 1px solid ${dark ? "rgba(194,80,106,0.3)" : "rgba(194,80,106,0.2)"};
          background: none;
          text-align: center;
          font-size: 1.05em;
          padding: 1em 0;
        }

        /* ── Author photo ── */
        .reader-content .author-photo {
          text-align: center;
          margin: 1.5em 0 2em;
        }
        .reader-content .author-photo img {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          object-fit: cover;
          object-position: center top;
          border: 3px solid ${dark ? "rgba(194,80,106,0.3)" : "rgba(194,80,106,0.2)"};
          box-shadow: 0 8px 24px ${dark ? "rgba(0,0,0,0.4)" : "rgba(194,80,106,0.15)"};
        }

        /* ── Author signature ── */
        .reader-content .author-signature {
          text-align: right;
          font-family: Georgia, serif;
          font-style: italic;
          font-size: 1.05em;
          color: ${dark ? "#d4a0a8" : "#C2506A"};
          margin-top: 2em;
          padding-right: 1em;
        }

        /* ── Final message ── */
        .reader-content .final-message {
          margin-top: 2em;
          padding: 1.5em;
          background: ${dark ? "rgba(194,80,106,0.1)" : "rgba(194,80,106,0.06)"};
          border-radius: 8px;
          text-align: center;
        }
        .reader-content .final-message p { text-align: center; }
        .reader-content .final-message blockquote {
          border-left: none;
          background: none;
          font-size: 1.15em;
          text-align: center;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${dark ? "#3a2a1a" : "#F3EBE0"}`, background: bg, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 20, padding: 4 }} aria-label="Índice">☰</button>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 14, letterSpacing: ".1em", color: accent, fontWeight: 700 }}>
          CÓDIGOS {total > 0 ? `· ${currentNum}/${total}` : ""}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setFontSize(f => Math.max(14, f - 2))} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 14, padding: 4 }}>A-</button>
          <button onClick={() => setFontSize(f => Math.min(28, f + 2))} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 18, padding: 4 }}>A+</button>
          <button onClick={() => setDark(d => !d)} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 18, padding: 4 }}>{dark ? "☀" : "☾"}</button>
          <div style={{ position: "relative" }}>
            <button onClick={() => { setExportOpen(!exportOpen); setKindleMode(false); }} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 16, padding: 4 }} aria-label={L[lang].export} title={L[lang].export_title}>
              ↗
            </button>
            {exportOpen && (
              <div style={{
                position: "absolute", top: "110%", right: 0, zIndex: 50, minWidth: 260,
                background: dark ? "#2a1a0a" : "#FBF7F1", border: `1px solid ${dark ? "#3a2a1a" : "#F3EBE0"}`,
                boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: 16, overflow: "hidden", borderRadius: 8,
              }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: accent, marginBottom: 14, fontWeight: 700 }}>
                  {L[lang].read_device}
                </div>

                {!kindleMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* EPUB Download */}
                    <button onClick={handleDownloadEpub} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                      background: dark ? "#1a1208" : "#fff", border: `1px solid ${dark ? "#3a2a1a" : "#E8DDD4"}`,
                      color: fg, cursor: "pointer", fontSize: 13, fontFamily: "Nunito, sans-serif", textAlign: "left", borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>📖</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{L[lang].dl_epub}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>{L[lang].dl_epub_sub}</div>
                      </div>
                    </button>

                    {/* Send to Kindle */}
                    <button onClick={() => setKindleMode(true)} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                      background: dark ? "#1a1208" : "#fff", border: `1px solid ${dark ? "#3a2a1a" : "#E8DDD4"}`,
                      color: fg, cursor: "pointer", fontSize: 13, fontFamily: "Nunito, sans-serif", textAlign: "left", borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>📱</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{L[lang].send_kindle}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>{L[lang].send_kindle_sub}</div>
                      </div>
                    </button>

                    {/* Read here */}
                    <button onClick={() => setExportOpen(false)} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                      background: dark ? "rgba(194,80,106,0.15)" : "rgba(194,80,106,0.08)",
                      border: `1px solid ${accent}33`, color: accent,
                      cursor: "pointer", fontSize: 13, fontFamily: "Nunito, sans-serif", textAlign: "left", borderRadius: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>✨</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{L[lang].read_here}</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{L[lang].read_here_sub}</div>
                      </div>
                    </button>
                  </div>
                ) : (
                  /* Kindle email form */
                  <div>
                    <button onClick={() => setKindleMode(false)} style={{ background: "none", border: "none", color: accent, cursor: "pointer", fontSize: 12, marginBottom: 10, padding: 0 }}>
                      {L[lang].back}
                    </button>
                    <p style={{ fontSize: 12, color: fg, opacity: 0.7, margin: "0 0 10px", lineHeight: 1.5 }}>
                      {lang === "it"
                        ? "Inserisci la tua email Kindle (Impostazioni → Il tuo account → Email Invia a Kindle)."
                        : lang === "en"
                          ? "Enter your Kindle email (Settings → Your Account → Send-to-Kindle Email)."
                          : "Ingresa tu correo Kindle (Ajustes → Tu cuenta → Correo de envío a Kindle)."}
                    </p>
                    <input
                      type="email"
                      placeholder="user@kindle.com"
                      value={kindleEmail}
                      onChange={(e) => setKindleEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", border: `1px solid ${dark ? "#3a2a1a" : "#E8DDD4"}`,
                        background: dark ? "#1a1208" : "#fff", color: fg, fontSize: 13,
                        fontFamily: "Nunito, sans-serif", boxSizing: "border-box", marginBottom: 10,
                        outline: "none", borderRadius: 6,
                      }}
                    />
                    <button
                      onClick={handleSendToKindle}
                      disabled={kindleStatus === "sending" || kindleStatus === "sent"}
                      style={{
                        width: "100%", padding: "10px", border: "none", background: accent, color: "#FBF7F1",
                        cursor: kindleStatus === "sending" ? "wait" : "pointer", fontSize: 13,
                        fontFamily: "Nunito, sans-serif", fontWeight: 600, borderRadius: 6,
                      }}
                    >
                      {kindleStatus === "idle" && L[lang].kindle_idle}
                      {kindleStatus === "sending" && L[lang].kindle_sending}
                      {kindleStatus === "sent" && L[lang].kindle_sent}
                      {kindleStatus === "error" && L[lang].kindle_error}
                    </button>
                    {kindleStatus === "error" && (
                      <div style={{ fontSize: 12, color: "#B33", marginTop: 8 }}>
                        {L[lang].kindle_fail}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
          <div style={{ width: 280, maxWidth: "85vw", background: bg, borderRight: `1px solid ${dark ? "#3a2a1a" : "#F3EBE0"}`, overflowY: "auto", padding: "16px 0", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, color: accent }}>{lang === "it" ? "Capitoli" : lang === "en" ? "Chapters" : "Capítulos"}</span>
              <button onClick={() => { setSidebarOpen(false); setSidebarSearch(""); }} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <div style={{ padding: "0 16px 12px" }}>
              <input
                type="search"
                placeholder={L[lang].search}
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", fontSize: 13,
                  border: `1px solid ${dark ? "#3a2a1a" : "#E8DDD4"}`,
                  background: dark ? "#2a1a0a" : "#fff", color: fg,
                  fontFamily: "Nunito, sans-serif", outline: "none", borderRadius: 6,
                }}
              />
            </div>
            {chapters
              .filter(ch => {
                if (!sidebarSearch.trim()) return true;
                const q = sidebarSearch.toLowerCase();
                return (ch.title_es?.toLowerCase().includes(q) || ch.title_en?.toLowerCase().includes(q));
              })
              .map((ch) => (
              <button
                key={ch.chapter_number}
                onClick={() => { loadChapter(ch.chapter_number); setSidebarOpen(false); setSidebarSearch(""); }}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 16px",
                  background: ch.chapter_number === currentNum ? (dark ? "#2a1a0a" : "#F9EFF5") : "none",
                  border: "none", borderLeft: ch.chapter_number === currentNum ? `3px solid ${accent}` : "3px solid transparent",
                  color: ch.chapter_number === currentNum ? accent : fg, cursor: "pointer", fontSize: 13, lineHeight: 1.5,
                }}
              >
                <span style={{ opacity: 0.5, marginRight: 8 }}>{ch.chapter_number}.</span>
                {lang === "it" ? ((ch as any).title_it || ch.title_en || ch.title_es) : lang === "en" && ch.title_en ? ch.title_en : ch.title_es}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} onClick={() => { setSidebarOpen(false); setSidebarSearch(""); }} />
        </div>
      )}

      {/* Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "32px 20px", maxWidth: 680, margin: "0 auto", width: "100%" }} className="reader-content">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80, gap: 16 }}>
            <div style={{ width: 36, height: 36, border: `2px solid ${dark ? "#5a3a2a" : "#F3EBE0"}`, borderTopColor: accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <div style={{ fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: "0.2em", color: accent, opacity: 0.6 }}>CÓDIGOS</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : total === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80, color: dark ? "#9a8070" : "#A89882" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 40, marginBottom: 20, opacity: 0.3 }}>📖</div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 16, marginBottom: 8 }}>
              {L[lang].coming_soon}
            </p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>
              {L[lang].coming_body}
            </p>
          </div>
        ) : (
          <>
            {/* Chapter title card */}
            <div style={{
              textAlign: "center",
              marginBottom: 36,
              paddingBottom: 28,
              borderBottom: `1px solid ${dark ? "rgba(194,80,106,0.2)" : "rgba(194,80,106,0.15)"}`,
            }}>
              {currentNum === 1 && (
                <img
                  src={coverUrl(lang)}
                  alt="Códigos que toda mujer debería saber"
                  style={{
                    width: "60%", maxWidth: 240, height: "auto", margin: "0 auto 24px", display: "block",
                    boxShadow: `6px 6px 28px rgba(194,80,106,${dark ? "0.4" : "0.25"}), -3px 2px 0 rgba(139,58,80,0.3)`,
                    borderRadius: "2px 6px 6px 2px",
                  }}
                />
              )}
              <div style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: dark ? "#c9967a" : "#C2506A",
                marginBottom: 10,
                opacity: 0.7,
              }}>
                Capítulo {currentNum}
              </div>
              <h2 style={{
                fontFamily: "Georgia, serif",
                fontSize: fontSize > 20 ? 26 : 22,
                color: dark ? "#e8dcc8" : "#3D2B1F",
                lineHeight: 1.35,
                margin: "0 0 14px",
                fontWeight: 400,
              }}>{title}</h2>
              <div style={{
                fontSize: 14,
                color: accent,
                letterSpacing: "0.5em",
                opacity: 0.5,
              }}>✦</div>
            </div>
            <div
              style={{ fontSize, lineHeight: 1.95, color: fg, position: "relative" }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body || "", { ADD_ATTR: ["style"], FORCE_BODY: false }) }}
            />
            {/* Watermark overlay */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 1 }} aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top: `${10 + i * 12}%`,
                  left: "-20%",
                  width: "140%",
                  textAlign: "center",
                  transform: "rotate(-30deg)",
                  fontSize: 13,
                  color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  letterSpacing: ".05em",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}>
                  {email}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${dark ? "#3a2a1a" : "#F3EBE0"}`, background: bg }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 680, margin: "0 auto" }}>
          <button
            onClick={() => currentNum > 1 && loadChapter(currentNum - 1)}
            disabled={currentNum <= 1}
            style={{ background: "none", border: `1px solid ${currentNum <= 1 ? (dark ? "#3a2a1a" : "#F3EBE0") : accent}`, color: currentNum <= 1 ? (dark ? "#5a4a3a" : "#C9B99A") : accent, padding: "8px 16px", cursor: currentNum <= 1 ? "default" : "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}
          >
            ← {lang === "en" ? "Prev" : "Anterior"}
          </button>
          <div style={{ flex: 1, margin: "0 16px" }}>
            <div style={{ height: 3, background: dark ? "#3a2a1a" : "#F3EBE0", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: accent, borderRadius: 2, transition: "width .3s" }} />
            </div>
          </div>
          <button
            onClick={() => currentNum < total && loadChapter(currentNum + 1)}
            disabled={currentNum >= total}
            style={{ background: "none", border: `1px solid ${currentNum >= total ? (dark ? "#3a2a1a" : "#F3EBE0") : accent}`, color: currentNum >= total ? (dark ? "#5a4a3a" : "#C9B99A") : accent, padding: "8px 16px", cursor: currentNum >= total ? "default" : "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}
          >
            {lang === "en" ? "Next" : "Siguiente"} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AudioPlayer ──────────────────────────────────────────────────────────────

function AudioPlayer({
  token,
  chapters,
  initialChapter = 1,
}: {
  token: string;
  chapters: ChapterMeta[];
  initialChapter?: number;
}) {
  const lang = useLang();
  const [currentNum, setCurrentNum] = useState(initialChapter);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepPickerOpen, setSleepPickerOpen] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [chapterSearch, setChapterSearch] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentChapter = chapters.find((c) => c.chapter_number === currentNum);
  const title = lang === "en" && currentChapter?.title_en ? currentChapter.title_en : currentChapter?.title_es ?? "";

  const streamUrl = `${API}/${token}/stream/${currentNum}?lang=${lang}`;

  // When chapter changes, reload audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = streamUrl;
    audio.load();
    if (playing) audio.play().catch(() => setPlaying(false));
  }, [currentNum, streamUrl]);

  // Speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Sleep timer
  const activateSleep = (minutes: number) => {
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current);
    setSleepMinutes(minutes);
    if (minutes > 0) {
      sleepTimerRef.current = setTimeout(() => {
        audioRef.current?.pause();
        setPlaying(false);
        setSleepMinutes(0);
      }, minutes * 60 * 1000);
    }
  };

  // Save progress
  const saveProgress = useCallback(async (num: number, pos: number) => {
    try {
      await fetchT(`${API}/${token}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "audio", chapterNumber: num, position: pos }),
      }, 10000);
    } catch (e) {
      console.warn("[library] audio progress save failed:", (e as Error).message);
    }
  }, [token]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    saveProgress(currentNum, 0);
    if (currentNum < chapters.length) {
      setCurrentNum(currentNum + 1);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const skip = (secs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + secs));
    }
  };

  const accent = "#C2506A";
  const fg = "#3D2B1F";
  const bg = "#FBF7F1";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: fg, fontFamily: "Nunito, Arial, sans-serif", display: "flex", flexDirection: "column" }} onContextMenu={(e) => e.preventDefault()}>
      <audio
        ref={audioRef}
        src={streamUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid #F3EBE0`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "Georgia, serif", letterSpacing: ".1em", color: accent, fontWeight: 700, fontSize: 15 }}>CÓDIGOS · AUDIOLIBRO</span>
        <button onClick={() => { setShowChapters(!showChapters); setChapterSearch(""); }} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 13, opacity: 0.7 }}>
          {lang === "it" ? "Capitoli" : lang === "en" ? "Chapters" : "Capítulos"} {showChapters ? "▲" : "▼"}
        </button>
      </div>

      {/* Main player area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px 16px", maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {chapters.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 40, color: "#A89882" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 40, marginBottom: 16, opacity: 0.3 }}>🎧</div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 16, marginBottom: 8, color: "#3D2B1F" }}>
              {lang === "it" ? "Audio in arrivo" : lang === "en" ? "Audio coming soon" : "Audio próximamente"}
            </p>
            <p style={{ fontSize: 13 }}>
              {lang === "it" ? "Il tuo audiolibro apparirà qui quando i capitoli saranno caricati." : lang === "en" ? "Your audiobook will appear here once the chapters are uploaded." : "Tu audiolibro aparecerá aquí cuando se carguen los capítulos."}
            </p>
          </div>
        )}
        {/* Book cover art */}
        {chapters.length > 0 && <img
          src={coverUrl(lang)}
          alt="Códigos que toda mujer debería saber"
          style={{
            width: 180, height: "auto", marginBottom: 32,
            boxShadow: "6px 6px 24px rgba(194,80,106,.3), -3px 2px 0 rgba(139,58,80,0.4)",
            borderRadius: "2px 6px 6px 2px",
            objectFit: "cover",
          }}
        />}

        {/* Chapter info */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: "#A89882", letterSpacing: ".08em", marginBottom: 4 }}>
            {lang === "en" ? "Chapter" : "Capítulo"} {currentNum} / {chapters.length}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: fg, lineHeight: 1.4 }}>{title}</div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", marginBottom: 8 }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#A89882" }}>
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
          <button onClick={() => skip(-15)} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 22, opacity: 0.7 }} title="-15s">⏪</button>
          <button
            onClick={togglePlay}
            style={{ width: 64, height: 64, borderRadius: "50%", background: accent, border: "none", color: "#FBF7F1", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${accent}66` }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => skip(15)} style={{ background: "none", border: "none", color: fg, cursor: "pointer", fontSize: 22, opacity: 0.7 }} title="+15s">⏩</button>
        </div>

        {/* Speed control */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[0.5, 1, 1.5, 2].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} style={{
              padding: "4px 12px", border: `1px solid ${speed === s ? accent : "#E8DDD4"}`,
              background: speed === s ? accent : "transparent", color: speed === s ? "#FBF7F1" : "#7A6652",
              cursor: "pointer", fontSize: 13, fontFamily: "Nunito, sans-serif",
            }}>
              {s}x
            </button>
          ))}
        </div>

        {/* Sleep timer */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setSleepPickerOpen(!sleepPickerOpen)} style={{
            background: "none", border: "none", color: sleepMinutes > 0 ? accent : "#A89882",
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6,
          }}>
            💤 {sleepMinutes > 0 ? `${lang === "en" ? "Sleep in" : "Apagar en"} ${sleepMinutes}min` : lang === "en" ? "Sleep timer" : "Temporizador"}
          </button>
          {sleepPickerOpen && (
            <div style={{ position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,.15)", padding: 12, display: "flex", gap: 8, zIndex: 20 }}>
              {[0, 5, 10, 15, 30, 60].map((m) => (
                <button key={m} onClick={() => { activateSleep(m); setSleepPickerOpen(false); }} style={{
                  padding: "6px 10px", border: `1px solid ${sleepMinutes === m ? accent : "#E8DDD4"}`,
                  background: sleepMinutes === m ? accent : "#FBF7F1", color: sleepMinutes === m ? "#FBF7F1" : fg,
                  cursor: "pointer", fontSize: 12,
                }}>
                  {m === 0 ? (lang === "en" ? "Off" : "Off") : `${m}m`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Prev / Next chapter buttons */}
        <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
          <button onClick={() => currentNum > 1 && setCurrentNum(n => n - 1)} disabled={currentNum <= 1} style={{ padding: "8px 16px", border: `1px solid ${currentNum <= 1 ? "#E8DDD4" : accent}`, background: "none", color: currentNum <= 1 ? "#C9B99A" : accent, cursor: currentNum <= 1 ? "default" : "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>
            ← {lang === "en" ? "Prev" : "Anterior"}
          </button>
          <button onClick={() => currentNum < chapters.length && setCurrentNum(n => n + 1)} disabled={currentNum >= chapters.length} style={{ padding: "8px 16px", border: `1px solid ${currentNum >= chapters.length ? "#E8DDD4" : accent}`, background: "none", color: currentNum >= chapters.length ? "#C9B99A" : accent, cursor: currentNum >= chapters.length ? "default" : "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>
            {lang === "en" ? "Next" : "Siguiente"} →
          </button>
        </div>
      </div>

      {/* Chapter list */}
      {showChapters && (
        <div style={{ borderTop: `1px solid #F3EBE0` }}>
          <div style={{ padding: "12px 20px 8px" }}>
            <input
              type="search"
              placeholder={lang === "en" ? "Search chapters…" : "Buscar capítulo…"}
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 14px", fontSize: 13,
                border: "1px solid #E8DDD4", background: "#fff", color: fg,
                fontFamily: "Nunito, sans-serif", outline: "none", borderRadius: 6,
              }}
            />
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {chapters
              .filter(ch => {
                if (!chapterSearch.trim()) return true;
                const q = chapterSearch.toLowerCase();
                return (ch.title_es?.toLowerCase().includes(q) || ch.title_en?.toLowerCase().includes(q));
              })
              .map((ch) => {
                const isPlaying = ch.chapter_number === currentNum;
                return (
                  <div
                    key={ch.chapter_number}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "12px 20px", borderBottom: `1px solid #F3EBE0`,
                      background: isPlaying ? "#F9EFF5" : bg,
                      borderLeft: isPlaying ? `3px solid ${accent}` : "3px solid transparent",
                    }}
                  >
                    <button
                      onClick={() => { setCurrentNum(ch.chapter_number); setPlaying(true); setChapterSearch(""); setShowChapters(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, flex: 1,
                        background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#A89882", width: 20 }}>{isPlaying ? "▶" : ch.chapter_number}</span>
                      <span style={{ fontSize: 13, color: isPlaying ? accent : fg }}>
                        {lang === "it" ? ((ch as any).title_it || ch.title_en || ch.title_es) : lang === "en" && ch.title_en ? ch.title_en : ch.title_es}
                      </span>
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                      {ch.duration_seconds && (
                        <span style={{ fontSize: 12, color: "#A89882" }}>{fmtTime(ch.duration_seconds)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Error States ─────────────────────────────────────────────────────────────

function LibraryError({ code }: { code: string }) {
  const lang = useLang();
  const messages: Record<string, { es: string; en: string }> = {
    not_found:  { es: "Enlace no encontrado. Verifica que el link sea correcto.", en: "Link not found. Please check your email link." },
    not_paid:   { es: "Tu pago aún no ha sido confirmado.", en: "Your payment has not been confirmed yet." },
    expired:    { es: "Tu acceso ha vencido (30 días). Escríbenos para renovarlo.", en: "Your access has expired (30 days). Contact us to renew." },
    default:    { es: "Ocurrió un error. Intenta de nuevo.", en: "Something went wrong. Please try again." },
  };
  const msg = messages[code] ?? messages.default;
  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F1", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Nunito, Arial, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#C2506A", fontSize: 28, marginBottom: 16 }}>CÓDIGOS</h1>
        <p style={{ color: "#7A6652", lineHeight: 1.7 }}>{lang === "en" ? msg.en : msg.es}</p>
        <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL ?? "hello@codigosdemujeres.com"}`} style={{ display: "inline-block", marginTop: 24, color: "#C2506A", fontSize: 13 }}>
          {lang === "en" ? "Contact support" : "Contactar soporte"}
        </a>
      </div>
    </div>
  );
}

function LibraryLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        {/* Book cover mini */}
        <img
          src="/cover-es.png"
          alt="Códigos"
          style={{
            width: 80, height: "auto", margin: "0 auto 24px", display: "block",
            boxShadow: "4px 4px 20px rgba(194,80,106,0.25), -2px 2px 0 rgba(160,64,96,0.3)",
            borderRadius: "2px 4px 4px 2px",
          }}
        />
        <div style={{ width: 28, height: 28, border: "2px solid #F3EBE0", borderTopColor: "#C2506A", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#A89882", fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: ".2em" }}>CÓDIGOS DE MUJERES</p>
      </div>
    </div>
  );
}

// ─── PWA Install Banner ──────────────────────────────────────────────────────

function InstallBanner({ lang, onInstall, onDismiss }: { lang: Lang; onInstall: () => void; onDismiss: () => void }) {
  const accent = "#C2506A";
  return (
    <div style={{
      background: "#FBF7F1", border: `1px solid #F3EBE0`, padding: "14px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      fontFamily: "Nunito, Arial, sans-serif", boxShadow: "0 2px 12px rgba(0,0,0,.06)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 14, color: "#3D2B1F", fontWeight: 700, marginBottom: 2 }}>
          {lang === "en" ? "Install CODIGOS on your device" : "Instala CODIGOS en tu dispositivo"}
        </div>
        <div style={{ fontSize: 12, color: "#A89882", lineHeight: 1.4 }}>
          {lang === "en" ? "Read offline from your home screen" : "Lee sin conexion desde tu pantalla"}
        </div>
      </div>
      <button onClick={onInstall} style={{
        padding: "8px 16px", background: accent, border: "none", color: "#FBF7F1",
        fontSize: 13, fontFamily: "Nunito, sans-serif", fontWeight: 600, cursor: "pointer",
        whiteSpace: "nowrap", flexShrink: 0,
      }}>
        {lang === "en" ? "Install" : "Instalar"}
      </button>
      <button onClick={onDismiss} style={{
        background: "none", border: "none", color: "#A89882", cursor: "pointer",
        fontSize: 18, padding: 4, flexShrink: 0, lineHeight: 1,
      }} aria-label={lang === "en" ? "Close" : "Cerrar"}>
        ✕
      </button>
    </div>
  );
}

// ─── Main Library page ────────────────────────────────────────────────────────

function isPWA() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true;
}

function AppNav({ lang }: { lang: Lang }) {
  const accent = "#C2506A";
  const items = [
    { icon: "📖", label: lang === "en" ? "Library" : "Biblioteca", action: () => {} },
    { icon: "✍️", label: "Blog",  action: () => { window.location.href = `/blog?lang=${lang}`; } },
    { icon: "💬", label: lang === "en" ? "Support" : "Soporte", action: () => { window.location.href = "mailto:hello@codigosdemujeres.com"; } },
    { icon: "📄", label: lang === "en" ? "Legal" : "Legal", action: () => { window.location.href = lang === "en" ? "/terms" : "/terminos"; } },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "#FBF7F1", borderTop: "1px solid #F3EBE0",
      display: "flex", justifyContent: "space-around",
      padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
    }}>
      {items.map((item, i) => (
        <button key={i} onClick={item.action} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          padding: "4px 12px", color: i === 0 ? accent : "#7A6652",
          fontFamily: "Nunito, sans-serif", fontSize: 10,
        }}>
          <span style={{ fontSize: 18 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default function Library() {
  const { token } = useParams<{ token: string }>();
  const lang = useLang();
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"ebook" | "audio">("ebook");
  const [initialChapter, setInitialChapter] = useState(1);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [pwa] = useState(isPWA);

  // PWA install prompt
  useEffect(() => {
    const dismissed = localStorage.getItem("codigos_pwa_dismissed");
    if (dismissed === "1") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("codigos_pwa_dismissed", "1");
  };

  // Token is kept in URL only — do not persist to localStorage
  // (library token is a permanent credential; localStorage is readable by any XSS on the domain)

  useEffect(() => {
    if (!token) { setError("not_found"); return; }

    (async () => {
      try {
        // Validate token + get chapter list
        const res = await fetchT(`${API}/${token}?lang=${lang}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "default");
          return;
        }
        const data = await res.json();
        // API returns { order: { email, format, allowedFormats }, chapters: [...] }
        const orderInfo: OrderInfo = { ...data.order, chapters: data.chapters ?? [] };
        setOrder(orderInfo);

        // Load saved progress to start at last read chapter
        const progRes = await fetchT(`${API}/${token}/progress`, undefined, 10000);
        if (progRes.ok) {
          const prog = await progRes.json();
          const fmt = orderInfo.format === "bundle" ? "ebook" : orderInfo.format;
          const saved = prog.progress?.find((p: { format: string; chapter_number: number }) => p.format === fmt);
          if (saved?.chapter_number) setInitialChapter(saved.chapter_number);
        }

        // Set default tab for bundle
        if (orderInfo.format === "bundle") setTab("ebook");
      } catch {
        setError("default");
      }
    })();
  }, [token, lang]);

  if (error) return <LibraryError code={error} />;
  if (!order) return <LibraryLoading />;

  const ebookChapters = order.chapters.filter((c) => c.format === "ebook");
  const audioChapters = order.chapters.filter((c) => c.format === "audio");

  const accent = "#C2506A";

  const pwaBanner = showInstallBanner ? <InstallBanner lang={lang} onInstall={handleInstall} onDismiss={dismissInstallBanner} /> : null;

  const bottomPad = pwa ? 64 : 0;

  // Single format
  if (order.format === "ebook") {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", paddingBottom: bottomPad }}>
        {pwaBanner}
        <div style={{ flex: 1, minHeight: 0 }}>
          <WebReader token={token!} chapters={order.chapters} email={order.email} initialChapter={initialChapter} />
        </div>
        {pwa && <AppNav lang={lang} />}
      </div>
    );
  }
  if (order.format === "audio") {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: bottomPad }}>
        {pwaBanner}
        <div style={{ flex: 1 }}>
          <AudioPlayer token={token!} chapters={order.chapters} initialChapter={initialChapter} />
        </div>
        {pwa && <AppNav lang={lang} />}
      </div>
    );
  }

  // Bundle: tabs
  return (
    <div style={{ minHeight: "100vh", background: "#FBF7F1", fontFamily: "Nunito, Arial, sans-serif", paddingBottom: bottomPad }}>
      {pwaBanner}
      {/* Tab switcher */}
      <div style={{ display: "flex", borderBottom: `2px solid #F3EBE0`, background: "#FBF7F1", position: "sticky", top: 0, zIndex: 20 }}>
        <button onClick={() => setTab("ebook")} style={{
          flex: 1, padding: "14px", border: "none", background: "none", cursor: "pointer",
          fontFamily: "Georgia, serif", fontSize: 14, letterSpacing: ".06em",
          color: tab === "ebook" ? accent : "#A89882",
          borderBottom: tab === "ebook" ? `2px solid ${accent}` : "2px solid transparent",
          marginBottom: -2,
        }}>
          {lang === "en" ? "Book" : "Libro"}
        </button>
        <button onClick={() => setTab("audio")} style={{
          flex: 1, padding: "14px", border: "none", background: "none", cursor: "pointer",
          fontFamily: "Georgia, serif", fontSize: 14, letterSpacing: ".06em",
          color: tab === "audio" ? accent : "#A89882",
          borderBottom: tab === "audio" ? `2px solid ${accent}` : "2px solid transparent",
          marginBottom: -2,
        }}>
          Audio
        </button>
      </div>
      {tab === "ebook"
        ? <WebReader token={token!} chapters={ebookChapters.length > 0 ? ebookChapters : order.chapters} email={order.email} initialChapter={initialChapter} />
        : <AudioPlayer token={token!} chapters={audioChapters.length > 0 ? audioChapters : order.chapters} initialChapter={initialChapter} />
      }
      {pwa && <AppNav lang={lang} />}
    </div>
  );
}
