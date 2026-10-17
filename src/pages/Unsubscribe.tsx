import React, { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";

const C = {
  bg:     "#FFF1F4",
  cherry: "#A12B52",
  dark:   "#4E0F22",
  muted:  "#7A4A58",
  border: "#F1DCE2",
  gold:   "#C9A86A",
};

function detectLang(): "es" | "en" | "it" {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("lang") === "it") return "it";
    if (params.get("lang") === "en") return "en";
    if (navigator.language?.startsWith("it")) return "it";
    if (navigator.language?.startsWith("en")) return "en";
  } catch { /* noop */ }
  return "es";
}

export default function Unsubscribe() {
  const [success, setSuccess] = useState(false);
  const [email, setEmail]     = useState("");
  const lang = detectLang();
  const isIt = lang === "it";
  const isEs = lang === "es";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") setSuccess(true);
    if (params.get("email")) setEmail(decodeURIComponent(params.get("email")!));
  }, []);

  return (
    <>
      <SEOHead
        title={isIt ? "Cancella iscrizione · CÓDIGOS de Mujeres" : isEs ? "Cancelar suscripción · CÓDIGOS de Mujeres" : "Unsubscribe · CÓDIGOS de Mujeres"}
        description={isIt ? "Gestisci la tua iscrizione alla newsletter di Dayana Guerrero." : isEs ? "Gestiona tu suscripción al newsletter de Dayana Guerrero." : "Manage your newsletter subscription from Dayana Guerrero."}
      />
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 11, letterSpacing: ".25em", textTransform: "uppercase", color: C.cherry, margin: "0 0 4px" }}>
            Dayana Guerrero
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.dark, margin: 0, letterSpacing: ".05em" }}>
            CÓDIGOS de Mujeres
          </h1>
        </div>

        {/* Card */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          maxWidth: 480,
          width: "100%",
          padding: "40px 36px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(78,15,34,0.06)",
        }}>
          {success ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 20 }}>💌</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, color: C.dark, margin: "0 0 16px" }}>
                {isIt ? "Iscrizione annullata." : isEs ? "Has cancelado tu suscripción." : "You've been unsubscribed."}
              </h2>
              {email && (
                <p style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, margin: "0 0 16px" }}>
                  {isIt
                    ? <>Non riceverai più email da Dayana a <strong style={{ color: C.dark }}>{email}</strong>.</>
                    : isEs
                      ? <>Ya no recibirás correos de Dayana en <strong style={{ color: C.dark }}>{email}</strong>.</>
                      : <>You'll no longer receive emails from Dayana at <strong style={{ color: C.dark }}>{email}</strong>.</>
                  }
                </p>
              )}
              <div style={{ height: 1, background: C.border, margin: "24px 0" }} />
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: C.muted, lineHeight: 1.8, margin: "0 0 24px" }}>
                {isIt
                  ? "\"Se un giorno vorrai tornare, sarò qui. Prenditi cura di te.\""
                  : isEs
                    ? "\"Si algún día quieres regresar, aquí estaré. Cuídate mucho.\""
                    : "\"If you ever want to come back, I'll be here. Take good care of yourself.\""
                }
              </p>
              <p style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: C.gold, margin: "0 0 28px" }}>
                — Dayana Guerrero
              </p>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  fontFamily: "Georgia, serif",
                  fontSize: 13,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: C.cherry,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.cherry}`,
                  paddingBottom: 2,
                }}
              >
                {isIt ? "Torna alla home" : isEs ? "Volver al inicio" : "Back to home"}
              </a>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40, marginBottom: 20 }}>🔗</div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 20, color: C.dark, margin: "0 0 12px" }}>
                {isIt ? "Link non valido" : isEs ? "Enlace inválido" : "Invalid link"}
              </h2>
              <p style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 14, color: C.muted, lineHeight: 1.7, margin: "0 0 24px" }}>
                {isIt
                  ? "Il link per cancellare l'iscrizione non è valido o è scaduto. Usa il link nell'email che hai ricevuto."
                  : isEs
                    ? "El enlace para cancelar tu suscripción no es válido o ya expiró. Por favor usa el enlace del correo que recibiste."
                    : "The unsubscribe link is invalid or has expired. Please use the link from the email you received."
                }
              </p>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  fontFamily: "Georgia, serif",
                  fontSize: 13,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: C.cherry,
                  textDecoration: "none",
                  borderBottom: `1px solid ${C.cherry}`,
                  paddingBottom: 2,
                }}
              >
                {isIt ? "Torna alla home" : isEs ? "Volver al inicio" : "Back to home"}
              </a>
            </>
          )}
        </div>

        <p style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 11, color: C.gold, marginTop: 32, letterSpacing: ".05em" }}>
          © {new Date().getFullYear()} Códigos de Mujeres · codigosdemujeres.com
        </p>
      </div>
    </>
  );
}
