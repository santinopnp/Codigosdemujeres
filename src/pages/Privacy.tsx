import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const C = {
  bg: "#FFF1F4", surface: "#F1DCE2", border: "#F1DCE2",
  crimson: "#A12B52", white: "#4E0F22", secondary: "#7A4A58", muted: "#7A4A58",
};

const CONTENT = {
  es: {
    title: "Política de Privacidad",
    updated: "Última actualización: marzo 2026",
    back: "← Inicio",
    sections: [
      {
        h: "1. Información que recopilamos",
        p: "Al realizar una compra, recopilamos tu nombre, correo electrónico y datos de pago procesados por Stripe. No almacenamos datos de tarjetas de crédito en nuestros servidores.",
      },
      {
        h: "2. Uso de la información",
        p: "Usamos tu correo exclusivamente para enviarte el enlace de descarga de tu compra y comunicaciones relacionadas con tu pedido. No vendemos, alquilamos ni compartimos tu información con terceros para fines de marketing.",
      },
      {
        h: "3. Proveedores de pago",
        p: "Los pagos con tarjeta son procesados por Stripe, una plataforma de pagos certificada PCI DSS Nivel 1. Stripe tiene su propia política de privacidad.",
      },
      {
        h: "4. Retención de datos",
        p: "Tu información se conserva mientras sea necesaria para completar tu compra y durante el período de garantía de 7 días. Los registros de transacciones se conservan según los requisitos legales aplicables.",
      },
      {
        h: "5. Tus derechos",
        p: "Tienes derecho a solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento. Para ejercer estos derechos, contáctanos en hello@codigosdemujeres.com.",
      },
      {
        h: "6. Cookies",
        p: "Este sitio no utiliza cookies de seguimiento ni publicidad. Solo usamos almacenamiento de sesión para funcionalidad básica del sitio.",
      },
      {
        h: "7. Contacto",
        p: "Para cualquier consulta sobre privacidad, escríbenos a: hello@codigosdemujeres.com",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 2026",
    back: "← Home",
    sections: [
      {
        h: "1. Information we collect",
        p: "When you make a purchase, we collect your name, email address, and payment data processed by Stripe. We do not store credit card data on our servers.",
      },
      {
        h: "2. Use of information",
        p: "We use your email exclusively to send you your download link and order-related communications. We do not sell, rent, or share your information with third parties for marketing purposes.",
      },
      {
        h: "3. Payment providers",
        p: "Card payments are processed by Stripe, a PCI DSS Level 1 certified payment platform. Stripe has its own privacy policy.",
      },
      {
        h: "4. Data retention",
        p: "Your information is retained as long as necessary to fulfill your purchase and during the 7-day guarantee period. Transaction records are retained as required by applicable law.",
      },
      {
        h: "5. Your rights",
        p: "You have the right to request access, correction, or deletion of your personal data at any time. To exercise these rights, contact us at hello@codigosdemujeres.com.",
      },
      {
        h: "6. Cookies",
        p: "This site does not use tracking or advertising cookies. We only use session storage for basic site functionality.",
      },
      {
        h: "7. Contact",
        p: "For any privacy questions, write to us at: hello@codigosdemujeres.com",
      },
    ],
  },
  it: {
    title: "Informativa sulla Privacy",
    updated: "Ultimo aggiornamento: marzo 2026",
    back: "← Home",
    sections: [
      {
        h: "1. Dati che raccogliamo",
        p: "Quando effettui un acquisto, raccogliamo il tuo nome, l'indirizzo email e i dati di pagamento elaborati da Stripe. Non conserviamo i dati delle carte di credito sui nostri server.",
      },
      {
        h: "2. Utilizzo delle informazioni",
        p: "Utilizziamo la tua email esclusivamente per inviarti il link di download e le comunicazioni relative al tuo ordine. Non vendiamo, affittiamo né condividiamo i tuoi dati con terzi a scopo di marketing.",
      },
      {
        h: "3. Provider di pagamento",
        p: "I pagamenti con carta sono elaborati da Stripe, una piattaforma certificata PCI DSS Livello 1. Stripe dispone di una propria informativa sulla privacy.",
      },
      {
        h: "4. Conservazione dei dati",
        p: "I tuoi dati vengono conservati per il tempo necessario a completare l'acquisto e durante il periodo di garanzia di 7 giorni. I registri delle transazioni vengono conservati secondo i requisiti di legge applicabili.",
      },
      {
        h: "5. I tuoi diritti",
        p: "Hai il diritto di richiedere l'accesso, la rettifica o la cancellazione dei tuoi dati personali in qualsiasi momento. Per esercitare questi diritti, contattaci all'indirizzo hello@codigosdemujeres.com.",
      },
      {
        h: "6. Cookie",
        p: "Questo sito non utilizza cookie di tracciamento o pubblicitari. Utilizziamo solo la memoria di sessione per le funzionalità di base del sito.",
      },
      {
        h: "7. Contatti",
        p: "Per qualsiasi domanda sulla privacy, scrivici a: hello@codigosdemujeres.com",
      },
    ],
  },
};

export default function Privacy() {
  usePageMeta("Privacidad | CÓDIGOS");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = (searchParams.get("lang") as "es" | "en" | "it") ?? "es";
  const [lang, setLang] = useState<"es" | "en" | "it">(initLang === "it" ? "it" : initLang === "en" ? "en" : "es");
  const t = CONTENT[lang];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", backgroundColor: C.bg, borderBottom: `1px solid ${C.surface}` }}>
        <button onClick={() => navigate("/")} style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", color: C.white, background: "none", border: "none", cursor: "pointer" }}>
          Códigos
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ fontSize: 12, color: C.secondary, background: "none", border: "none", cursor: "pointer" }}>{t.back}</button>
          <button onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : "es")} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>
            {lang === "es" ? "EN" : lang === "en" ? "IT" : "ES"}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: "clamp(1.6rem,6vw,2rem)", color: C.white, marginBottom: 8 }}>{t.title}</h1>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 40 }}>{t.updated}</p>

        {t.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.01em", color: C.white, marginBottom: 10 }}>{s.h}</h2>
            <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.8 }}>{s.p}</p>
          </div>
        ))}
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "20px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: C.muted }}>© 2026 Códigos de Mujeres · Dayana Guerrero</p>
        <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Women Coding LLC · <a href="tel:+18175338934" style={{ color: C.muted }}>+1 (817) 533-8934</a></p>
      </footer>
    </div>
  );
}
