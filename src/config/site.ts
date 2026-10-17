// ─── Site Configuration ──────────────────────────────────────────────────────
// Edit this file to rebrand the store for a new product.
// All project-specific values live here — colors, fonts, product, social links.

export const site = {
  name: "Códigos de Mujeres",
  domain: "codigosdemujeres.com",
  author: {
    name: "Dayana Guerrero",
    title_es: "Escritora y coach de empoderamiento femenino",
    title_en: "Writer and feminine empowerment coach",
    title_it: "Scrittrice e coach di empowerment femminile",
    title_pt: "Escritora e coach de empoderamento feminino",
    bio_es: "Escritora y coach de empoderamiento femenino con más de cuatro años acompañando a mujeres a descubrir su valor, sanar sus relaciones y vivir con propósito.",
    bio_en: "Writer and feminine empowerment coach with over four years helping women discover their worth, heal their relationships, and live with purpose.",
    bio_it: "Scrittrice e coach di empowerment femminile con oltre quattro anni di esperienza nell'accompagnare le donne a scoprire il proprio valore, guarire le proprie relazioni e vivere con uno scopo.",
    bio_pt: "Escritora e coach de empoderamento feminino com mais de quatro anos acompanhando mulheres a descobrir seu valor, curar seus relacionamentos e viver com propósito.",
  },

  product: {
    title_es: "Códigos que toda mujer necesita saber",
    title_en: "Codes every woman needs to know",
    title_it: "I codici che ogni donna deve conoscere",
    title_pt: "Códigos que toda mulher precisa saber",
    tagline_es: "Descubre tu poder, rompe patrones y transforma tu vida.",
    tagline_en: "Discover your power, break patterns and transform your life.",
    tagline_it: "Scopri il tuo potere, rompi gli schemi e trasforma la tua vita.",
    tagline_pt: "Descubra seu poder, quebre padrões e transforme sua vida.",
    formats: {
      ebook:  { price: 5.99,  originalPrice: 9.99,  label_es: "Libro (PDF + ePub)",       label_en: "Book (PDF + ePub)",        label_it: "Libro (PDF + ePub)",        label_pt: "Livro (PDF + ePub)" },
      audio:  { price: 5.99,  originalPrice: 9.99,  label_es: "Audio (MP3)",               label_en: "Audio (MP3)",               label_it: "Audiolibro (MP3)",           label_pt: "Audiolivro (MP3)" },
      bundle: { price: 10.99, originalPrice: 19.98, label_es: "Bundle (Libro + Audio)",    label_en: "Bundle (Book + Audio)",    label_it: "Bundle (Libro + Audiolibro)", label_pt: "Bundle (Livro + Áudio)" },
    },
  },

  // Paleta del sistema de diseño Códigos (tokens.json)
  colors: {
    bg:           "#FFF1F4",               // rubor
    surface:      "#F6C6D3",               // rosa-palido
    border:       "#F1DCE2",               // borde
    crimson:      "#A12B52",               // frambuesa — antetítulos, enlaces, acentos
    crimsonHv:    "#7A1C38",               // vino
    crimsonBg:    "rgba(161,43,82,0.08)",
    crimsonMuted: "rgba(161,43,82,0.12)",
    white:        "#4E0F22",               // tinta — texto principal
    secondary:    "#7A4A58",               // texto-suave
    muted:        "#7A4A58",               // texto-suave
    gold:         "#7A1C38",               // vino
    pureWhite:    "#FFFFFF",               // blanco
    pink:         "#F6C6D3",               // rosa-palido
    pinkLight:    "#FFF1F4",               // rubor
    burgundy:     "#7A1C38",               // vino — color de la marca
    darkBurg:     "#4E0F22",               // tinta
    rosa:         "#E8557F",               // rosa — sombra dura del logotipo
    oro:          "#C9A86A",               // oro — solo decorativo
    success:      "#5A9E6F",
    error:        "#C44D4D",
    warn:         "#C4983D",
  },

  fonts: {
    heading:      "'Fraunces', Georgia, serif",
    body:         "'Nunito', sans-serif",
    googleImport: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600..800&family=Nunito:wght@600..900&display=swap",
  },

  social: {
    whatsapp:  "573000000000",
    instagram: "@codigosdemujeres",
    facebook:  "codigosdemujeres",
  },

  analytics: {
    facebookPixelId: "",
  },
} as const;

// ─── All products catalog (books + coaching + digital) ────────────────────────
export type ProductKey =
  | "ebook" | "audio" | "bundle"
  | "coaching_orient" | "coaching_single" | "coaching_pack" | "coaching_monthly"
  | "workbook" | "masterclass";

export type ProductType = "book" | "coaching" | "digital";

export const allProducts: Record<ProductKey, {
  price: number; original: number; type: ProductType;
  label_es: string; label_en: string; label_it: string; label_pt: string;
}> = {
  ebook:            { price: 5.99,   original: 9.99,   type: "book",     label_es: "Libro Digital (PDF + ePub)",         label_en: "Digital Book (PDF + ePub)",          label_it: "Libro Digitale (PDF + ePub)",          label_pt: "Livro Digital (PDF + ePub)" },
  audio:            { price: 5.99,   original: 9.99,   type: "book",     label_es: "Audiolibro (MP3)",                   label_en: "Audiobook (MP3)",                    label_it: "Audiolibro (MP3)",                     label_pt: "Audiolivro (MP3)" },
  bundle:           { price: 10.99,  original: 19.98,  type: "book",     label_es: "Bundle (Libro + Audiolibro)",        label_en: "Bundle (Book + Audiobook)",          label_it: "Bundle (Libro + Audiolibro)",          label_pt: "Bundle (Livro + Audiolivro)" },
  coaching_orient:  { price: 29.99,  original: 49.99,  type: "coaching", label_es: "Sesión de Orientación — 30 min",     label_en: "Orientation Session — 30 min",       label_it: "Sessione di Orientamento — 30 min",    label_pt: "Sessão de Orientação — 30 min" },
  coaching_single:  { price: 59.99,  original: 99.99,  type: "coaching", label_es: "Sesión Individual — 60 min",         label_en: "Individual Session — 60 min",        label_it: "Sessione Individuale — 60 min",        label_pt: "Sessão Individual — 60 min" },
  coaching_pack:    { price: 149.99, original: 249.99, type: "coaching", label_es: "Paquete 3 Sesiones",                 label_en: "3-Session Package",                  label_it: "Pacchetto 3 Sessioni",                 label_pt: "Pacote 3 Sessões" },
  coaching_monthly: { price: 199.99, original: 329.99, type: "coaching", label_es: "Programa Mensual (4 sesiones/mes)",  label_en: "Monthly Program (4 sessions/mo)",    label_it: "Programma Mensile (4 sessioni/mese)",  label_pt: "Programa Mensal (4 sessões/mês)" },
  workbook:         { price: 7.99,   original: 12.99,  type: "digital",  label_es: "Workbook de Autoestima (PDF)",       label_en: "Self-Esteem Workbook (PDF)",         label_it: "Workbook sull'Autostima (PDF)",        label_pt: "Workbook de Autoestima (PDF)" },
  masterclass:      { price: 19.99,  original: 34.99,  type: "digital",  label_es: "Masterclass: Tu Poder Femenino",     label_en: "Masterclass: Your Feminine Power",   label_it: "Masterclass: Il Tuo Potere Femminile", label_pt: "Masterclass: Seu Poder Feminino" },
};

/** Convenience aliases */
export const colors  = site.colors;
export const fonts   = site.fonts;
export const product = site.product;

/** Format a numeric price as "$XX.XX" */
export function fmtPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** Get the display price string for a format key */
export function formatPrice(fmt: keyof typeof site.product.formats): string {
  return fmtPrice(site.product.formats[fmt].price);
}

/** Get the original (pre-discount) display price string for a format key */
export function formatOriginalPrice(fmt: keyof typeof site.product.formats): string {
  return fmtPrice(site.product.formats[fmt].originalPrice);
}

/** Get the label for a format in the given language */
export function formatLabel(fmt: keyof typeof site.product.formats, lang: "es" | "en" | "it" | "pt"): string {
  const f = site.product.formats[fmt];
  if (lang === "en") return f.label_en;
  if (lang === "it") return f.label_it;
  if (lang === "pt") return f.label_pt;
  return f.label_es;
}
