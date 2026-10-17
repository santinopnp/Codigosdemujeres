import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatWidget from "@/components/ChatWidget";
import SEOHead from "@/components/SEOHead";
import { trackEvent } from "@/components/FacebookPixel";
import { colors as C, site, formatPrice } from "@/config/site";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  es: {
    nav_brand: "CÓDIGOS", nav_sub: "Empoderamiento Femenino",
    lang_toggle: "EN", nav_buy: "Comprar",
    footer_products: "Productos", footer_blog: "Blog", footer_priv: "Privacidad", footer_terms: "Términos", footer_refund: "Reembolsos",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    // Hero — intrigue, not sell
    hero_eyebrow: "EL LIBRO QUE ESTÁ TRANSFORMANDO MUJERES",
    hero_title: "Códigos que toda\nmujer necesita saber",
    hero_author: "por Dayana Guerrero",
    hero_hook: "15 capítulos. Una transformación completa. El manual que nadie te dio sobre ser mujer.",
    hero_stars: "★★★★★",
    hero_readers: "+2,400 lectoras",
    hero_scroll: "Descubre más ↓",

    // Pain section
    pain_title: "¿TE SUENA FAMILIAR?",
    pain_items: [
      "Sientes que das todo y no recibes lo mismo",
      "Dices «sí» cuando quieres decir «no»",
      "Te comparas constantemente con otras mujeres",
      "Tu voz interior te dice que no eres suficiente",
      "Has perdido la conexión contigo misma",
    ],
    pain_close: "No es tu culpa. Nadie te enseñó los códigos.",

    // Solution section
    solution_title: "ESTE LIBRO TE DA LOS CÓDIGOS",
    solution_items: [
      { title: "Tu poder femenino", desc: "Reconecta con tu esencia — esa fuerza magnética que no necesita ser forzada, solo recordada." },
      { title: "Mente y autoestima", desc: "Construye una confianza que no depende de nadie. Cambia tu diálogo interno para siempre." },
      { title: "Presencia magnética", desc: "Tu imagen, tu voz y tu energía comunican antes que tus palabras. Aprende a usarlas." },
      { title: "Liderazgo y propósito", desc: "Lidera tu vida con elegancia: límites firmes, presencia intencional, paz interior." },
    ],

    // Peek inside
    peek_title: "MIRA DENTRO DEL LIBRO",
    peek_desc: "El Capítulo 1 es gratis. Sin compromiso, sin tarjeta.",
    peek_cta: "Leer capítulo gratis →",
    peek_chapters: "15 capítulos",
    peek_pages: "Español e inglés",
    peek_audio: "Audiolibro incluido",

    // Testimonials
    test_title: "LO QUE DICEN NUESTRAS LECTORAS",

    // Author
    author_eyebrow: "SOBRE LA AUTORA",
    author_name: site.author.name,
    author_bio: "Escritora, coach y emprendedora con más de cuatro años acompañando a mujeres a descubrir su valor, sanar sus relaciones y vivir con propósito. Este libro nació de su propia transformación — y de la de miles de mujeres que la acompañan.",

    // The offer
    offer_title: "ELIGE TU EXPERIENCIA",
    offer_subtitle: "Acceso inmediato. Lee en tu celular, tablet o Kindle.",
    format_ebook: "E-book",
    format_audio: "Audiolibro",
    format_bundle: "Bundle",
    format_desc_ebook: "15 capítulos en PDF + ePub.\nLee en cualquier dispositivo.",
    format_desc_audio: "15 capítulos narrados.\nEscucha donde quieras.",
    format_desc_bundle: "E-book + Audiolibro.\nLa experiencia completa.",
    best_option: "MÁS POPULAR",
    save_label: "Ahorra",
    buy_cta: "Comprar ahora",

    // Guarantee
    guarantee_title: "GARANTÍA DE 7 DÍAS",
    guarantee_desc: "Si no te encanta, te devolvemos el 100% de tu dinero. Sin preguntas. Escríbenos a hello@codigosdemujeres.com.",

    // Trust
    trust_stripe: "Pago seguro y encriptado",
    trust_instant: "Acceso inmediato",
    trust_refund: "Garantía 7 días",

    // Lead capture
    lead_title: "¿Todavía no estás segura?",
    lead_desc: "Te enviamos el primer capítulo gratis. Sin tarjeta.",
    lead_btn: "Quiero mi capítulo gratis",
    lead_success: "¡Listo! Revisa tu correo en los próximos minutos.",
    lead_ph: "tu@correo.com",
    lead_name_ph: "Tu nombre",
    lead_phone_ph: "+57 300 000 0000 (opcional)",

    // Final
    final_title: "Tu transformación empieza hoy",
    final_desc: "Cada día que pasa sin conocer tus códigos es un día que vives por debajo de tu potencial.",
    final_cta: "Quiero mis códigos →",
    banner: "🎉 Oferta de lanzamiento — 40% de descuento por tiempo limitado",
  },
  en: {
    nav_brand: "CÓDIGOS", nav_sub: "Female Empowerment",
    lang_toggle: "IT", nav_buy: "Buy",
    footer_products: "Products", footer_blog: "Blog", footer_priv: "Privacy", footer_terms: "Terms", footer_refund: "Refunds",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    hero_eyebrow: "THE BOOK THAT'S TRANSFORMING WOMEN",
    hero_title: "Codes that every\nwoman needs to know",
    hero_author: "by Dayana Guerrero",
    hero_hook: "15 chapters. A complete transformation. The manual nobody gave you about being a woman.",
    hero_stars: "★★★★★",
    hero_readers: "+2,400 readers",
    hero_scroll: "Discover more ↓",

    pain_title: "DOES THIS SOUND FAMILIAR?",
    pain_items: [
      "You give everything and don't get the same in return",
      "You say 'yes' when you want to say 'no'",
      "You constantly compare yourself to other women",
      "Your inner voice tells you you're not enough",
      "You've lost the connection with yourself",
    ],
    pain_close: "It's not your fault. Nobody taught you the codes.",

    solution_title: "THIS BOOK GIVES YOU THE CODES",
    solution_items: [
      { title: "Your feminine power", desc: "Reconnect with your essence — that magnetic force that doesn't need to be forced, only remembered." },
      { title: "Mind and self-esteem", desc: "Build confidence that doesn't depend on anyone. Change your inner dialogue forever." },
      { title: "Magnetic presence", desc: "Your image, voice, and energy communicate before your words do. Learn to use them." },
      { title: "Leadership and purpose", desc: "Lead your life with elegance: firm boundaries, intentional presence, inner peace." },
    ],

    peek_title: "LOOK INSIDE THE BOOK",
    peek_desc: "Chapter 1 is free. No commitment, no card needed.",
    peek_cta: "Read free chapter →",
    peek_chapters: "15 chapters",
    peek_pages: "Spanish & English",
    peek_audio: "Audiobook included",

    test_title: "WHAT OUR READERS SAY",

    author_eyebrow: "ABOUT THE AUTHOR",
    author_name: site.author.name,
    author_bio: "Writer, coach, and entrepreneur with over ten years helping women discover their worth, heal their relationships, and live with purpose. This book was born from her own transformation — and from thousands of women who walk alongside her.",

    offer_title: "CHOOSE YOUR EXPERIENCE",
    offer_subtitle: "Instant access. Read on your phone, tablet, or Kindle.",
    format_ebook: "E-book",
    format_audio: "Audiobook",
    format_bundle: "Bundle",
    format_desc_ebook: "15 chapters in PDF + ePub.\nRead on any device.",
    format_desc_audio: "15 narrated chapters.\nListen anywhere.",
    format_desc_bundle: "E-book + Audiobook.\nThe complete experience.",
    best_option: "MOST POPULAR",
    save_label: "Save",
    buy_cta: "Buy now",

    guarantee_title: "7-DAY GUARANTEE",
    guarantee_desc: "If you don't love it, we'll refund 100% of your money. No questions asked. Email hello@codigosdemujeres.com.",

    trust_stripe: "Secure encrypted payment",
    trust_instant: "Instant access",
    trust_refund: "7-day guarantee",

    lead_title: "Still not sure?",
    lead_desc: "We'll send you the first chapter free. No credit card.",
    lead_btn: "Send me chapter 1 free",
    lead_success: "Done! Check your inbox in the next few minutes.",
    lead_ph: "you@email.com",
    lead_name_ph: "Your name",
    lead_phone_ph: "+1 555 000 0000 (optional)",

    final_title: "Your transformation starts today",
    final_desc: "Every day without knowing your codes is a day you live below your potential.",
    final_cta: "I want my codes →",
    banner: "🎉 Launch offer — 40% off for a limited time",
  },
  it: {
    nav_brand: "CODICI", nav_sub: "Empowerment Femminile",
    lang_toggle: "PT", nav_buy: "Acquista",
    footer_products: "Prodotti", footer_blog: "Blog", footer_priv: "Privacy", footer_terms: "Termini", footer_refund: "Rimborsi",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    hero_eyebrow: "IL LIBRO CHE STA TRASFORMANDO LE DONNE",
    hero_title: "I codici che ogni\ndonna deve conoscere",
    hero_author: "di Dayana Guerrero",
    hero_hook: "15 capitoli. Una trasformazione completa. Il manuale che nessuno ti ha dato su cosa significa essere donna.",
    hero_stars: "★★★★★",
    hero_readers: "+2.400 lettrici",
    hero_scroll: "Scopri di più ↓",

    pain_title: "TI SUONA FAMILIARE?",
    pain_items: [
      "Dai tutto e non ricevi lo stesso",
      "Dici «sì» quando vuoi dire «no»",
      "Ti confronti costantemente con le altre donne",
      "La tua voce interiore ti dice che non sei abbastanza",
      "Hai perso il contatto con te stessa",
    ],
    pain_close: "Non è colpa tua. Nessuno ti ha insegnato i codici.",

    solution_title: "QUESTO LIBRO TI DÀ I CODICI",
    solution_items: [
      { title: "Il tuo potere femminile", desc: "Riconnettiti con la tua essenza — quella forza magnetica che non va forzata, solo ricordata." },
      { title: "Mente e autostima", desc: "Costruisci una fiducia che non dipende da nessuno. Cambia il tuo dialogo interiore per sempre." },
      { title: "Presenza magnetica", desc: "La tua immagine, la tua voce e la tua energia comunicano prima delle tue parole. Impara a usarle." },
      { title: "Leadership e scopo", desc: "Guida la tua vita con eleganza: confini netti, presenza intenzionale, pace interiore." },
    ],

    peek_title: "SFOGLIA IL LIBRO",
    peek_desc: "Il Capitolo 1 è gratuito. Senza impegno, senza carta di credito.",
    peek_cta: "Leggi il capitolo gratis →",
    peek_chapters: "15 capitoli",
    peek_pages: "Spagnolo, inglese e italiano",
    peek_audio: "Audiolibro incluso",

    test_title: "COSA DICONO LE NOSTRE LETTRICI",

    author_eyebrow: "SULL'AUTRICE",
    author_name: site.author.name,
    author_bio: "Scrittrice, coach e imprenditrice con oltre dieci anni di esperienza nell'accompagnare le donne a scoprire il proprio valore, guarire le proprie relazioni e vivere con uno scopo. Questo libro è nato dalla sua stessa trasformazione — e da quella di migliaia di donne che la seguono.",

    offer_title: "SCEGLI LA TUA ESPERIENZA",
    offer_subtitle: "Accesso immediato. Leggi sul telefono, tablet o Kindle.",
    format_ebook: "E-book",
    format_audio: "Audiolibro",
    format_bundle: "Bundle",
    format_desc_ebook: "15 capitoli in PDF + ePub.\nLeggi su qualsiasi dispositivo.",
    format_desc_audio: "15 capitoli narrati.\nAscolta ovunque.",
    format_desc_bundle: "E-book + Audiolibro.\nL'esperienza completa.",
    best_option: "PIÙ POPOLARE",
    save_label: "Risparmia",
    buy_cta: "Acquista ora",

    guarantee_title: "GARANZIA DI 7 GIORNI",
    guarantee_desc: "Se non ti entusiasma, ti rimborsiamo il 100% della spesa. Senza domande. Scrivici a hello@codigosdemujeres.com.",

    trust_stripe: "Pagamento sicuro e criptato",
    trust_instant: "Accesso immediato",
    trust_refund: "Garanzia 7 giorni",

    lead_title: "Non sei ancora sicura?",
    lead_desc: "Ti inviamo il primo capitolo gratis. Senza carta di credito.",
    lead_btn: "Voglio il mio capitolo gratis",
    lead_success: "Fatto! Controlla la tua email nei prossimi minuti.",
    lead_ph: "la@tuaemail.it",
    lead_name_ph: "Il tuo nome",
    lead_phone_ph: "+39 333 000 0000 (opzionale)",

    final_title: "La tua trasformazione inizia oggi",
    final_desc: "Ogni giorno che passa senza conoscere i tuoi codici è un giorno in cui vivi al di sotto del tuo potenziale.",
    final_cta: "Voglio i miei codici →",
    banner: "🎉 Offerta di lancio — 40% di sconto per un tempo limitato",
  },
  pt: {
    nav_brand: "CÓDIGOS", nav_sub: "Empoderamento Feminino",
    lang_toggle: "ES", nav_buy: "Comprar",
    footer_products: "Produtos", footer_blog: "Blog", footer_priv: "Privacidade", footer_terms: "Termos", footer_refund: "Reembolsos",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    hero_eyebrow: "O LIVRO QUE ESTÁ TRANSFORMANDO MULHERES",
    hero_title: "Códigos que toda\nmulher precisa saber",
    hero_author: "por Dayana Guerrero",
    hero_hook: "15 capítulos. Uma transformação completa. O manual que ninguém te deu sobre ser mulher.",
    hero_stars: "★★★★★",
    hero_readers: "+2.400 leitoras",
    hero_scroll: "Descubra mais ↓",

    pain_title: "ISSO TE SONA FAMILIAR?",
    pain_items: [
      "Você dá tudo e não recebe o mesmo",
      "Diz 'sim' quando quer dizer 'não'",
      "Se compara constantemente com outras mulheres",
      "Sua voz interior diz que você não é suficiente",
      "Perdeu a conexão consigo mesma",
    ],
    pain_close: "Não é sua culpa. Ninguém te ensinou os códigos.",

    solution_title: "ESTE LIVRO TE DÁ OS CÓDIGOS",
    solution_items: [
      { title: "Seu poder feminino", desc: "Reconecte-se com sua essência — essa força magnética que não precisa ser forçada, apenas lembrada." },
      { title: "Mente e autoestima", desc: "Construa uma confiança que não depende de ninguém. Mude seu diálogo interno para sempre." },
      { title: "Presença magnética", desc: "Sua imagem, voz e energia comunicam antes das suas palavras. Aprenda a usá-las." },
      { title: "Liderança e propósito", desc: "Lidere sua vida com elegância: limites firmes, presença intencional, paz interior." },
    ],

    peek_title: "VEJA DENTRO DO LIVRO",
    peek_desc: "O Capítulo 1 é gratuito. Sem compromisso, sem cartão.",
    peek_cta: "Ler capítulo grátis →",
    peek_chapters: "15 capítulos",
    peek_pages: "Espanhol, inglês e italiano",
    peek_audio: "Audiolivro incluído",

    test_title: "O QUE NOSSAS LEITORAS DIZEM",

    author_eyebrow: "SOBRE A AUTORA",
    author_name: site.author.name,
    author_bio: "Escritora, coach e empreendedora com mais de quatro anos acompanhando mulheres a descobrir seu valor, curar seus relacionamentos e viver com propósito. Este livro nasceu de sua própria transformação — e da de milhares de mulheres que a seguem.",

    offer_title: "ESCOLHA SUA EXPERIÊNCIA",
    offer_subtitle: "Acesso imediato. Leia no celular, tablet ou Kindle.",
    format_ebook: "E-book",
    format_audio: "Audiolivro",
    format_bundle: "Bundle",
    format_desc_ebook: "15 capítulos em PDF + ePub.\nLeia em qualquer dispositivo.",
    format_desc_audio: "15 capítulos narrados.\nOuça onde quiser.",
    format_desc_bundle: "E-book + Audiolivro.\nA experiência completa.",
    best_option: "MAIS POPULAR",
    save_label: "Economize",
    buy_cta: "Comprar agora",

    guarantee_title: "GARANTIA DE 7 DIAS",
    guarantee_desc: "Se não amar, devolvemos 100% do seu dinheiro. Sem perguntas. Escreva para hello@codigosdemujeres.com.",

    trust_stripe: "Pagamento seguro e criptografado",
    trust_instant: "Acesso imediato",
    trust_refund: "Garantia 7 dias",

    lead_title: "Ainda não tem certeza?",
    lead_desc: "Enviamos o primeiro capítulo grátis. Sem cartão.",
    lead_btn: "Quero meu capítulo grátis",
    lead_success: "Pronto! Verifique seu e-mail nos próximos minutos.",
    lead_ph: "seu@email.com",
    lead_name_ph: "Seu nome",
    lead_phone_ph: "+55 11 90000-0000 (opcional)",

    final_title: "Sua transformação começa hoje",
    final_desc: "Cada dia que passa sem conhecer seus códigos é um dia que você vive abaixo do seu potencial.",
    final_cta: "Quero meus códigos →",
    banner: "🎉 Oferta de lançamento — 40% de desconto por tempo limitado",
  },
} as const;

// ─── Social feed i18n ─────────────────────────────────────────────────────────
const SOCIAL_T = {
  es: { title: "EN MIS REDES", handle: "@codigosdemujeres", follow: "Seguir en Instagram" },
  en: { title: "ON MY SOCIALS", handle: "@codigosdemujeres", follow: "Follow on Instagram" },
  it: { title: "SUI MIEI SOCIAL", handle: "@codigosdemujeres", follow: "Segui su Instagram" },
  pt: { title: "NAS MINHAS REDES", handle: "@codigosdemujeres", follow: "Seguir no Instagram" },
};

type Lang   = keyof typeof T;
type Format = "ebook" | "audio" | "bundle";

const PRICES: Record<Format, number> = {
  ebook:  site.product.formats.ebook.price,
  audio:  site.product.formats.audio.price,
  bundle: site.product.formats.bundle.price,
};
const ORIGINAL_PRICES: Record<Format, number> = {
  ebook:  site.product.formats.ebook.originalPrice,
  audio:  site.product.formats.audio.originalPrice,
  bundle: site.product.formats.bundle.originalPrice,
};
const SAVINGS = PRICES.ebook + PRICES.audio - PRICES.bundle;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const S = {
  eyebrow: { fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700 as const, letterSpacing: "0.15em", textTransform: "uppercase" as const },
  heading: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 as const, letterSpacing: "0.01em" },
  body:    { fontFamily: "'Nunito', sans-serif", lineHeight: 1.7 },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StoreLanding() {
  usePageMeta("CÓDIGOS — Códigos que toda mujer necesita saber | Dayana Guerrero");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = searchParams.get("lang");
  const [lang, setLang]     = useState<Lang>(initLang === "it" ? "it" : initLang === "en" ? "en" : initLang === "pt" ? "pt" : "es");
  const [format, setFormat] = useState<Format>("bundle");
  const [testimonials, setTestimonials] = useState<{ author: string; text_es: string; text_en: string; stars: number }[]>([]);
  const [socialPosts,  setSocialPosts]  = useState<any[]>([]);
  const t = T[lang];

  useEffect(() => { ["utm_source","utm_medium","utm_campaign"].forEach(k => { const v = searchParams.get(k); if (v) sessionStorage.setItem(k, v); }); }, [searchParams]);
  useEffect(() => { fetch("/api/testimonials").then(r => r.json()).then(d => setTestimonials(d.testimonials ?? [])).catch(() => {}); }, []);
  useEffect(() => { fetch("/api/blog/posts?type=social&limit=9").then(r => r.json()).then(d => setSocialPosts(d.posts ?? [])).catch(() => {}); }, []);
  useEffect(() => { trackEvent("ViewContent"); }, []);

  const [leadEmail, setLeadEmail]     = useState("");
  const [leadName,  setLeadName]      = useState("");
  const [leadPhone, setLeadPhone]     = useState("");
  const [leadSent,  setLeadSent]      = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadEmail.trim() || leadLoading) return;
    setLeadLoading(true);
    try {
      await fetch("/api/store/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: leadEmail.trim(), lang,
          firstName: leadName.trim() || undefined,
          phone: leadPhone.trim() || undefined,
          newsletterOptIn: true,
          utmSource:   sessionStorage.getItem("utm_source")   || undefined,
          utmMedium:   sessionStorage.getItem("utm_medium")   || undefined,
          utmCampaign: sessionStorage.getItem("utm_campaign") || undefined,
        }),
      });
      setLeadSent(true);
      trackEvent("Lead");
    } catch {}
    setLeadLoading(false);
  }

  const price         = `$${PRICES[format].toFixed(2)}`;
  const originalPrice = `$${ORIGINAL_PRICES[format].toFixed(2)}`;
  const discountPct   = Math.round((1 - PRICES[format] / ORIGINAL_PRICES[format]) * 100);
  const { amount: localPrice } = useLocalCurrency(PRICES[format]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const handleBuy = () => navigate(`/checkout?format=${format}&lang=${lang}`);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <SEOHead title={site.product.title_es + " — " + site.author.name} description={site.product.tagline_es} url={`https://${site.domain}`} lang={lang} />

      {/* ── Scroll-snap + global section styles ── */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .snap-container { scroll-snap-type: y proximity; }
        .snap-section { scroll-snap-align: start; }
        .nav-link { font-size: 12px; color: rgba(255,255,255,0.7); text-decoration: none;
          letter-spacing: 0.04em; padding: 8px 12px; border-radius: 4px;
          transition: color 0.15s, background 0.15s; white-space: nowrap; min-height: 36px;
          display: inline-flex; align-items: center; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .section-pad { padding: 64px 24px; }
        @media (max-width: 600px) {
          .section-pad { padding: 48px 20px; }
          .nav-link { font-size: 11px; padding: 8px 8px; }
          .nav-desktop-only { display: none !important; }
          .cover-img { width: clamp(140px, 55vw, 200px) !important; }
          .author-img { width: 120px !important; height: 120px !important; }
          .offer-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 601px) and (max-width: 900px) {
          .nav-desktop-only { display: none !important; }
          .offer-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important; }
        }
        @media (min-width: 901px) {
          .cover-img { width: 260px !important; }
          .author-img { width: 160px !important; height: 160px !important; }
          .offer-grid { grid-template-columns: repeat(3, 1fr) !important; max-width: 820px; margin: 0 auto; }
          .hero-section { min-height: calc(100svh - 52px); max-width: 700px; margin: 0 auto; }
        }
        .testimonial-scroll { display: flex; gap: 16px; overflow-x: auto; padding: 0 24px 16px;
          scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .testimonial-scroll::-webkit-scrollbar { display: none; }
        .testimonial-scroll > div { scroll-snap-align: center; flex-shrink: 0; width: 280px; }
        .social-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; max-width: 720px; margin: 0 auto; }
        @media (max-width: 500px) { .social-grid { grid-template-columns: repeat(2, 1fr); } }
        .social-tile { display: block; position: relative; overflow: hidden; background: #F7C6D0; cursor: pointer; text-decoration: none; }
        .social-tile::before { content: ""; display: block; padding-top: 100%; }
        .social-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
        .social-tile:hover img { transform: scale(1.05); }
        .social-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(123,30,58,0.9) 0%, transparent 55%); opacity: 0; transition: opacity 0.25s; display: flex; flex-direction: column; justify-content: flex-end; padding: 12px; }
        .social-tile:hover .social-overlay { opacity: 1; }
        @media (hover: none) { .social-tile .social-overlay { opacity: 0.8; } }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: C.burgundy }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 8, flexShrink: 0 }}>
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: C.pureWhite, letterSpacing: "0.12em" }}>{t.nav_brand}</span>
            <span className="hidden sm:inline" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>{t.nav_sub}</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[
              { label: lang === "es" ? "El libro" : lang === "it" ? "Il libro" : lang === "pt" ? "O livro" : "The book", href: "#libro", desktop: true },
              { label: lang === "es" ? "Autora" : lang === "it" ? "Autrice" : lang === "pt" ? "A autora" : "Author", href: "#autora", desktop: true },
              { label: lang === "es" ? "Testimonios" : lang === "it" ? "Testimonianze" : lang === "pt" ? "Depoimentos" : "Reviews", href: "#testimonios", desktop: true },
              { label: lang === "es" ? "Productos" : lang === "it" ? "Prodotti" : lang === "pt" ? "Produtos" : "Products", href: `/productos?lang=${lang}`, desktop: false },
              { label: "Blog", href: `/blog?lang=${lang}`, desktop: false },
            ].map(link => (
              <a key={link.label} href={link.href} className={`nav-link${link.desktop ? " nav-desktop-only" : ""}`}>{link.label}</a>
            ))}
            <span style={{ width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0, margin: "0 4px" }} />
            <button
              onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : lang === "it" ? "pt" : "es")}
              className="nav-link"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
            >{t.lang_toggle}</button>
          </div>
        </div>
      </nav>

      {/* ── DISCOUNT BANNER ── */}
      {!bannerDismissed && (
        <div style={{ backgroundColor: C.crimson, color: C.pureWhite, textAlign: "center", padding: "10px 40px 10px 16px", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", position: "relative", lineHeight: 1.4 }}>
          {t.banner}
          <button onClick={() => setBannerDismissed(true)} aria-label="Cerrar" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "4px 6px" }}>×</button>
        </div>
      )}

      <div className="snap-container">

      {/* ═══ 1. HERO ═══ */}
      <section className="snap-section section-pad" style={{ textAlign: "center", background: `linear-gradient(180deg, ${C.bg} 0%, ${C.pink} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100svh - 52px)" }}>
        <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 20 }}>{t.hero_eyebrow}</p>
        <div style={{ marginBottom: 28 }}>
          <img
            src={lang === "en" ? "/cover-en.png" : lang === "it" ? "/cover-it.png" : lang === "pt" ? "/cover-es.png" : "/cover-es.png"}
            alt={`CÓDIGOS — ${t.hero_author}`}
            className="cover-img"
            style={{ width: "clamp(160px, 42vw, 220px)", height: "auto", borderRadius: 4, boxShadow: "8px 8px 32px rgba(123,30,58,0.25), -2px 2px 0 rgba(123,30,58,0.15)" }}
          />
        </div>
        <h1 style={{ ...S.heading, fontSize: "clamp(1.8rem, 6vw, 2.8rem)", lineHeight: 1.15, color: C.burgundy, marginBottom: 12, whiteSpace: "pre-line" }}>{t.hero_title}</h1>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, fontStyle: "italic" }}>{t.hero_author}</p>
        <p style={{ ...S.body, fontSize: 15, color: C.secondary, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.7 }}>{t.hero_hook}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <span style={{ color: "#C9A84C", fontSize: 15, letterSpacing: 2 }}>{t.hero_stars}</span>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{t.hero_readers}</span>
        </div>
        <a href="#pain" style={{ display: "inline-block", fontSize: 13, color: C.crimson, fontWeight: 600, textDecoration: "none", letterSpacing: "0.03em", animation: "pulse 2s infinite" }}>{t.hero_scroll}</a>
      </section>

      {/* ═══ 2. THE PAIN ═══ */}
      <section id="pain" className="snap-section section-pad" style={{ backgroundColor: C.pureWhite }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 28 }}>{t.pain_title}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {t.pain_items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ color: C.crimson, fontSize: 16, marginTop: 1, flexShrink: 0, lineHeight: 1.5 }}>✗</span>
                <span style={{ fontSize: 15, color: C.secondary, lineHeight: 1.65 }}>{item}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 36, padding: "20px 24px", background: `linear-gradient(135deg, ${C.pink}40, ${C.pink}80)`, borderRadius: 12 }}>
            <p style={{ ...S.heading, fontSize: 18, color: C.burgundy, lineHeight: 1.4, textAlign: "center" }}>{t.pain_close}</p>
          </div>
        </div>
      </section>

      {/* ═══ 3. THE SOLUTION ═══ */}
      <section id="libro" className="snap-section section-pad" style={{ backgroundColor: C.pink }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.darkBurg, marginBottom: 32, textAlign: "center" }}>{t.solution_title}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
            {t.solution_items.map((item, i) => (
              <div key={i} style={{ padding: "24px 22px", backgroundColor: C.pureWhite, borderRadius: 12, borderLeft: `3px solid ${C.crimson}`, boxShadow: "0 2px 12px rgba(123,30,58,0.06)" }}>
                <p style={{ ...S.heading, fontSize: 17, color: C.burgundy, marginBottom: 10 }}>{item.title}</p>
                <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. PEEK INSIDE ═══ */}
      <section className="snap-section section-pad" style={{ backgroundColor: C.pureWhite }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 20 }}>{t.peek_title}</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            {[t.peek_chapters, t.peek_pages, t.peek_audio].map((item, i) => (
              <span key={i} style={{ fontSize: 13, color: C.secondary, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: C.crimson, fontSize: 10 }}>✦</span> {item}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.65, marginBottom: 28 }}>{t.peek_desc}</p>
          <button onClick={() => window.open(`/api/store/sample?lang=${lang}`, "_blank", "noopener")} style={{
            display: "inline-flex", padding: "16px 36px",
            backgroundColor: "transparent", color: C.crimson,
            border: `2px solid ${C.crimson}`, borderRadius: 8,
            fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 15,
            cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.crimson; e.currentTarget.style.color = C.pureWhite; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.crimson; }}>
            {t.peek_cta}
          </button>
        </div>
      </section>

      {/* ═══ 5. TESTIMONIALS ═══ */}
      {testimonials.length > 0 && (
        <section id="testimonios" className="snap-section section-pad" style={{ backgroundColor: C.pink, paddingLeft: 0, paddingRight: 0 }}>
          <p style={{ ...S.eyebrow, color: C.crimson, textAlign: "center", marginBottom: 28 }}>{t.test_title}</p>
          <div className="testimonial-scroll">
            {testimonials.map((r, i) => (
              <div key={i} style={{ padding: "24px 22px", backgroundColor: C.pureWhite, borderRadius: 12, boxShadow: "0 2px 12px rgba(123,30,58,0.06)" }}>
                <div style={{ marginBottom: 10, color: "#C9A84C", fontSize: 14 }}>{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</div>
                <p style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 14, color: C.secondary }}>"{lang === "en" ? r.text_en || r.text_es : lang === "it" ? (r as any).text_it || r.text_en || r.text_es : lang === "pt" ? (r as any).text_pt || r.text_es : r.text_es}"</p>
                <p style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>— {r.author}</p>
              </div>
            ))}
          </div>
          {/* Scroll hint dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            {testimonials.slice(0, Math.min(testimonials.length, 6)).map((_, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i === 0 ? C.crimson : "rgba(123,30,58,0.2)" }} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ 6. AUTHOR ═══ */}
      <section id="autora" className="snap-section section-pad" style={{ backgroundColor: C.bg }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 24 }}>{t.author_eyebrow}</p>
          <img src="/daya.jpg" alt={t.author_name} className="author-img" style={{ width: "clamp(110px, 30vw, 150px)", height: "clamp(110px, 30vw, 150px)", borderRadius: "50%", objectFit: "cover", objectPosition: "center top", border: `3px solid ${C.crimson}`, marginBottom: 20, boxShadow: "0 4px 20px rgba(123,30,58,0.15)" }} />
          <h3 style={{ ...S.heading, fontSize: 22, color: C.burgundy, marginBottom: 12 }}>{t.author_name}</h3>
          <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.75 }}>{t.author_bio}</p>
        </div>
      </section>

      {/* ═══ 6.5 SOCIAL FEED ═══ */}
      {socialPosts.length > 0 && (
        <section className="snap-section" style={{ backgroundColor: C.pureWhite, padding: "44px 0 36px" }}>

          {/* Header */}
          <div style={{ textAlign: "center", padding: "0 24px", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ height: 1, width: 28, backgroundColor: C.border }} />
              <p style={{ ...S.eyebrow, color: C.crimson, margin: 0 }}>{SOCIAL_T[lang].title}</p>
              <div style={{ height: 1, width: 28, backgroundColor: C.border }} />
            </div>
            <a href="https://instagram.com/codigosdemujeres" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: C.muted, textDecoration: "none", letterSpacing: "0.03em", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.crimson }}>
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              {SOCIAL_T[lang].handle}
            </a>
          </div>

          {/* Carrusel horizontal */}
          <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 24px 12px", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any }}>
            {socialPosts.map(post => {
              const link = post.ig_post_id
                ? `https://instagram.com/p/${post.ig_post_id}`
                : post.fb_post_id ? `https://facebook.com/${post.fb_post_id}` : null;
              const caption = lang === "en"
                ? (post.excerpt_en || post.excerpt_es || post.title_en || post.title_es)
                : lang === "it" ? (post.excerpt_it || post.excerpt_es || post.title_es)
                : lang === "pt" ? ((post as any).excerpt_pt || post.excerpt_es || post.title_es)
                : (post.excerpt_es || post.title_es);

              return (
                <a
                  key={post.id}
                  href={link ?? "#"}
                  target={link ? "_blank" : undefined}
                  rel={link ? "noopener noreferrer" : undefined}
                  onClick={!link ? (e: React.MouseEvent) => e.preventDefault() : undefined}
                  style={{ flexShrink: 0, width: 200, scrollSnapAlign: "start", textDecoration: "none", display: "flex", flexDirection: "column" }}
                >
                  {/* Imagen cuadrada */}
                  <div style={{ width: 200, height: 200, overflow: "hidden", position: "relative", backgroundColor: C.pink, flexShrink: 0 }}>
                    {post.image_url ? (
                      <img src={post.image_url} alt="" loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: `linear-gradient(145deg, ${C.pink} 0%, #F0B0C4 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, gap: 8 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.crimson }}>✦</span>
                        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.burgundy, textAlign: "center", lineHeight: 1.4, fontWeight: 600, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" as const }}>
                          {caption}
                        </p>
                      </div>
                    )}
                    {/* Platform badge */}
                    {(post.ig_post_id || post.fb_post_id) && (
                      <span style={{ position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {post.ig_post_id ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        )}
                      </span>
                    )}
                  </div>
                  {/* Caption debajo */}
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.secondary, lineHeight: 1.45, margin: "8px 0 0", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                    {caption}
                  </p>
                  {post.hashtags && (
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.crimson, marginTop: 3 }}>
                      {(post.hashtags as string).split(" ").slice(0, 2).join(" ")}
                    </p>
                  )}
                </a>
              );
            })}
          </div>

          {/* Follow CTA */}
          <div style={{ textAlign: "center", padding: "12px 24px 0" }}>
            <a
              href="https://instagram.com/codigosdemujeres"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", border: `1.5px solid ${C.crimson}`, color: C.crimson, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textDecoration: "none", borderRadius: 4, transition: "all 0.15s", textTransform: "uppercase" as const }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.crimson; e.currentTarget.style.color = C.pureWhite; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = C.crimson; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
              {SOCIAL_T[lang].follow}
            </a>
          </div>

        </section>
      )}

      {/* ═══ 7. THE OFFER ═══ */}
      <section id="offer" className="snap-section section-pad" style={{ backgroundColor: C.pinkLight }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 10 }}>{t.offer_title}</p>
            <p style={{ fontSize: 15, color: C.secondary }}>{t.offer_subtitle}</p>
          </div>

          <div className="offer-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {([
              { key: "ebook" as Format, label: t.format_ebook, desc: t.format_desc_ebook, icon: "📖" },
              { key: "bundle" as Format, label: t.format_bundle, desc: t.format_desc_bundle, icon: "📦" },
              { key: "audio" as Format, label: t.format_audio, desc: t.format_desc_audio, icon: "🎧" },
            ]).map(f => (
              <button key={f.key} onClick={() => setFormat(f.key)} style={{
                position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: f.key === "bundle" ? "36px 20px 24px" : "24px 20px",
                backgroundColor: format === f.key ? C.pureWhite : "rgba(255,255,255,0.5)",
                border: `2px solid ${format === f.key ? C.crimson : C.border}`,
                borderRadius: 16, cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: format === f.key ? "0 4px 20px rgba(194,80,106,0.15)" : "none",
                textAlign: "center",
                order: f.key === "bundle" ? -1 : 0,
              }}>
                {f.key === "bundle" && (
                  <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", padding: "4px 14px", backgroundColor: C.crimson, color: C.pureWhite, borderRadius: 20, whiteSpace: "nowrap" }}>{t.best_option}</span>
                )}
                <span style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</span>
                <p style={{ fontWeight: 700, fontSize: 15, color: C.burgundy, marginBottom: 6 }}>{f.label}</p>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: C.muted, textDecoration: "line-through", display: "block" }}>${ORIGINAL_PRICES[f.key].toFixed(2)}</span>
                  <span style={{ ...S.heading, fontSize: 28, color: format === f.key ? C.crimson : C.burgundy, transition: "color 0.2s" }}>${PRICES[f.key].toFixed(2)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.pureWhite, backgroundColor: C.crimson, borderRadius: 10, padding: "2px 7px", marginLeft: 6 }}>-{Math.round((1 - PRICES[f.key] / ORIGINAL_PRICES[f.key]) * 100)}%</span>
                </div>
                {f.key === "bundle" && SAVINGS > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.success, backgroundColor: "rgba(90,158,111,0.1)", padding: "4px 12px", borderRadius: 20, marginBottom: 10 }}>{t.save_label} ${SAVINGS.toFixed(2)}</span>
                )}
                <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.55, whiteSpace: "pre-line" }}>{f.desc}</p>
              </button>
            ))}
          </div>

          {/* BUY BUTTON */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={handleBuy} style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "18px 48px", minWidth: 280,
              backgroundColor: C.crimson, color: C.pureWhite,
              fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 17,
              letterSpacing: "0.04em",
              border: "none", borderRadius: 8, cursor: "pointer",
              transition: "background-color 0.15s, transform 0.1s",
              boxShadow: "0 6px 20px rgba(231,84,128,0.35)",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.crimsonHv; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.crimson; e.currentTarget.style.transform = "none"; }}>
              {t.buy_cta} —{" "}
              <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: 4 }}>{originalPrice}</span>
              <span style={{ color: "#FFE066" }}>{price}</span>
              {localPrice && <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 6 }}>≈ {localPrice}</span>}
            </button>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
            {[`🔒 ${t.trust_stripe}`, `⚡ ${t.trust_instant}`, `↩ ${t.trust_refund}`].map((item, i) => (
              <span key={i} style={{ fontSize: 12, color: C.muted }}>{item}</span>
            ))}
          </div>

          {/* Amazon link — only rendered when env var is set */}
          {import.meta.env.VITE_AMAZON_BOOK_URL && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
                {lang === "es" ? "También disponible en" : lang === "it" ? "Disponibile anche su" : lang === "pt" ? "Também disponível em" : "Also available on"}
              </p>
              <a
                href={import.meta.env.VITE_AMAZON_BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("AmazonClick", { content_name: "Códigos — Amazon Kindle" })}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px",
                  backgroundColor: "#FF9900", color: "#111",
                  fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 14,
                  border: "none", borderRadius: 8, cursor: "pointer",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(255,153,0,0.35)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.44.33-.568.413-1.365.77-2.8 1.362-4.316 1.78-1.528.417-3.07.627-4.617.627-4.82 0-9.168-1.278-13.05-3.832-.52-.33-.665-.63-.45-.9h.004zm21.165-3.58c-.196-.245-.43-.353-.7-.317-1.055.116-2.112.254-3.167.435-.264.043-.432.02-.498-.07-.073-.096-.028-.254.138-.476 1.08-1.474 2.19-2.955 3.338-4.44.24-.31.408-.597.497-.87.096-.27.11-.53.033-.78-.078-.248-.245-.49-.5-.726-.577-.524-1.378-.833-2.4-.924-1.78-.163-3.347.44-4.7 1.81-.134.14-.206.35-.207.624-.002.247.047.52.142.81.093.29.23.58.406.867.184.286.415.566.69.84-.98 1.037-1.57 1.83-1.755 2.378-.116.347-.12.668-.007.96.112.292.33.507.654.64.4.16.9.2 1.478.112.58-.09 1.155-.293 1.73-.612.576-.32 1.088-.72 1.538-1.198l.008-.01c1.46 1.49 2.578 2.496 3.367 3.016.26.168.52.196.782.086.26-.108.43-.32.51-.63.09-.315.07-.635-.07-.96l-.007-.014zm-2.2-6.68c.08.24.07.516-.04.826-.112.31-.306.573-.586.785-.284.217-.626.343-1.025.378-.4.034-.8-.032-1.2-.2-.397-.163-.724-.43-.983-.797-.26-.37-.39-.77-.39-1.205 0-.44.13-.848.39-1.222.258-.376.586-.65.983-.822.4-.174.8-.234 1.2-.182.4.054.74.184 1.027.39.284.206.476.46.58.763.103.3.12.604.044.912v-.002z"/>
                </svg>
                Amazon Kindle
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 8. GUARANTEE ═══ */}
      <section className="snap-section section-pad" style={{ backgroundColor: C.pureWhite }}>
        <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "28px 24px", border: `2px solid ${C.success}`, borderRadius: 16, background: "rgba(90,158,111,0.04)" }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 12 }}>↩</span>
          <p style={{ ...S.heading, fontSize: 18, color: C.success, marginBottom: 10 }}>{t.guarantee_title}</p>
          <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.65 }}>{t.guarantee_desc}</p>
        </div>
      </section>

      {/* ═══ 9. LEAD CAPTURE ═══ */}
      <section className="snap-section section-pad" style={{ backgroundColor: C.pinkLight }}>
        <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <h3 style={{ ...S.heading, fontSize: 22, color: C.burgundy, marginBottom: 10 }}>{t.lead_title}</h3>
          <p style={{ fontSize: 15, color: C.secondary, marginBottom: 24, lineHeight: 1.65 }}>{t.lead_desc}</p>
          {leadSent ? (
            <p style={{ fontSize: 15, fontWeight: 600, color: C.success, animation: "fadeUp 0.3s ease" }}>{t.lead_success}</p>
          ) : (
            <form onSubmit={handleLeadSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 380, margin: "0 auto" }}>
              <input
                type="text" placeholder={t.lead_name_ph} value={leadName}
                onChange={e => setLeadName(e.target.value)} className="input"
                style={{ padding: "12px 14px" }} aria-label="Nombre"
              />
              <input
                type="email" required placeholder={t.lead_ph} value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)} className="input"
                style={{ padding: "12px 14px" }} aria-label="Email"
              />
              <input
                type="tel" placeholder={t.lead_phone_ph} value={leadPhone}
                onChange={e => setLeadPhone(e.target.value)} className="input"
                style={{ padding: "12px 14px" }} aria-label="WhatsApp"
              />
              <button type="submit" disabled={leadLoading} style={{ padding: "14px 24px", backgroundColor: C.crimson, color: C.pureWhite, fontWeight: 700, fontSize: 15, border: "none", borderRadius: 8, cursor: "pointer", opacity: leadLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
                {leadLoading ? "..." : t.lead_btn}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ═══ 10. FINAL CTA ═══ */}
      <section className="snap-section section-pad" style={{ textAlign: "center", backgroundColor: C.burgundy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h2 style={{ ...S.heading, fontSize: "clamp(1.5rem, 5vw, 2.2rem)", color: C.pureWhite, marginBottom: 14 }}>{t.final_title}</h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.75)", marginBottom: 32, maxWidth: 420, lineHeight: 1.65 }}>{t.final_desc}</p>
        <button onClick={handleBuy} style={{
          display: "inline-flex", padding: "18px 44px",
          backgroundColor: C.crimson, color: C.pureWhite,
          fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 17,
          border: "none", borderRadius: 8, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(231,84,128,0.4)",
          transition: "background-color 0.15s, transform 0.1s",
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.crimsonHv; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.crimson; e.currentTarget.style.transform = "none"; }}>
          {t.final_cta} —{" "}
          <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: 4 }}>{originalPrice}</span>
          <span style={{ color: "#FFE066" }}>{price}</span>
          {localPrice && <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 6 }}>≈ {localPrice}</span>}
        </button>
      </section>

      </div>{/* end snap-container */}

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 24px", backgroundColor: C.bg }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <span style={{ ...S.heading, fontSize: 16, letterSpacing: "0.08em", color: C.burgundy }}>CÓDIGOS</span>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { label: t.footer_products, action: () => navigate(`/productos?lang=${lang}`) },
              { label: t.footer_blog,   action: () => navigate(`/blog?lang=${lang}`) },
              { label: t.footer_priv,   action: () => navigate(lang === "es" ? "/privacidad" : lang === "it" ? "/privacy?lang=it" : "/privacy") },
              { label: t.footer_terms,  action: () => navigate(lang === "es" ? "/terminos" : lang === "it" ? "/terms?lang=it" : "/terms") },
              { label: t.footer_refund, action: () => navigate(lang === "es" ? "/reembolso" : lang === "it" ? "/refund?lang=it" : "/refund") },
            ].map(link => (
              <button key={link.label} onClick={link.action} style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", padding: "4px 0", transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.burgundy)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>{link.label}</button>
            ))}
          </div>
          {/* Social media icons */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <a href="https://www.instagram.com/codigosdemujeres" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted, transition: "color 0.15s", display: "flex", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.burgundy)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
              aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/share/1854xKz1en/" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted, transition: "color 0.15s", display: "flex", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.burgundy)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
              aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
          <span style={{ fontSize: 11, color: C.muted }}>{t.footer}</span>
          <span style={{ fontSize: 11, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
            Women Coding LLC · <a href="tel:+18175338934" style={{ color: C.muted, textDecoration: "none" }}>+1 (817) 533-8934</a>
          </span>
          <span style={{ fontSize: 10, color: C.muted, opacity: 0.7 }}>
            Hecho con ❤ por{" "}
            <a href="https://easybots.store" target="_blank" rel="noopener noreferrer"
              style={{ color: C.muted, textDecoration: "underline", textUnderlineOffset: 3 }}>
              easybots.store
            </a>
          </span>
        </div>
      </footer>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="md:hidden" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "10px 16px", backgroundColor: "rgba(123,30,58,0.96)", backdropFilter: "blur(12px)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "block", letterSpacing: "0.06em", textTransform: "uppercase" }}>{t.format_bundle}</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "line-through", display: "block" }}>{originalPrice}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#FFE066", fontFamily: "'Playfair Display', serif" }}>{price}</span>
          {localPrice && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", display: "block" }}>≈ {localPrice}</span>}
        </div>
        <button onClick={handleBuy} style={{ padding: "12px 24px", backgroundColor: C.crimson, color: C.pureWhite, fontWeight: 700, fontSize: 14, border: "none", borderRadius: 6, cursor: "pointer", boxShadow: "0 2px 8px rgba(231,84,128,0.4)" }}>{t.buy_cta} →</button>
      </div>
      <div className="md:hidden" style={{ height: 64 }} />

      <ChatWidget whatsappPhone={site.social.whatsapp} lang={lang} />
    </div>
  );
}
