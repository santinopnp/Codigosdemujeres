import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const C = {
  bg: "#FFF1F4", surface: "#F1DCE2", border: "#F1DCE2",
  crimson: "#A12B52", white: "#4E0F22", secondary: "#7A4A58", muted: "#7A4A58",
  success: "#5A9E6F",
};

const CONTENT = {
  es: {
    title: "Política de Reembolso",
    subtitle: "Garantía de devolución 7 días — sin preguntas",
    updated: "Última actualización: marzo 2026",
    back: "← Inicio",
    promise_title: "Nuestra promesa",
    promise: "Si por cualquier motivo no estás satisfecha con tu compra, te devolvemos el 100% de tu dinero dentro de los 7 días posteriores a la compra. Sin formularios, sin preguntas, sin demoras.",
    how_title: "Cómo solicitar tu reembolso",
    steps: [
      "Escríbenos a hello@codigosdemujeres.com desde el correo con el que realizaste la compra.",
      "Incluye el asunto: \"Solicitud de reembolso\".",
      "Procesamos tu reembolso en un plazo de 3 a 5 días hábiles.",
    ],
    conditions_title: "Condiciones",
    conditions: [
      "La solicitud debe realizarse dentro de los 7 días naturales desde la fecha de compra.",
      "Aplicable a todas las modalidades: Libro, Audiolibro y Bundle.",
      "El reembolso se procesa al método de pago original.",
      "Los reembolsos de pagos con tarjeta pueden tardar 3–7 días hábiles según tu banco.",
      "Los reembolsos de pagos en cripto se procesan en USDT a la wallet de origen.",
    ],
    contact_title: "¿Tienes dudas antes de comprar?",
    contact: "Escríbenos por WhatsApp o correo y con gusto te ayudamos.",
    contact_btn: "Contactar por WhatsApp",
    buy_btn: "Ver el libro",
  },
  en: {
    title: "Refund Policy",
    subtitle: "7-day money-back guarantee — no questions asked",
    updated: "Last updated: March 2026",
    back: "← Home",
    promise_title: "Our promise",
    promise: "If for any reason you are not satisfied with your purchase, we will refund 100% of your money within 7 days of purchase. No forms, no questions, no delays.",
    how_title: "How to request a refund",
    steps: [
      "Email us at hello@codigosdemujeres.com from the email you used to make your purchase.",
      "Include the subject line: \"Refund request\".",
      "We process your refund within 3 to 5 business days.",
    ],
    conditions_title: "Conditions",
    conditions: [
      "The request must be made within 7 calendar days from the date of purchase.",
      "Applicable to all formats: Book, Audiobook and Bundle.",
      "Refunds are processed to the original payment method.",
      "Card payment refunds may take 3–7 business days depending on your bank.",
      "Crypto payment refunds are processed in USDT to the originating wallet.",
    ],
    contact_title: "Questions before buying?",
    contact: "Write to us via WhatsApp or email and we'll be happy to help.",
    contact_btn: "Contact via WhatsApp",
    buy_btn: "See the book",
  },
  it: {
    title: "Politica di Rimborso",
    subtitle: "Garanzia soddisfatti o rimborsati — 7 giorni senza domande",
    updated: "Ultimo aggiornamento: marzo 2026",
    back: "← Home",
    promise_title: "La nostra promessa",
    promise: "Se per qualsiasi motivo non sei soddisfatta del tuo acquisto, ti rimborsiamo il 100% del denaro entro 7 giorni dall'acquisto. Nessun modulo, nessuna domanda, nessun ritardo.",
    how_title: "Come richiedere il rimborso",
    steps: [
      "Scrivici a hello@codigosdemujeres.com dall'indirizzo email con cui hai effettuato l'acquisto.",
      "Includi come oggetto: \"Richiesta di rimborso\".",
      "Elaboriamo il tuo rimborso entro 3–5 giorni lavorativi.",
    ],
    conditions_title: "Condizioni",
    conditions: [
      "La richiesta deve essere effettuata entro 7 giorni di calendario dalla data di acquisto.",
      "Applicabile a tutti i formati: E-book, Audiolibro e Bundle.",
      "Il rimborso viene elaborato con il metodo di pagamento originale.",
      "I rimborsi per pagamenti con carta possono richiedere 3–7 giorni lavorativi a seconda della tua banca.",
      "I rimborsi per pagamenti in criptovaluta vengono elaborati in USDT al wallet di origine.",
    ],
    contact_title: "Hai dubbi prima di acquistare?",
    contact: "Scrivici via WhatsApp o email e saremo felici di aiutarti.",
    contact_btn: "Contattaci su WhatsApp",
    buy_btn: "Vedi il libro",
  },
};

export default function Refund() {
  usePageMeta("Reembolso | CÓDIGOS");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = searchParams.get("lang");
  const [lang, setLang] = useState<"es" | "en" | "it">(
    initLang === "it" ? "it" : initLang === "en" ? "en" : "es"
  );
  const t = CONTENT[lang];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", backgroundColor: C.bg, borderBottom: `1px solid ${C.surface}` }}>
        <button onClick={() => navigate("/")} style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", color: C.white, background: "none", border: "none", cursor: "pointer" }}>Códigos</button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ fontSize: 12, color: C.secondary, background: "none", border: "none", cursor: "pointer" }}>{t.back}</button>
          <button onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : "es")} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>{lang === "es" ? "EN" : lang === "en" ? "IT" : "ES"}</button>
        </div>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: "clamp(1.6rem,6vw,2rem)", color: C.white, marginBottom: 6 }}>{t.title}</h1>
        <p style={{ fontSize: 14, color: C.crimson, fontStyle: "italic", marginBottom: 8 }}>{t.subtitle}</p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 40 }}>{t.updated}</p>

        {/* Promise block */}
        <div style={{ backgroundColor: C.surface, borderLeft: `4px solid ${C.success}`, padding: "20px 24px", marginBottom: 40 }}>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: "0.06em", marginBottom: 10 }}>{t.promise_title}</p>
          <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.8 }}>{t.promise}</p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.06em", color: C.white, marginBottom: 16 }}>{t.how_title}</h2>
          {t.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
              <span style={{ width: 28, height: 28, backgroundColor: C.crimson, color: C.white, fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
              <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7, paddingTop: 4 }}>{step}</p>
            </div>
          ))}
        </div>

        {/* Conditions */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.06em", color: C.white, marginBottom: 16 }}>{t.conditions_title}</h2>
          {t.conditions.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
              <span style={{ color: C.success, fontSize: 14, flexShrink: 0, marginTop: 2 }}>✓</span>
              <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{c}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ backgroundColor: C.surface, padding: "24px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.white, letterSpacing: "0.06em", marginBottom: 8 }}>{t.contact_title}</p>
          <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20 }}>{t.contact}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://wa.me/1234567890" target="_blank" rel="noopener" className="btn-primary" style={{ maxWidth: 220, textDecoration: "none" }}>
              {t.contact_btn}
            </a>
            <button onClick={() => navigate("/")} className="btn-outline" style={{ maxWidth: 180 }}>
              {t.buy_btn}
            </button>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.muted }}>© 2026 Códigos de Mujeres · Dayana Guerrero</p>
      </footer>
    </div>
  );
}
