import React, { useState, useRef, useEffect, useCallback } from "react";

const C = {
  crimson: "#E75480", crimsonHv: "#D44370", burgundy: "#7B1E3A",
  pureWhite: "#FFFFFF", bg: "#FFF7F9", surface: "#F7C6D0",
  white: "#2B2B2B", secondary: "#5A3D4A", muted: "#9A7B8A",
  border: "#F7C6D0", success: "#5A9E6F",
};

type Lang = "es" | "en" | "it";

const I18N: Record<Lang, {
  bubble: string;
  ariaOpen: string;
  online: string;
  greeting: string;
  chips: string[];
  placeholder: string;
  errorConn: string;
  errorGeneric: string;
  escalationText: string;
  whatsappBtn: string;
  whatsappMsg: string;
  ariaClose: string;
  ariaSend: string;
}> = {
  es: {
    bubble: "Ayuda",
    ariaOpen: "Chat con Daya",
    online: "En línea",
    greeting: "Hola! Soy Daya, tu asistente. ¿En qué puedo ayudarte hoy?",
    chips: ["¿De qué trata el libro?", "¿Cómo compro?", "¿Quién es Dayana?"],
    placeholder: "Escribe tu mensaje...",
    errorConn: "Sin conexión. Intenta de nuevo.",
    errorGeneric: "Lo siento, hubo un error.",
    escalationText: "Te conecto con Dayana",
    whatsappBtn: "Abrir WhatsApp",
    whatsappMsg: "Hola Dayana, necesito ayuda con mi pedido de Codigos.",
    ariaClose: "Cerrar chat",
    ariaSend: "Enviar mensaje",
  },
  en: {
    bubble: "Help",
    ariaOpen: "Chat with Daya",
    online: "Online",
    greeting: "Hi! I'm Daya, your assistant. How can I help you today?",
    chips: ["What is the book about?", "How do I buy?", "Who is Dayana?"],
    placeholder: "Type your message...",
    errorConn: "No connection. Please try again.",
    errorGeneric: "Sorry, something went wrong.",
    escalationText: "I'll connect you with Dayana",
    whatsappBtn: "Open WhatsApp",
    whatsappMsg: "Hi Dayana, I need help with my Codigos order.",
    ariaClose: "Close chat",
    ariaSend: "Send message",
  },
  it: {
    bubble: "Aiuto",
    ariaOpen: "Chatta con Daya",
    online: "Online",
    greeting: "Ciao! Sono Daya, la tua assistente. Come posso aiutarti oggi?",
    chips: ["Di cosa parla il libro?", "Come acquisto?", "Chi è Dayana?"],
    placeholder: "Scrivi il tuo messaggio...",
    errorConn: "Nessuna connessione. Riprova.",
    errorGeneric: "Spiacente, si è verificato un errore.",
    escalationText: "Ti metto in contatto con Dayana",
    whatsappBtn: "Apri WhatsApp",
    whatsappMsg: "Ciao Dayana, ho bisogno di aiuto con il mio ordine di Codici.",
    ariaClose: "Chiudi chat",
    ariaSend: "Invia messaggio",
  },
};

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

function getSessionId() {
  let id = sessionStorage.getItem("chat_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("chat_session_id", id);
  }
  return id;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Simple markdown-like rendering: **bold**, line breaks, paragraphs */
function renderFormatted(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return paragraphs.map((para, pi) => {
    const lines = para.split(/\n/);
    const content = lines.map((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
      return (
        <React.Fragment key={li}>
          {li > 0 && <br />}
          {rendered}
        </React.Fragment>
      );
    });

    return (
      <span key={pi} style={{ display: "block", marginTop: pi > 0 ? 8 : 0 }}>
        {content}
      </span>
    );
  });
}

function notifyNewMessage() {
  try {
    if (navigator.vibrate) navigator.vibrate(80);
  } catch { /* not supported */ }
}

/* ------------------------------------------------------------------ */
/*  ChatWidget                                                         */
/* ------------------------------------------------------------------ */

interface ChatWidgetProps {
  whatsappPhone?: string;
  enableVibration?: boolean;
  lang?: Lang;
}

export default function ChatWidget({
  whatsappPhone = "573000000000",
  enableVibration = true,
  lang = "es",
}: ChatWidgetProps) {
  const t = I18N[lang] ?? I18N.es;

  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [convId, setConvId]       = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [visible, setVisible]     = useState(false);

  const scrollRef      = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const prevMsgCount   = useRef(0);
  const greetedLang    = useRef<Lang | null>(null);

  useEffect(() => {
    if (scrollRef.current && messages.length > 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setVisible(true);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          if (scrollRef.current && messages.length <= 1) {
            scrollRef.current.scrollTop = 0;
          }
        });
      });
    }
  }, [open]);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && enableVibration) {
        notifyNewMessage();
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, enableVibration]);

  /* Reset greeting when language changes or on first open */
  useEffect(() => {
    if (open && (messages.length === 0 || greetedLang.current !== lang)) {
      greetedLang.current = lang;
      setMessages([{
        role: "assistant",
        content: t.greeting,
        timestamp: Date.now(),
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => setOpen(false), 280);
  }, []);

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text, timestamp: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          message: text,
          conversationId: convId,
          lang,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConvId(data.conversationId);
      if (data.escalated) setEscalated(true);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.reply || t.errorGeneric, timestamp: Date.now() },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: t.errorConn, timestamp: Date.now() },
      ]);
    }
    setLoading(false);
  }

  function openWhatsApp() {
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(t.whatsappMsg)}`, "_blank", "noopener");
  }

  /* ---------------------------------------------------------------- */
  /*  Bubble button (closed state)                                     */
  /* ---------------------------------------------------------------- */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t.ariaOpen}
        style={{
          position: "fixed", bottom: 86, right: 16, zIndex: 45,
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px 10px 12px",
          borderRadius: 28,
          backgroundColor: "#1B8A9E", border: "none", cursor: "pointer",
          boxShadow: "0 4px 16px rgba(27,138,158,0.35)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,138,158,0.45)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(27,138,158,0.35)";
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={C.pureWhite}>
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
          <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.pureWhite, fontFamily: "'Nunito', sans-serif", letterSpacing: "0.02em" }}>{t.bubble}</span>
        <span style={{
          position: "absolute", top: -2, right: -2,
          width: 12, height: 12, borderRadius: "50%",
          backgroundColor: C.success, border: `2px solid ${C.pureWhite}`,
        }} />
      </button>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Chat panel (open state)                                          */
  /* ---------------------------------------------------------------- */
  return (
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes chatPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .chat-panel-enter {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .chat-panel-exit {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        @media (max-width: 639px) {
          .chat-panel-root {
            bottom: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100vh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div
        className={`chat-panel-root ${visible ? "chat-panel-enter" : "chat-panel-exit"}`}
        style={{
          position: "fixed", bottom: 20, right: 16, zIndex: 50,
          width: 380, maxWidth: "calc(100vw - 32px)",
          height: 540, maxHeight: "calc(100vh - 100px)",
          borderRadius: 16, overflow: "hidden",
          backgroundColor: C.pureWhite,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 16px",
          background: `linear-gradient(135deg, ${C.burgundy}, ${C.crimson})`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/daya.jpg"
              alt="Daya"
              style={{
                width: 38, height: 38, borderRadius: "50%",
                objectFit: "cover", objectPosition: "center top",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
            />
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 15, fontWeight: 700, color: C.pureWhite, margin: 0 }}>Daya</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  backgroundColor: "#4ADE80", display: "inline-block",
                  animation: "chatPulse 2s ease-in-out infinite",
                }} />
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", margin: 0 }}>{t.online}</p>
              </div>
            </div>
          </div>
          <button onClick={handleClose} aria-label={t.ariaClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.8)", fontSize: 22, padding: 6,
            borderRadius: 8, transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: "auto", padding: "16px 12px",
          display: "flex", flexDirection: "column", gap: 6,
          justifyContent: "flex-start",
          backgroundColor: C.bg,
        }}>
          {/* Quick chips */}
          {messages.length <= 1 && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", padding: "12px 0 4px" }}>
              {t.chips.map((q, i) => (
                <button key={i} onClick={() => send(q)} style={{
                  padding: "8px 14px", fontSize: 12, fontWeight: 600,
                  color: C.crimson, backgroundColor: C.pureWhite,
                  border: `1px solid ${C.border}`, borderRadius: 20,
                  cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                  transition: "all 0.15s", whiteSpace: "nowrap",
                }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.crimson; e.currentTarget.style.color = C.pureWhite; e.currentTarget.style.borderColor = C.crimson; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.pureWhite; e.currentTarget.style.color = C.crimson; e.currentTarget.style.borderColor = C.border; }}
                >{q}</button>
              ))}
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const showTime = !prevMsg || msg.timestamp - prevMsg.timestamp > 180_000 || msg.role !== prevMsg.role;

            return (
              <React.Fragment key={i}>
                {showTime && i > 0 && (
                  <p style={{ textAlign: "center", fontSize: 10, color: C.muted, margin: "8px 0 4px", userSelect: "none" }}>
                    {formatTime(msg.timestamp)}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", animation: "fadeSlide 0.2s ease" }}>
                  <div style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    backgroundColor: isUser ? C.crimson : C.pureWhite,
                    color: isUser ? C.pureWhite : C.white,
                    fontSize: 14, lineHeight: 1.5,
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: !isUser ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    wordBreak: "break-word",
                  }}>
                    {isUser ? msg.content : renderFormatted(msg.content)}
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "12px 20px", borderRadius: "16px 16px 16px 4px",
                backgroundColor: C.pureWhite, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: "50%",
                      backgroundColor: C.crimson, opacity: 0.5,
                      animation: `chatBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Escalation card */}
          {escalated && (
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              backgroundColor: C.surface, textAlign: "center", margin: "8px 0",
            }}>
              <p style={{ fontSize: 13, color: C.secondary, marginBottom: 10 }}>
                {t.escalationText}
              </p>
              <button onClick={openWhatsApp} style={{
                padding: "10px 24px", fontSize: 13,
                backgroundColor: "#25D366", color: C.pureWhite,
                fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                transition: "background-color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#1EBE5A"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#25D366"}
              >
                {t.whatsappBtn}
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: "10px 12px",
          borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 8, alignItems: "center",
          backgroundColor: C.pureWhite, flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={t.placeholder}
            disabled={escalated}
            style={{
              flex: 1, padding: "10px 14px",
              border: `1px solid ${C.border}`, borderRadius: 24,
              fontSize: 14, outline: "none",
              fontFamily: "'Nunito', sans-serif",
              backgroundColor: C.bg,
              transition: "border-color 0.15s",
            }}
            onFocus={e => e.currentTarget.style.borderColor = C.crimson}
            onBlur={e => e.currentTarget.style.borderColor = C.border}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || escalated}
            aria-label={t.ariaSend}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              backgroundColor: input.trim() ? C.crimson : C.muted,
              border: "none", cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background-color 0.2s, transform 0.15s",
              transform: input.trim() ? "scale(1)" : "scale(0.95)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={C.pureWhite}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        <style>{`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </>
  );
}
