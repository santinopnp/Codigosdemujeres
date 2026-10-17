import { useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  SEOHead – zero-dependency meta-tag manager for React               */
/*  Updates document.title, Open Graph, and Twitter Card tags.         */
/* ------------------------------------------------------------------ */

interface SEOHeadProps {
  /** Page title (also used for og:title / twitter:title) */
  title: string;
  /** Meta description */
  description?: string;
  /** Open Graph / Twitter share image URL (absolute) */
  image?: string;
  /** Canonical URL for this page */
  url?: string;
  /** OG type – defaults to "website" */
  type?: "website" | "article" | "product" | "book";
  /** HTML lang attribute – defaults to "es" */
  lang?: string;
}

const SITE_NAME = "Codigos de Mujeres";

/* ---- helpers ---- */

function setMeta(property: string, content: string): void {
  // Try property first (og:*), then name (twitter:*, description)
  let el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);

  if (!el) {
    el = document.createElement("meta");
    // OG tags use property; twitter and standard tags use name
    if (property.startsWith("og:")) {
      el.setAttribute("property", property);
    } else {
      el.setAttribute("name", property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(property: string): void {
  const el =
    document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`) ||
    document.querySelector<HTMLMetaElement>(`meta[name="${property}"]`);
  el?.remove();
}

function setCanonical(url: string): void {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function removeCanonical(): void {
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.remove();
}

/* ---- component ---- */

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  lang = "es",
}: SEOHeadProps) {
  useEffect(() => {
    /* -- lang -- */
    document.documentElement.setAttribute("lang", lang);

    /* -- title -- */
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;
    setMeta("og:title", fullTitle);
    setMeta("twitter:title", fullTitle);

    /* -- description -- */
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
      setMeta("twitter:description", description);
    } else {
      removeMeta("description");
      removeMeta("og:description");
      removeMeta("twitter:description");
    }

    /* -- image -- */
    if (image) {
      setMeta("og:image", image);
      setMeta("twitter:image", image);
      setMeta("twitter:card", "summary_large_image");
    } else {
      removeMeta("og:image");
      removeMeta("twitter:image");
      setMeta("twitter:card", "summary");
    }

    /* -- url / canonical -- */
    if (url) {
      setMeta("og:url", url);
      setCanonical(url);
    } else {
      removeMeta("og:url");
      removeCanonical();
    }

    /* -- type & site name -- */
    setMeta("og:type", type);
    setMeta("og:site_name", SITE_NAME);

    /* Cleanup on unmount – restore a neutral state */
    return () => {
      document.title = SITE_NAME;
      removeMeta("og:title");
      removeMeta("og:description");
      removeMeta("og:image");
      removeMeta("og:url");
      removeMeta("og:type");
      removeMeta("og:site_name");
      removeMeta("twitter:title");
      removeMeta("twitter:description");
      removeMeta("twitter:image");
      removeMeta("twitter:card");
      removeMeta("description");
      removeCanonical();
    };
  }, [title, description, image, url, type, lang]);

  return null;
}
