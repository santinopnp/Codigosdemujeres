import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#FBF7F1", surface: "#F3EBE0", border: "#E8DDD4",
  crimson: "#C2506A", dark: "#3D2B1F", muted: "#7A6652", light: "#A89882",
};

function useLang() {
  return (navigator.language || "es").startsWith("en") ? "en" : "es";
}

export default function AppHome() {
  const navigate = useNavigate();
  const lang = useLang();
  const isEs = lang !== "en";

  const [linkInput, setLinkInput] = useState("");
  const [error, setError] = useState("");

  // If a token is saved, go straight to the library
  useEffect(() => {
    const saved = localStorage.getItem("codigos_library_token");
    if (saved) navigate(`/library/${saved}`, { replace: true });
  }, []);

  function extractToken(input: string): string | null {
    const trimmed = input.trim();
    // Accept full URL like https://codigosdemujeres.com/library/TOKEN
    const match = trimmed.match(/\/library\/([a-f0-9-]{36})/i);
    if (match) return match[1];
    // Accept bare UUID
    if (/^[a-f0-9-]{36}$/i.test(trimmed)) return trimmed;
    return null;
  }

  function handleOpen() {
    const token = extractToken(linkInput);
    if (!token) {
      setError(isEs ? "Enlace inválido. Copia el enlace completo de tu correo." : "Invalid link. Paste the full link from your email.");
      return;
    }
    localStorage.setItem("codigos_library_token", token);
    navigate(`/library/${token}`, { replace: true });
  }

  const navItems = [
    { label: isEs ? "Blog" : "Blog",          path: `/blog?lang=${lang}` },
    { label: isEs ? "Soporte" : "Support",    path: `mailto:hello@codigosdemujeres.com` },
    { label: isEs ? "Términos" : "Terms",     path: isEs ? "/terminos" : "/terms" },
    { label: isEs ? "Privacidad" : "Privacy", path: isEs ? "/privacidad" : "/privacy" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", fontFamily: "Nunito, Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "28px 24px 0", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, letterSpacing: ".12em", color: C.crimson }}>
          CÓDIGOS
        </div>
        <p style={{ fontSize: 13, color: C.light, marginTop: 6, letterSpacing: ".04em" }}>
          {isEs ? "Tu biblioteca personal" : "Your personal library"}
        </p>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 24px" }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: C.dark, marginBottom: 8, fontWeight: 700 }}>
              {isEs ? "Accede a tu compra" : "Access your purchase"}
            </p>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
              {isEs
                ? "Pega el enlace de acceso que recibiste en tu correo de confirmación."
                : "Paste the access link from your confirmation email."}
            </p>
            <input
              type="url"
              placeholder={isEs ? "https://codigosdemujeres.com/library/..." : "https://codigosdemujeres.com/library/..."}
              value={linkInput}
              onChange={e => { setLinkInput(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleOpen()}
              style={{
                width: "100%", padding: "12px 14px", fontSize: 13, boxSizing: "border-box",
                border: `2px solid ${error ? C.crimson : C.border}`, borderRadius: 8,
                background: "#fff", color: C.dark, fontFamily: "Nunito, sans-serif",
                outline: "none", marginBottom: error ? 6 : 16,
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: C.crimson, marginBottom: 12 }}>{error}</p>
            )}
            <button
              onClick={handleOpen}
              style={{
                width: "100%", padding: "13px", background: C.crimson, color: "#fff",
                border: "none", borderRadius: 8, fontFamily: "Georgia, serif",
                fontWeight: 700, fontSize: 15, letterSpacing: ".06em", cursor: "pointer",
              }}
            >
              {isEs ? "Abrir mi biblioteca →" : "Open my library →"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: 12, color: C.light, marginTop: 20, lineHeight: 1.6 }}>
            {isEs
              ? "¿No encuentras el correo? Escríbenos a "
              : "Can't find the email? Contact us at "}
            <a href="mailto:hello@codigosdemujeres.com" style={{ color: C.crimson }}>hello@codigosdemujeres.com</a>
          </p>
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{
        borderTop: `1px solid ${C.border}`, background: C.bg,
        display: "flex", justifyContent: "space-around", padding: "12px 0 max(12px, env(safe-area-inset-bottom))",
      }}>
        {navItems.map(item => (
          <button
            key={item.label}
            onClick={() => item.path.startsWith("mailto") ? window.location.href = item.path : navigate(item.path)}
            style={{
              background: "none", border: "none", color: C.muted, fontSize: 12,
              fontFamily: "Nunito, sans-serif", cursor: "pointer", padding: "4px 8px",
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
