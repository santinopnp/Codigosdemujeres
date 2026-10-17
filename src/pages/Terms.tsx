import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const C = {
  bg: "#FBF7F1", surface: "#F3EBE0", border: "#D9C9B0",
  crimson: "#C2506A", white: "#3D2B1F", secondary: "#7A6652", muted: "#A89882",
};

const CONTENT = {
  es: {
    title: "Términos y Condiciones",
    updated: "Última actualización: marzo 2026",
    back: "← Inicio",
    sections: [
      {
        h: "1. Aceptación de los términos",
        p: "Al acceder y utilizar el sitio web codigosdemujeres.com y realizar una compra, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al servicio.",
      },
      {
        h: "2. Descripción del producto",
        p: "Códigos de Mujeres ofrece productos digitales: libro en formato PDF/ePub, audiolibro en formato MP3 y bundles combinados. Los productos son para uso personal y no comercial. Al completar la compra, recibirás un enlace de descarga válido por 30 días en el correo electrónico proporcionado.",
      },
      {
        h: "3. Precios y pagos",
        p: "Todos los precios están expresados en dólares estadounidenses (USD). Los pagos se procesan de forma segura a través de Stripe (tarjeta de crédito/débito). El precio mostrado en el momento de la compra es el precio final.",
      },
      {
        h: "4. Garantía de devolución",
        p: "Ofrecemos una garantía de devolución de 7 días desde la fecha de compra. Si no estás satisfecha con el producto, escríbenos a hello@codigosdemujeres.com dentro de ese período y procesaremos el reembolso completo sin preguntas.",
      },
      {
        h: "5. Propiedad intelectual",
        p: "Todo el contenido de este sitio web y los productos digitales, incluyendo texto, audio, diseño y marca, son propiedad de Dayana Guerrero / Códigos de Mujeres y están protegidos por leyes de derechos de autor. Queda prohibida la reproducción, distribución o comercialización sin autorización expresa por escrito.",
      },
      {
        h: "6. Uso permitido",
        p: "Los productos adquiridos son exclusivamente para uso personal. No está permitido compartir, revender, distribuir o publicar el contenido de los productos digitales en ningún formato o plataforma.",
      },
      {
        h: "7. Limitación de responsabilidad",
        p: "Los productos son de naturaleza educativa y de desarrollo personal. Los resultados individuales pueden variar. Códigos de Mujeres no garantiza resultados específicos. En ningún caso nuestra responsabilidad excederá el valor pagado por el producto.",
      },
      {
        h: "8. Modificaciones",
        p: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigencia al ser publicados en el sitio web. El uso continuado del servicio implica la aceptación de los términos modificados.",
      },
      {
        h: "9. Contacto",
        p: "Para cualquier consulta relacionada con estos términos, contáctanos en: hello@codigosdemujeres.com",
      },
    ],
  },
  en: {
    title: "Terms and Conditions",
    updated: "Last updated: March 2026",
    back: "← Home",
    sections: [
      {
        h: "1. Acceptance of terms",
        p: "By accessing codigosdemujeres.com and making a purchase, you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, you may not access the service.",
      },
      {
        h: "2. Product description",
        p: "Códigos de Mujeres offers digital products: book in PDF/ePub format, audiobook in MP3 format, and combined bundles. Products are for personal, non-commercial use. Upon completing your purchase, you will receive a download link valid for 30 days at the email address provided.",
      },
      {
        h: "3. Pricing and payments",
        p: "All prices are in US dollars (USD). Payments are securely processed through Stripe (credit/debit card). The price shown at the time of purchase is the final price.",
      },
      {
        h: "4. Money-back guarantee",
        p: "We offer a 7-day money-back guarantee from the date of purchase. If you are not satisfied with the product, email us at hello@codigosdemujeres.com within that period and we will process a full refund, no questions asked.",
      },
      {
        h: "5. Intellectual property",
        p: "All content on this website and in the digital products, including text, audio, design and brand, is the property of Dayana Guerrero / Códigos de Mujeres and is protected by copyright law. Reproduction, distribution or commercialization without express written authorization is prohibited.",
      },
      {
        h: "6. Permitted use",
        p: "Purchased products are for personal use only. Sharing, reselling, distributing or publishing the content of digital products in any format or platform is not permitted.",
      },
      {
        h: "7. Limitation of liability",
        p: "Products are educational and personal development in nature. Individual results may vary. Códigos de Mujeres does not guarantee specific results. In no event shall our liability exceed the value paid for the product.",
      },
      {
        h: "8. Modifications",
        p: "We reserve the right to modify these terms at any time. Changes take effect when published on the website. Continued use of the service implies acceptance of the modified terms.",
      },
      {
        h: "9. Contact",
        p: "For any questions related to these terms, contact us at: hello@codigosdemujeres.com",
      },
    ],
  },
  it: {
    title: "Termini e Condizioni",
    updated: "Ultimo aggiornamento: marzo 2026",
    back: "← Home",
    sections: [
      {
        h: "1. Accettazione dei termini",
        p: "Accedendo a codigosdemujeres.com e effettuando un acquisto, accetti di essere vincolata dai presenti Termini e Condizioni. Se non sei d'accordo con una parte di questi termini, non potrai accedere al servizio.",
      },
      {
        h: "2. Descrizione del prodotto",
        p: "Códigos de Mujeres offre prodotti digitali: libro in formato PDF/ePub, audiolibro in formato MP3 e bundle combinati. I prodotti sono destinati all'uso personale e non commerciale. Completando l'acquisto, riceverai un link di download valido 30 giorni all'indirizzo email fornito.",
      },
      {
        h: "3. Prezzi e pagamenti",
        p: "Tutti i prezzi sono espressi in dollari statunitensi (USD). I pagamenti vengono elaborati in modo sicuro tramite Stripe (carta di credito/debito). Il prezzo mostrato al momento dell'acquisto è il prezzo definitivo.",
      },
      {
        h: "4. Garanzia di rimborso",
        p: "Offriamo una garanzia di rimborso di 7 giorni dalla data di acquisto. Se non sei soddisfatta del prodotto, scrivici a hello@codigosdemujeres.com entro quel periodo e elaboreremo il rimborso completo senza fare domande.",
      },
      {
        h: "5. Proprietà intellettuale",
        p: "Tutti i contenuti di questo sito web e dei prodotti digitali, inclusi testo, audio, design e marchio, sono di proprietà di Dayana Guerrero / Códigos de Mujeres e sono protetti dalle leggi sul diritto d'autore. È vietata la riproduzione, distribuzione o commercializzazione senza espressa autorizzazione scritta.",
      },
      {
        h: "6. Uso consentito",
        p: "I prodotti acquistati sono esclusivamente per uso personale. Non è consentito condividere, rivendere, distribuire o pubblicare i contenuti dei prodotti digitali in nessun formato o piattaforma.",
      },
      {
        h: "7. Limitazione di responsabilità",
        p: "I prodotti hanno natura educativa e di sviluppo personale. I risultati individuali possono variare. Códigos de Mujeres non garantisce risultati specifici. In nessun caso la nostra responsabilità supererà il valore pagato per il prodotto.",
      },
      {
        h: "8. Modifiche",
        p: "Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche entrano in vigore con la pubblicazione sul sito web. L'utilizzo continuato del servizio implica l'accettazione dei termini modificati.",
      },
      {
        h: "9. Contatti",
        p: "Per qualsiasi domanda relativa a questi termini, contattaci a: hello@codigosdemujeres.com",
      },
    ],
  },
};

export default function Terms() {
  usePageMeta("Términos | CÓDIGOS");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = (searchParams.get("lang") as "es" | "en" | "it") ?? "es";
  const [lang, setLang] = useState<"es" | "en" | "it">(initLang === "it" ? "it" : initLang === "en" ? "en" : "es");
  const t = CONTENT[lang];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", backgroundColor: C.bg, borderBottom: `1px solid ${C.surface}` }}>
        <button onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", color: C.white, background: "none", border: "none", cursor: "pointer" }}>Códigos</button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ fontSize: 12, color: C.secondary, background: "none", border: "none", cursor: "pointer" }}>{t.back}</button>
          <button onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : "es")} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>{lang === "es" ? "EN" : lang === "en" ? "IT" : "ES"}</button>
        </div>
      </nav>
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: "clamp(1.6rem,6vw,2rem)", color: C.white, marginBottom: 8 }}>{t.title}</h1>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 40 }}>{t.updated}</p>
        {t.sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, letterSpacing: "0.01em", color: C.white, marginBottom: 10 }}>{s.h}</h2>
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
