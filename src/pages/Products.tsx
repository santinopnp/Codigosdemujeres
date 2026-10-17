import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { usePageMeta } from "@/hooks/usePageMeta";
import { colors as C, site } from "@/config/site";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  es: {
    lang_toggle: "EN",
    nav_brand: "CÓDIGOS",
    nav_sub: "Empoderamiento Femenino",
    back_home: "← Inicio",

    hero_eyebrow: "TIENDA COMPLETA",
    hero_title: "Todo lo que necesitas\npara tu transformación",
    hero_sub: "Libros, sesiones de coaching y recursos digitales — todos con 40% de descuento de lanzamiento.",

    badge_discount: "40% OFF",
    badge_popular: "MÁS POPULAR",
    badge_new: "NUEVO",

    // Sections
    section_books: "LIBROS",
    section_books_sub: "Acceso inmediato en PDF, ePub y MP3",
    section_coaching: "SESIONES DE COACHING",
    section_coaching_sub: "Sesiones 1 a 1 con Dayana Guerrero — reserva tu lugar ahora",
    section_digital: "RECURSOS DIGITALES",
    section_digital_sub: "Workbooks, guías y masterclasses para trabajar a tu ritmo",

    // Books
    book_ebook_name: "Libro Digital",
    book_ebook_desc: "Los 15 capítulos completos en PDF + ePub. Lee en cualquier dispositivo, en cualquier momento.",
    book_audio_name: "Audiolibro",
    book_audio_desc: "Los 15 capítulos narrados por Dayana. Escucha mientras caminas, cocinas o descansas.",
    book_bundle_name: "Bundle Completo",
    book_bundle_desc: "Libro Digital + Audiolibro juntos. La experiencia más completa al mejor precio.",
    buy_now: "Comprar ahora",
    includes: "Incluye:",

    // Coaching
    coaching_orient_name: "Sesión de Orientación",
    coaching_orient_duration: "30 minutos",
    coaching_orient_desc: "¿No sabes por dónde empezar? Esta sesión inicial te ayuda a identificar tus bloqueos y trazar un camino claro.",
    coaching_orient_includes: ["Diagnóstico inicial personalizado", "Plan de acción de 3 pasos", "Grabación de la sesión", "Seguimiento por WhatsApp 48h"],

    coaching_single_name: "Sesión Individual",
    coaching_single_duration: "60 minutos",
    coaching_single_desc: "Una sesión profunda para trabajar un tema específico: autoestima, relaciones, propósito o límites.",
    coaching_single_includes: ["Sesión de 60 min por videollamada", "Ejercicios personalizados", "Grabación de la sesión", "Seguimiento por WhatsApp 72h"],

    coaching_pack_name: "Paquete 3 Sesiones",
    coaching_pack_duration: "3 × 60 minutos",
    coaching_pack_desc: "Para trabajar una transformación real en pocas semanas. El paquete más solicitado.",
    coaching_pack_includes: ["3 sesiones de 60 min", "Plan de trabajo personalizado", "Grabaciones de todas las sesiones", "Soporte por WhatsApp ilimitado", "Recursos y ejercicios adicionales"],

    coaching_monthly_name: "Programa Mensual",
    coaching_monthly_duration: "4 sesiones / mes",
    coaching_monthly_desc: "Acompañamiento intensivo durante un mes completo. Para quien está lista para un cambio profundo.",
    coaching_monthly_includes: ["4 sesiones de 60 min al mes", "Acceso prioritario a Dayana", "Grabaciones de todas las sesiones", "Soporte por WhatsApp ilimitado", "Workbook mensual personalizado", "Revisión de metas semanales"],

    book_cta: "Comprar ahora",
    coaching_cta: "Reservar ahora",
    coaching_note: "Cupos limitados cada mes",

    // Digital
    workbook_name: "Workbook de Autoestima",
    workbook_desc: "52 ejercicios prácticos para reconectar con tu valor, sanar tu diálogo interno y construir confianza real.",
    workbook_includes: ["52 ejercicios paso a paso", "Journaling guiado", "Afirmaciones personalizadas", "PDF descargable"],

    masterclass_name: "Masterclass: Tu Poder Femenino",
    masterclass_desc: "3 horas de contenido en video donde Dayana comparte los fundamentos de su método de empoderamiento.",
    masterclass_includes: ["3 horas de video", "Material complementario en PDF", "Acceso de por vida", "Actualizaciones incluidas"],

    digital_cta: "Obtener acceso",

    // Subscriptions
    section_subs: "MEMBRESÍAS",
    section_subs_sub: "Acceso continuo · Cancela cuando quieras",
    sub_badge: "SUSCRIPCIÓN",
    sub_per_month: "/ mes",
    sub_cta: "Suscribirme ahora",
    sub_cancel: "Cancela cuando quieras",

    sub_club_name: "Club Códigos",
    sub_club_desc: "Acceso mensual a contenido nuevo, comunidad privada y llamada grupal en vivo con Dayana.",
    sub_club_includes: [
      "Nuevo contenido digital cada mes (PDF, audio, video)",
      "Comunidad privada de mujeres",
      "Llamada grupal en vivo mensual con Dayana",
      "Descuentos exclusivos en productos y coaching",
      "Acceso al archivo completo de contenido",
    ],

    sub_mentoring_name: "Mentoring Mensual",
    sub_mentoring_desc: "Acompañamiento intensivo mes a mes. Para mujeres comprometidas con su transformación continua.",
    sub_mentoring_includes: [
      "4 sesiones de coaching 1:1 por mes",
      "Soporte ilimitado por WhatsApp",
      "Plan de trabajo personalizado mensual",
      "Grabaciones de todas las sesiones",
      "Acceso completo al Club Códigos incluido",
      "Prioridad en agenda de Dayana",
    ],

    // Footer
    footer_blog: "Blog",
    footer_priv: "Privacidad",
    footer_terms: "Términos",
    footer_refund: "Reembolsos",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    // Guarantee
    guarantee_title: "GARANTÍA DE 7 DÍAS",
    guarantee_desc: "Todos los productos digitales tienen garantía de devolución de 7 días. Si no te encanta, te devolvemos el 100%.",

    original: "Precio normal",
    you_save: "Ahorras",
  },
  en: {
    lang_toggle: "IT",
    nav_brand: "CÓDIGOS",
    nav_sub: "Feminine Empowerment",
    back_home: "← Home",

    hero_eyebrow: "FULL STORE",
    hero_title: "Everything you need\nfor your transformation",
    hero_sub: "Books, coaching sessions, and digital resources — all 40% off for launch.",

    badge_discount: "40% OFF",
    badge_popular: "MOST POPULAR",
    badge_new: "NEW",

    section_books: "BOOKS",
    section_books_sub: "Instant access in PDF, ePub and MP3",
    section_coaching: "COACHING SESSIONS",
    section_coaching_sub: "1-on-1 sessions with Dayana Guerrero — book your spot now",
    section_digital: "DIGITAL RESOURCES",
    section_digital_sub: "Workbooks, guides and masterclasses to work at your own pace",

    book_ebook_name: "Digital Book",
    book_ebook_desc: "All 15 chapters in PDF + ePub. Read on any device, anytime.",
    book_audio_name: "Audiobook",
    book_audio_desc: "All 15 chapters narrated by Dayana. Listen while you walk, cook, or rest.",
    book_bundle_name: "Complete Bundle",
    book_bundle_desc: "Digital Book + Audiobook together. The most complete experience at the best price.",
    buy_now: "Buy now",
    includes: "Includes:",

    coaching_orient_name: "Orientation Session",
    coaching_orient_duration: "30 minutes",
    coaching_orient_desc: "Not sure where to start? This initial session helps you identify your blocks and map a clear path forward.",
    coaching_orient_includes: ["Personalized initial diagnosis", "3-step action plan", "Session recording", "WhatsApp follow-up 48h"],

    coaching_single_name: "Individual Session",
    coaching_single_duration: "60 minutes",
    coaching_single_desc: "A deep session to work on a specific topic: self-esteem, relationships, purpose, or boundaries.",
    coaching_single_includes: ["60 min video call session", "Personalized exercises", "Session recording", "WhatsApp follow-up 72h"],

    coaching_pack_name: "3-Session Package",
    coaching_pack_duration: "3 × 60 minutes",
    coaching_pack_desc: "For real transformation in just a few weeks. The most requested package.",
    coaching_pack_includes: ["3 × 60 min sessions", "Personalized work plan", "All session recordings", "Unlimited WhatsApp support", "Additional resources and exercises"],

    coaching_monthly_name: "Monthly Program",
    coaching_monthly_duration: "4 sessions / month",
    coaching_monthly_desc: "Intensive accompaniment for a full month. For those ready for deep change.",
    coaching_monthly_includes: ["4 × 60 min sessions per month", "Priority access to Dayana", "All session recordings", "Unlimited WhatsApp support", "Personalized monthly workbook", "Weekly goal reviews"],

    book_cta: "Buy now",
    coaching_cta: "Book now",
    coaching_note: "Limited spots each month",

    workbook_name: "Self-Esteem Workbook",
    workbook_desc: "52 practical exercises to reconnect with your worth, heal your inner dialogue, and build real confidence.",
    workbook_includes: ["52 step-by-step exercises", "Guided journaling", "Personalized affirmations", "Downloadable PDF"],

    masterclass_name: "Masterclass: Your Feminine Power",
    masterclass_desc: "3 hours of video content where Dayana shares the foundations of her empowerment method.",
    masterclass_includes: ["3 hours of video", "Complementary PDF material", "Lifetime access", "Updates included"],

    digital_cta: "Get access",

    // Subscriptions
    section_subs: "MEMBERSHIPS",
    section_subs_sub: "Continuous access · Cancel anytime",
    sub_badge: "SUBSCRIPTION",
    sub_per_month: "/ month",
    sub_cta: "Subscribe now",
    sub_cancel: "Cancel anytime",

    sub_club_name: "Códigos Club",
    sub_club_desc: "Monthly access to new content, a private community, and a live group call with Dayana.",
    sub_club_includes: [
      "New digital content every month (PDF, audio, video)",
      "Private women's community",
      "Monthly live group call with Dayana",
      "Exclusive discounts on products and coaching",
      "Access to the full content archive",
    ],

    sub_mentoring_name: "Monthly Mentoring",
    sub_mentoring_desc: "Intensive month-to-month accompaniment. For women committed to ongoing transformation.",
    sub_mentoring_includes: [
      "4 x 1:1 coaching sessions per month",
      "Unlimited WhatsApp support",
      "Personalized monthly work plan",
      "Recordings of all sessions",
      "Full Códigos Club access included",
      "Priority booking with Dayana",
    ],

    footer_blog: "Blog",
    footer_priv: "Privacy",
    footer_terms: "Terms",
    footer_refund: "Refunds",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    guarantee_title: "7-DAY GUARANTEE",
    guarantee_desc: "All digital products have a 7-day money-back guarantee. If you don't love it, we refund 100%.",

    original: "Regular price",
    you_save: "You save",
  },
  it: {
    lang_toggle: "PT",
    nav_brand: "CÓDIGOS",
    nav_sub: "Empowerment Femminile",
    back_home: "← Home",

    hero_eyebrow: "NEGOZIO COMPLETO",
    hero_title: "Tutto ciò di cui hai bisogno\nper la tua trasformazione",
    hero_sub: "Libri, sessioni di coaching e risorse digitali — tutti al 40% di sconto per il lancio.",

    badge_discount: "40% OFF",
    badge_popular: "PIÙ POPOLARE",
    badge_new: "NUOVO",

    section_books: "LIBRI",
    section_books_sub: "Accesso immediato in PDF, ePub e MP3",
    section_coaching: "SESSIONI DI COACHING",
    section_coaching_sub: "Sessioni 1 a 1 con Dayana Guerrero — prenota il tuo posto ora",
    section_digital: "RISORSE DIGITALI",
    section_digital_sub: "Workbook, guide e masterclass per lavorare al tuo ritmo",

    book_ebook_name: "Libro Digitale",
    book_ebook_desc: "Tutti i 15 capitoli in PDF + ePub. Leggi su qualsiasi dispositivo, in qualsiasi momento.",
    book_audio_name: "Audiolibro",
    book_audio_desc: "Tutti i 15 capitoli narrati da Dayana. Ascolta mentre cammini, cucini o ti riposi.",
    book_bundle_name: "Bundle Completo",
    book_bundle_desc: "Libro Digitale + Audiolibro insieme. L'esperienza più completa al miglior prezzo.",
    buy_now: "Acquista ora",
    includes: "Include:",

    coaching_orient_name: "Sessione di Orientamento",
    coaching_orient_duration: "30 minuti",
    coaching_orient_desc: "Non sai da dove iniziare? Questa sessione iniziale ti aiuta a identificare i tuoi blocchi e tracciare un percorso chiaro.",
    coaching_orient_includes: ["Diagnosi iniziale personalizzata", "Piano d'azione in 3 passi", "Registrazione della sessione", "Follow-up WhatsApp 48h"],

    coaching_single_name: "Sessione Individuale",
    coaching_single_duration: "60 minuti",
    coaching_single_desc: "Una sessione approfondita per lavorare su un argomento specifico: autostima, relazioni, scopo o confini.",
    coaching_single_includes: ["Sessione di 60 min in videochiamata", "Esercizi personalizzati", "Registrazione della sessione", "Follow-up WhatsApp 72h"],

    coaching_pack_name: "Pacchetto 3 Sessioni",
    coaching_pack_duration: "3 × 60 minuti",
    coaching_pack_desc: "Per una vera trasformazione in poche settimane. Il pacchetto più richiesto.",
    coaching_pack_includes: ["3 sessioni di 60 min", "Piano di lavoro personalizzato", "Registrazioni di tutte le sessioni", "Supporto WhatsApp illimitato", "Risorse ed esercizi aggiuntivi"],

    coaching_monthly_name: "Programma Mensile",
    coaching_monthly_duration: "4 sessioni / mese",
    coaching_monthly_desc: "Accompagnamento intensivo per un mese intero. Per chi è pronta per un cambiamento profondo.",
    coaching_monthly_includes: ["4 sessioni di 60 min al mese", "Accesso prioritario a Dayana", "Registrazioni di tutte le sessioni", "Supporto WhatsApp illimitato", "Workbook mensile personalizzato", "Revisione degli obiettivi settimanali"],

    book_cta: "Acquista ora",
    coaching_cta: "Prenota ora",
    coaching_note: "Posti limitati ogni mese",

    workbook_name: "Workbook sull'Autostima",
    workbook_desc: "52 esercizi pratici per riconnettersi con il proprio valore, guarire il dialogo interiore e costruire una vera fiducia.",
    workbook_includes: ["52 esercizi passo dopo passo", "Journaling guidato", "Affermazioni personalizzate", "PDF scaricabile"],

    masterclass_name: "Masterclass: Il Tuo Potere Femminile",
    masterclass_desc: "3 ore di contenuto video in cui Dayana condivide i fondamenti del suo metodo di empowerment.",
    masterclass_includes: ["3 ore di video", "Materiale PDF complementare", "Accesso a vita", "Aggiornamenti inclusi"],

    digital_cta: "Ottieni l'accesso",

    // Subscriptions
    section_subs: "ABBONAMENTI",
    section_subs_sub: "Accesso continuo · Disdici quando vuoi",
    sub_badge: "ABBONAMENTO",
    sub_per_month: "/ mese",
    sub_cta: "Abbonati ora",
    sub_cancel: "Disdici quando vuoi",

    sub_club_name: "Club Códigos",
    sub_club_desc: "Accesso mensile a nuovi contenuti, una comunità privata e una chiamata di gruppo dal vivo con Dayana.",
    sub_club_includes: [
      "Nuovi contenuti digitali ogni mese (PDF, audio, video)",
      "Comunità privata di donne",
      "Chiamata di gruppo mensile dal vivo con Dayana",
      "Sconti esclusivi su prodotti e coaching",
      "Accesso all'archivio completo dei contenuti",
    ],

    sub_mentoring_name: "Mentoring Mensile",
    sub_mentoring_desc: "Accompagnamento intensivo mese per mese. Per le donne impegnate in una trasformazione continua.",
    sub_mentoring_includes: [
      "4 sessioni di coaching 1:1 al mese",
      "Supporto WhatsApp illimitato",
      "Piano di lavoro mensile personalizzato",
      "Registrazioni di tutte le sessioni",
      "Accesso completo al Club Códigos incluso",
      "Priorità nell'agenda di Dayana",
    ],

    footer_blog: "Blog",
    footer_priv: "Privacy",
    footer_terms: "Termini",
    footer_refund: "Rimborsi",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    guarantee_title: "GARANZIA 7 GIORNI",
    guarantee_desc: "Tutti i prodotti digitali hanno una garanzia di rimborso di 7 giorni. Se non ti piace, rimborsamo il 100%.",

    original: "Prezzo normale",
    you_save: "Risparmi",
  },
  pt: {
    lang_toggle: "ES",
    nav_brand: "CÓDIGOS",
    nav_sub: "Empoderamento Feminino",
    back_home: "← Início",

    hero_eyebrow: "LOJA COMPLETA",
    hero_title: "Tudo que você precisa\npara sua transformação",
    hero_sub: "Livros, sessões de coaching e recursos digitais — todos com 40% de desconto de lançamento.",

    badge_discount: "40% OFF",
    badge_popular: "MAIS POPULAR",
    badge_new: "NOVO",

    section_books: "LIVROS",
    section_books_sub: "Acesso imediato em PDF, ePub e MP3",
    section_coaching: "SESSÕES DE COACHING",
    section_coaching_sub: "Sessões 1 a 1 com Dayana Guerrero — reserve seu lugar agora",
    section_digital: "RECURSOS DIGITAIS",
    section_digital_sub: "Workbooks, guias e masterclasses para trabalhar no seu ritmo",

    book_ebook_name: "Livro Digital",
    book_ebook_desc: "Todos os 15 capítulos em PDF + ePub. Leia em qualquer dispositivo, a qualquer hora.",
    book_audio_name: "Audiolivro",
    book_audio_desc: "Todos os 15 capítulos narrados por Dayana. Ouça enquanto caminha, cozinha ou descansa.",
    book_bundle_name: "Bundle Completo",
    book_bundle_desc: "Livro Digital + Audiolivro juntos. A experiência mais completa pelo melhor preço.",
    buy_now: "Comprar agora",
    includes: "Inclui:",

    coaching_orient_name: "Sessão de Orientação",
    coaching_orient_duration: "30 minutos",
    coaching_orient_desc: "Não sabe por onde começar? Esta sessão inicial te ajuda a identificar seus bloqueios e traçar um caminho claro.",
    coaching_orient_includes: ["Diagnóstico inicial personalizado", "Plano de ação em 3 passos", "Gravação da sessão", "Acompanhamento WhatsApp 48h"],

    coaching_single_name: "Sessão Individual",
    coaching_single_duration: "60 minutos",
    coaching_single_desc: "Uma sessão profunda para trabalhar um tema específico: autoestima, relacionamentos, propósito ou limites.",
    coaching_single_includes: ["Sessão de 60 min por videochamada", "Exercícios personalizados", "Gravação da sessão", "Acompanhamento WhatsApp 72h"],

    coaching_pack_name: "Pacote 3 Sessões",
    coaching_pack_duration: "3 × 60 minutos",
    coaching_pack_desc: "Para trabalhar uma transformação real em poucas semanas. O pacote mais solicitado.",
    coaching_pack_includes: ["3 sessões de 60 min", "Plano de trabalho personalizado", "Gravações de todas as sessões", "Suporte WhatsApp ilimitado", "Recursos e exercícios adicionais"],

    coaching_monthly_name: "Programa Mensal",
    coaching_monthly_duration: "4 sessões / mês",
    coaching_monthly_desc: "Acompanhamento intensivo durante um mês completo. Para quem está pronta para uma mudança profunda.",
    coaching_monthly_includes: ["4 sessões de 60 min por mês", "Acesso prioritário à Dayana", "Gravações de todas as sessões", "Suporte WhatsApp ilimitado", "Workbook mensal personalizado", "Revisão de metas semanais"],

    book_cta: "Comprar agora",
    coaching_cta: "Reservar agora",
    coaching_note: "Vagas limitadas por mês",

    workbook_name: "Workbook de Autoestima",
    workbook_desc: "52 exercícios práticos para reconectar com seu valor, curar seu diálogo interno e construir confiança real.",
    workbook_includes: ["52 exercícios passo a passo", "Journaling guiado", "Afirmações personalizadas", "PDF para download"],

    masterclass_name: "Masterclass: Seu Poder Feminino",
    masterclass_desc: "3 horas de conteúdo em vídeo onde Dayana compartilha os fundamentos do seu método de empoderamento.",
    masterclass_includes: ["3 horas de vídeo", "Material complementar em PDF", "Acesso vitalício", "Atualizações incluídas"],

    digital_cta: "Obter acesso",

    section_subs: "ASSINATURAS",
    section_subs_sub: "Acesso contínuo · Cancele quando quiser",
    sub_badge: "ASSINATURA",
    sub_per_month: "/ mês",
    sub_cta: "Assinar agora",
    sub_cancel: "Cancele quando quiser",

    sub_club_name: "Clube Códigos",
    sub_club_desc: "Acesso mensal a conteúdo novo, comunidade privada e chamada em grupo ao vivo com Dayana.",
    sub_club_includes: [
      "Novo conteúdo digital todo mês (PDF, áudio, vídeo)",
      "Comunidade privada de mulheres",
      "Chamada em grupo mensal ao vivo com Dayana",
      "Descontos exclusivos em produtos e coaching",
      "Acesso ao arquivo completo de conteúdo",
    ],

    sub_mentoring_name: "Mentoring Mensal",
    sub_mentoring_desc: "Acompanhamento intensivo mês a mês. Para mulheres comprometidas com sua transformação contínua.",
    sub_mentoring_includes: [
      "4 sessões de coaching 1:1 por mês",
      "Suporte ilimitado por WhatsApp",
      "Plano de trabalho personalizado mensal",
      "Gravações de todas as sessões",
      "Acesso completo ao Clube Códigos incluído",
      "Prioridade na agenda de Dayana",
    ],

    footer_blog: "Blog",
    footer_priv: "Privacidade",
    footer_terms: "Termos",
    footer_refund: "Reembolsos",
    footer: "© 2026 Códigos de Mujeres · Dayana Guerrero.",

    guarantee_title: "GARANTIA DE 7 DIAS",
    guarantee_desc: "Todos os produtos digitais têm garantia de devolução de 7 dias. Se não amar, devolvemos 100%.",

    original: "Preço normal",
    you_save: "Você economiza",
  },
} as const;

type Lang = keyof typeof T;

// ─── Pricing ──────────────────────────────────────────────────────────────────
// 40% launch discount across all products

const PRODUCTS = {
  books: {
    ebook:  { price: 5.99,   original: 9.99,   format: "ebook"  as const },
    audio:  { price: 5.99,   original: 9.99,   format: "audio"  as const },
    bundle: { price: 10.99,  original: 19.98,  format: "bundle" as const },
  },
  coaching: {
    orient:  { price: 29.99,  original: 49.99  },
    single:  { price: 59.99,  original: 99.99  },
    pack:    { price: 149.99, original: 249.99 },
    monthly: { price: 199.99, original: 329.99 },
  },
  digital: {
    workbook:   { price: 7.99,  original: 12.99 },
    masterclass:{ price: 19.99, original: 34.99 },
  },
  subscriptions: {
    club:      { price: 9.99,   original: 16.99  },
    mentoring: { price: 179.99, original: 299.99 },
  },
} as const;

function discountPct(price: number, original: number) {
  return Math.round((1 - price / original) * 100);
}
function fmt(n: number) { return `$${n.toFixed(2)}`; }

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  eyebrow: { fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800 as const, letterSpacing: "0.16em", textTransform: "uppercase" as const },
  heading: { fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 as const, letterSpacing: "0", fontVariationSettings: "'opsz' 144" },
  body:    { fontFamily: "'Nunito', sans-serif", lineHeight: 1.7 },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function PriceBadge({ price, original, label }: { price: number; original: number; label: string }) {
  const pct = discountPct(price, original);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span style={{ fontSize: 28, fontWeight: 800, color: C.burgundy, fontFamily: "'Fraunces', Georgia, serif" }}>{fmt(price)}</span>
      <span style={{ fontSize: 15, color: C.muted, textDecoration: "line-through" }}>{fmt(original)}</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.pureWhite, backgroundColor: C.crimson, borderRadius: 4, padding: "2px 8px" }}>
        -{pct}% {label}
      </span>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.secondary, lineHeight: 1.5, fontFamily: "'Nunito', sans-serif" }}>
      <span style={{ color: C.crimson, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
      {text}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Products() {
  usePageMeta("Productos — Códigos de Mujeres | Dayana Guerrero");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = searchParams.get("lang");
  const [lang, setLang] = useState<Lang>(initLang === "it" ? "it" : initLang === "en" ? "en" : initLang === "pt" ? "pt" : "es");
  const t = T[lang];

  const whatsappUrl = `https://wa.me/${site.social.whatsapp}`;
  const whatsappCoaching = (product: string) =>
    `https://wa.me/${site.social.whatsapp}?text=${encodeURIComponent(`Hola Dayana! Me interesa el producto: ${product}`)}`;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <SEOHead
        title={`Productos — ${site.name}`}
        description="Libros, sesiones de coaching 1:1 y recursos digitales de Dayana Guerrero para tu transformación personal."
        url={`https://${site.domain}/productos`}
        lang={lang}
      />

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .nav-link { font-size: 12px; color: rgba(255,255,255,0.7); text-decoration: none;
          letter-spacing: 0.04em; padding: 8px 12px; border-radius: 4px;
          transition: color 0.15s, background 0.15s; white-space: nowrap; min-height: 36px;
          display: inline-flex; align-items: center; }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
        .prod-card { background: ${C.pureWhite}; border: 1.5px solid ${C.pink}; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px; transition: border-color 0.2s, box-shadow 0.2s; position: relative; animation: fadeUp 0.4s ease both; }
        .prod-card:hover { border-color: ${C.crimson}; box-shadow: 0 4px 24px rgba(161,43,82,0.1); }
        .prod-card.featured { border-color: ${C.crimson}; border-width: 2px; }
        .products-grid { display: grid; gap: 20px; grid-template-columns: 1fr; }
        @media (min-width: 600px) { .products-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 900px) { .products-grid-3 { grid-template-columns: repeat(3, 1fr) !important; } .products-grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1100px) { .products-grid-4 { grid-template-columns: repeat(4, 1fr) !important; } }
        .section-pad { padding: 64px 24px; }
        @media (max-width: 600px) { .section-pad { padding: 48px 20px; } }
        .badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; border-radius: 4px; }
        .btn-primary { display: inline-flex; align-items: center; justify-content: center; background-color: #7A1C38; color: #FFF1F4; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.9375rem; letter-spacing: 0.02em; border: none; border-radius: 12px; padding: 14px 20px; cursor: pointer; box-shadow: 4px 4px 0 #E8557F; transition: transform 0.12s, box-shadow 0.12s; text-decoration: none; width: 100%; }
        .btn-primary:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 #E8557F; }
        .btn-outline { display: inline-flex; align-items: center; justify-content: center; background-color: transparent; color: #7A1C38; font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 0.875rem; letter-spacing: 0.04em; border: 2px solid #7A1C38; border-radius: 12px; padding: 12px 20px; cursor: pointer; transition: background-color 0.15s, color 0.15s; text-decoration: none; width: 100%; }
        .btn-outline:hover { background-color: #FFFFFF; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: C.burgundy }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52 }}>
          <a href={`/?lang=${lang}`} aria-label={t.nav_brand} style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <img src="/brand/codigos-horizontal-vino.svg" alt="Códigos — Empoderamiento Femenino" style={{ height: 34, width: "auto", display: "block" }} />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a href={`/?lang=${lang}`} className="nav-link">{t.back_home}</a>
            <span style={{ width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.15)", flexShrink: 0, margin: "0 4px" }} />
            <button
              onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : lang === "it" ? "pt" : "es")}
              className="nav-link"
              style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.6)", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
            >{t.lang_toggle}</button>
          </div>
        </div>
      </nav>

      {/* DISCOUNT BANNER */}
      <div style={{ backgroundColor: C.crimson, color: C.pureWhite, textAlign: "center", padding: "10px 16px", fontSize: 13, fontWeight: 600, letterSpacing: "0.03em", lineHeight: 1.4 }}>
        {lang === "es" && "🎉 Oferta de lanzamiento — 40% de descuento en toda la tienda"}
        {lang === "en" && "🎉 Launch offer — 40% off everything in the store"}
        {lang === "it" && "🎉 Offerta di lancio — 40% di sconto su tutto il negozio"}
        {lang === "pt" && "🎉 Oferta de lançamento — 40% de desconto em toda a loja"}
      </div>

      {/* HERO */}
      <section className="section-pad cd-trama" style={{ textAlign: "center" }}>
        <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 16 }}>{t.hero_eyebrow}</p>
        <h1 style={{ ...S.heading, fontSize: "clamp(1.8rem, 5vw, 2.8rem)", lineHeight: 1.15, color: C.burgundy, marginBottom: 16, whiteSpace: "pre-line" }}>{t.hero_title}</h1>
        <p style={{ ...S.body, fontSize: 15, color: C.secondary, maxWidth: 520, margin: "0 auto" }}>{t.hero_sub}</p>
      </section>

      {/* ═══ BOOKS ═══ */}
      <section className="section-pad" style={{ backgroundColor: C.pureWhite }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 8 }}>{t.section_books}</p>
          <p style={{ ...S.body, fontSize: 14, color: C.muted, marginBottom: 32 }}>{t.section_books_sub}</p>

          <div className="products-grid products-grid-3">
            {/* EBOOK */}
            <div className="prod-card">
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 8 }}>PDF + ePub</p>
                <h3 style={{ ...S.heading, fontSize: 20, color: C.burgundy, marginBottom: 8 }}>{t.book_ebook_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.book_ebook_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.books.ebook.price} original={PRODUCTS.books.ebook.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.books.ebook.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.books.ebook.original - PRODUCTS.books.ebook.price)}
              </p>
              <button className="btn-primary" onClick={() => navigate(`/checkout?format=ebook&lang=${lang}`)}>
                {t.book_cta}
              </button>
            </div>

            {/* AUDIO */}
            <div className="prod-card">
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 8 }}>MP3</p>
                <h3 style={{ ...S.heading, fontSize: 20, color: C.burgundy, marginBottom: 8 }}>{t.book_audio_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.book_audio_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.books.audio.price} original={PRODUCTS.books.audio.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.books.audio.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.books.audio.original - PRODUCTS.books.audio.price)}
              </p>
              <button className="btn-primary" onClick={() => navigate(`/checkout?format=audio&lang=${lang}`)}>
                {t.book_cta}
              </button>
            </div>

            {/* BUNDLE — featured */}
            <div className="prod-card featured">
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.crimson, color: C.pureWhite }}>{t.badge_popular}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 8 }}>PDF + ePub + MP3</p>
                <h3 style={{ ...S.heading, fontSize: 20, color: C.burgundy, marginBottom: 8 }}>{t.book_bundle_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.book_bundle_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.books.bundle.price} original={PRODUCTS.books.bundle.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.books.bundle.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.books.bundle.original - PRODUCTS.books.bundle.price)}
              </p>
              <button className="btn-primary" onClick={() => navigate(`/checkout?format=bundle&lang=${lang}`)}>
                {t.book_cta}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COACHING ═══ */}
      <section className="section-pad" style={{ backgroundColor: C.bg }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 8 }}>{t.section_coaching}</p>
          <p style={{ ...S.body, fontSize: 14, color: C.muted, marginBottom: 32 }}>{t.section_coaching_sub}</p>

          <div className="products-grid products-grid-4">
            {/* ORIENTATION */}
            <div className="prod-card" style={{ animationDelay: "0.05s" }}>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>{T[lang].coaching_orient_duration}</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.coaching_orient_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.coaching_orient_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.coaching.orient.price} original={PRODUCTS.coaching.orient.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.coaching.orient.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.coaching.orient.original - PRODUCTS.coaching.orient.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.coaching_orient_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <button className="btn-outline" onClick={() => navigate(`/checkout?format=coaching_orient&lang=${lang}`)}>
                {t.coaching_cta}
              </button>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.coaching_note}</p>
            </div>

            {/* SINGLE SESSION */}
            <div className="prod-card" style={{ animationDelay: "0.1s" }}>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>{T[lang].coaching_single_duration}</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.coaching_single_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.coaching_single_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.coaching.single.price} original={PRODUCTS.coaching.single.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.coaching.single.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.coaching.single.original - PRODUCTS.coaching.single.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.coaching_single_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <button className="btn-outline" onClick={() => navigate(`/checkout?format=coaching_single&lang=${lang}`)}>
                {t.coaching_cta}
              </button>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.coaching_note}</p>
            </div>

            {/* 3-SESSION PACK — featured */}
            <div className="prod-card featured" style={{ animationDelay: "0.15s" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.crimson, color: C.pureWhite }}>{t.badge_popular}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>{T[lang].coaching_pack_duration}</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.coaching_pack_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.coaching_pack_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.coaching.pack.price} original={PRODUCTS.coaching.pack.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.coaching.pack.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.coaching.pack.original - PRODUCTS.coaching.pack.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.coaching_pack_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <button className="btn-primary" onClick={() => navigate(`/checkout?format=coaching_pack&lang=${lang}`)}>
                {t.coaching_cta}
              </button>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.coaching_note}</p>
            </div>

            {/* MONTHLY */}
            <div className="prod-card" style={{ animationDelay: "0.2s" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.gold, color: C.pureWhite }}>{t.badge_new}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>{T[lang].coaching_monthly_duration}</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.coaching_monthly_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.coaching_monthly_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.coaching.monthly.price} original={PRODUCTS.coaching.monthly.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.coaching.monthly.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.coaching.monthly.original - PRODUCTS.coaching.monthly.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.coaching_monthly_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <button className="btn-outline" onClick={() => navigate(`/checkout?format=coaching_monthly&lang=${lang}`)}>
                {t.coaching_cta}
              </button>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.coaching_note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DIGITAL RESOURCES ═══ */}
      <section className="section-pad" style={{ backgroundColor: C.pureWhite }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 8 }}>{t.section_digital}</p>
          <p style={{ ...S.body, fontSize: 14, color: C.muted, marginBottom: 32 }}>{t.section_digital_sub}</p>

          <div className="products-grid products-grid-3" style={{ maxWidth: 700 }}>
            {/* WORKBOOK */}
            <div className="prod-card" style={{ animationDelay: "0.1s" }}>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>PDF · 52 {lang === "es" ? "ejercicios" : lang === "en" ? "exercises" : lang === "pt" ? "exercícios" : "esercizi"}</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.workbook_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.workbook_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.digital.workbook.price} original={PRODUCTS.digital.workbook.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.digital.workbook.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.digital.workbook.original - PRODUCTS.digital.workbook.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.workbook_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <a className="btn-outline" href={whatsappCoaching(t.workbook_name)} target="_blank" rel="noopener noreferrer">
                {t.digital_cta}
              </a>
            </div>

            {/* MASTERCLASS */}
            <div className="prod-card featured" style={{ animationDelay: "0.15s" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.gold, color: C.pureWhite }}>{t.badge_new}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>Video · 3h</p>
                <h3 style={{ ...S.heading, fontSize: 18, color: C.burgundy, marginBottom: 8 }}>{t.masterclass_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.masterclass_desc}</p>
              </div>
              <PriceBadge price={PRODUCTS.digital.masterclass.price} original={PRODUCTS.digital.masterclass.original} label={t.badge_discount} />
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.digital.masterclass.original)}</span>
                &nbsp;·&nbsp;{t.you_save} {fmt(PRODUCTS.digital.masterclass.original - PRODUCTS.digital.masterclass.price)}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.masterclass_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <a className="btn-primary" href={whatsappCoaching(t.masterclass_name)} target="_blank" rel="noopener noreferrer">
                {t.digital_cta}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SUBSCRIPTIONS ═══ */}
      <section className="section-pad" style={{ backgroundColor: C.bg }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ ...S.eyebrow, color: C.crimson, marginBottom: 8 }}>{t.section_subs}</p>
          <p style={{ ...S.body, fontSize: 14, color: C.muted, marginBottom: 32 }}>{t.section_subs_sub}</p>

          <div className="products-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", maxWidth: 700 }}>
            {/* CLUB */}
            <div className="prod-card" style={{ animationDelay: "0.05s" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.crimson, color: C.pureWhite }}>{t.sub_badge}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>Club Códigos</p>
                <h3 style={{ ...S.heading, fontSize: 20, color: C.burgundy, marginBottom: 8 }}>{t.sub_club_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.sub_club_desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: C.burgundy, fontFamily: "'Fraunces', Georgia, serif" }}>{fmt(PRODUCTS.subscriptions.club.price)}</span>
                <span style={{ fontSize: 14, color: C.muted }}>{t.sub_per_month}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.pureWhite, backgroundColor: C.crimson, borderRadius: 4, padding: "2px 8px", marginLeft: 6 }}>
                  -{discountPct(PRODUCTS.subscriptions.club.price, PRODUCTS.subscriptions.club.original)}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.subscriptions.club.original)}{t.sub_per_month}</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.sub_club_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <a className="btn-primary" href={whatsappCoaching(t.sub_club_name)} target="_blank" rel="noopener noreferrer">
                {t.sub_cta}
              </a>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.sub_cancel}</p>
            </div>

            {/* MENTORING SUBSCRIPTION — featured */}
            <div className="prod-card featured" style={{ animationDelay: "0.1s" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)" }}>
                <span className="badge" style={{ backgroundColor: C.gold, color: C.pureWhite }}>{t.badge_popular}</span>
              </div>
              <div>
                <p style={{ ...S.eyebrow, color: C.muted, marginBottom: 6 }}>VIP · 4 {lang === "es" ? "sesiones" : lang === "en" ? "sessions" : lang === "pt" ? "sessões" : "sessioni"}{t.sub_per_month}</p>
                <h3 style={{ ...S.heading, fontSize: 20, color: C.burgundy, marginBottom: 8 }}>{t.sub_mentoring_name}</h3>
                <p style={{ ...S.body, fontSize: 13, color: C.secondary }}>{t.sub_mentoring_desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: C.burgundy, fontFamily: "'Fraunces', Georgia, serif" }}>{fmt(PRODUCTS.subscriptions.mentoring.price)}</span>
                <span style={{ fontSize: 14, color: C.muted }}>{t.sub_per_month}</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: C.pureWhite, backgroundColor: C.crimson, borderRadius: 4, padding: "2px 8px", marginLeft: 6 }}>
                  -{discountPct(PRODUCTS.subscriptions.mentoring.price, PRODUCTS.subscriptions.mentoring.original)}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>
                {t.original}: <span style={{ textDecoration: "line-through" }}>{fmt(PRODUCTS.subscriptions.mentoring.original)}{t.sub_per_month}</span>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {t.sub_mentoring_includes.map(item => <CheckItem key={item} text={item} />)}
              </ul>
              <a className="btn-primary" href={whatsappCoaching(t.sub_mentoring_name)} target="_blank" rel="noopener noreferrer">
                {t.sub_cta}
              </a>
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Nunito', sans-serif" }}>{t.sub_cancel}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GUARANTEE ═══ */}
      <section className="section-pad" style={{ backgroundColor: C.bg, textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 36 }}>🛡️</span>
          <p style={{ ...S.eyebrow, color: C.crimson }}>{t.guarantee_title}</p>
          <p style={{ ...S.body, fontSize: 14, color: C.secondary }}>{t.guarantee_desc}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: C.burgundy, padding: "32px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: t.footer_blog, href: `/blog?lang=${lang}` },
            { label: t.footer_priv, href: `/privacidad?lang=${lang}` },
            { label: t.footer_terms, href: `/terminos?lang=${lang}` },
            { label: t.footer_refund, href: `/reembolso?lang=${lang}` },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textDecoration: "none", letterSpacing: "0.04em" }}>{l.label}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'Nunito', sans-serif" }}>{t.footer}</p>
      </footer>
    </div>
  );
}
