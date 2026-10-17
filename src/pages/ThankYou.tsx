import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/components/FacebookPixel";
import { site } from "@/config/site";

const FORMAT_PRICES: Record<string, number> = {
  ebook:  site.product.formats.ebook.price,
  audio:  site.product.formats.audio.price,
  bundle: site.product.formats.bundle.price,
};

const C = {
  bg: "#FBF7F1", surface: "#F3EBE0", border: "#D9C9B0",
  crimson: "#C2506A", white: "#3D2B1F", secondary: "#7A6652", muted: "#A89882",
  success: "#5A9E6F", pureWhite: "#FFFFFF",
};

const bundlePrice = `$${site.product.formats.bundle.price.toFixed(2)}`;

const T = {
  es: {
    title:        "¡Compra exitosa!",
    body:         "Revisa tu correo. Te enviamos el enlace de descarga en los próximos minutos.",
    access:       "Acceso de por vida — tu enlace nunca expira.",
    upsell_title: "¿Quieres el paquete completo?",
    upsell_body:  (label: string, price: string) => `Obtén el ${label} por solo ${price}.`,
    upsell_btn:   "Obtener Bundle →",
    share_title:  "Cuéntale a tus amigas",
    share_text:   "Acabo de leer Códigos de Dayana Guerrero. ¡Lo recomiendo! → codigosdemujeres.com",
    app_title:    "📱 Instala la app",
    app_body:     "Accede a tu biblioteca desde el ícono en tu pantalla de inicio.",
    app_hint:     "Safari / Chrome → Compartir → Agregar a pantalla de inicio",
    view_order:   "Ver estado del pedido",
    home:         "Volver al inicio",
  },
  en: {
    title:        "Purchase successful!",
    body:         "Check your inbox. We're sending your download link in the next few minutes.",
    access:       "Lifetime access — your link never expires.",
    upsell_title: "Want the complete bundle?",
    upsell_body:  (label: string, price: string) => `Get the ${label} for only ${price}.`,
    upsell_btn:   "Get Bundle →",
    share_title:  "Tell your friends",
    share_text:   "I just read Códigos by Dayana Guerrero. Highly recommend! → codigosdemujeres.com",
    app_title:    "📱 Install the app",
    app_body:     "Access your library from the icon on your home screen.",
    app_hint:     "Safari / Chrome → Share → Add to Home Screen",
    view_order:   "View order status",
    home:         "Back to home",
  },
  it: {
    title:        "Acquisto completato!",
    body:         "Controlla la tua email. Ti stiamo inviando il link di accesso nei prossimi minuti.",
    access:       "Accesso a vita — il tuo link non scade mai.",
    upsell_title: "Vuoi il pacchetto completo?",
    upsell_body:  (label: string, price: string) => `Ottieni il ${label} per soli ${price}.`,
    upsell_btn:   "Ottieni il Bundle →",
    share_title:  "Raccontalo alle tue amiche",
    share_text:   "Ho appena letto I Codici di Dayana Guerrero. Lo consiglio! → codigosdemujeres.com",
    app_title:    "📱 Installa l'app",
    app_body:     "Accedi alla tua biblioteca dall'icona nella schermata iniziale.",
    app_hint:     "Safari / Chrome → Condividi → Aggiungi alla schermata Home",
    view_order:   "Vedi stato dell'ordine",
    home:         "Torna alla home",
  },
} as const;

type Lang = keyof typeof T;

type OrderData = {
  status: string;
  format: string;
  paid_at: string | null;
};

export default function ThankYou() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const purchaseTracked = useRef(false);

  const initLang = searchParams.get("lang");
  const lang: Lang = initLang === "it" ? "it" : initLang === "en" ? "en" : "es";
  const t = T[lang];

  const UPSELL: Record<string, { format: string; label: string; price: string }> = {
    ebook: { format: "bundle", label: lang === "it" ? "Bundle (Libro + Audiolibro)" : "Bundle (Libro + Audio)", price: bundlePrice },
    audio: { format: "bundle", label: lang === "it" ? "Bundle (Libro + Audiolibro)" : "Bundle (Libro + Audio)", price: bundlePrice },
  };

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/store/order/${orderId}/status`)
      .then(r => r.json())
      .then(d => {
        setOrder(d);
        if (!purchaseTracked.current && d.status === "paid") {
          purchaseTracked.current = true;
          const value = FORMAT_PRICES[d.format] ?? 14.95;
          trackEvent("Purchase", {
            currency: "USD",
            value,
            content_ids: [`codigos-${d.format}`],
            content_type: "product",
            content_name: "Códigos que toda mujer necesita saber",
            num_items: 1,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ text: t.share_text }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(t.share_text)}`, "_blank", "noopener");
    }
  }

  const upsell = order?.format ? UPSELL[order.format] : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 20px", borderBottom: `1px solid ${C.surface}` }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 18, letterSpacing: "0.1em", color: C.crimson }}>Códigos</span>
      </nav>

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 80px", textAlign: "center" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #D9C9B0", borderTopColor: C.crimson, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        ) : (
          <>
            {/* Success icon */}
            <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", backgroundColor: C.surface, border: `2px solid ${C.success}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 700, color: C.white, marginBottom: 12 }}>
              {t.title}
            </h1>
            <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.6, marginBottom: 8 }}>
              {t.body}
            </p>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 36 }}>
              {t.access}
            </p>

            {/* Upsell */}
            {upsell && (
              <div style={{
                backgroundColor: C.surface, padding: 24, marginBottom: 28,
                borderLeft: `3px solid ${C.crimson}`, textAlign: "left",
              }}>
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 8 }}>
                  {t.upsell_title}
                </p>
                <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.6, marginBottom: 16 }}>
                  {t.upsell_body(upsell.label, upsell.price)}
                </p>
                <button
                  onClick={() => navigate(`/checkout?format=${upsell.format}&lang=${lang}`)}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: C.crimson, color: C.pureWhite,
                    fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
                    border: "none", borderRadius: 8, cursor: "pointer",
                  }}
                >
                  {t.upsell_btn}
                </button>
              </div>
            )}

            {/* Share */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 12 }}>{t.share_title}</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={handleShare} style={{
                  padding: "10px 20px", fontSize: 13,
                  backgroundColor: "#25D366", color: C.pureWhite,
                  fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                }}>
                  WhatsApp
                </button>
                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://codigosdemujeres.com")}`, "_blank", "noopener")} style={{
                  padding: "10px 20px", fontSize: 13,
                  backgroundColor: "#1877F2", color: C.pureWhite,
                  fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                }}>
                  Facebook
                </button>
              </div>
            </div>

            {/* Install app */}
            <div style={{
              background: "#F9EFF5", border: "1px solid #F0D8E0",
              borderRadius: 10, padding: "18px 20px", marginBottom: 20, textAlign: "center",
            }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6 }}>
                {t.app_title}
              </p>
              <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.6, marginBottom: 10 }}>
                {t.app_body}
              </p>
              <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                {t.app_hint}
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orderId && (
                <button onClick={() => navigate(`/order/${orderId}`)} className="btn-outline">
                  {t.view_order}
                </button>
              )}
              <button onClick={() => navigate("/")} className="btn-primary">
                {t.home}
              </button>
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
