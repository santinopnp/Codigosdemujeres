import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const C = {
  bg: "#FFF1F4", surface: "#F1DCE2", border: "#F1DCE2",
  crimson: "#A12B52", white: "#4E0F22", secondary: "#7A4A58", muted: "#7A4A58",
};

type Post = {
  id: string; slug: string;
  title_es: string; title_en: string; title_it: string;
  excerpt_es: string; excerpt_en: string; excerpt_it: string;
  body_es: string; body_en: string; body_it: string;
  image_url: string | null;
  read_min: number;
  published_at: string | null;
  post_type: "article" | "social";
  hashtags: string;
  ig_post_id: string | null;
};

// Blog body CSS for HTML content from admin
const articleBodyCSS = `
.article-body p { font-size: 15px; color: ${C.secondary}; line-height: 1.85; margin: 0 0 20px; }
.article-body h2 { font-family: 'Fraunces', Georgia, serif; font-size: 1.25rem; color: ${C.white}; margin: 32px 0 12px; letter-spacing: 0.01em; }
.article-body h3 { font-family: 'Fraunces', Georgia, serif; font-size: 1.1rem; color: ${C.white}; margin: 24px 0 8px; }
.article-body ul, .article-body ol { padding-left: 20px; margin: 0 0 20px; }
.article-body li { font-size: 15px; color: ${C.secondary}; line-height: 1.85; margin-bottom: 6px; }
.article-body em { font-style: italic; color: ${C.crimson}; }
.article-body strong { color: ${C.white}; font-weight: 600; }
.article-body blockquote { border-left: 3px solid ${C.crimson}; padding: 12px 20px; margin: 20px 0; font-style: italic; color: ${C.muted}; background: ${C.surface}; }
.article-body hr { border: none; border-top: 1px solid ${C.border}; margin: 28px 0; }
.article-body a { color: ${C.crimson}; text-decoration: underline; }
`;

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initLang = searchParams.get("lang");
  const [lang, setLang] = useState<"es" | "en" | "it">(
    initLang === "it" ? "it" : initLang === "en" ? "en" : "es"
  );
  const [post, setPost]     = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/blog/posts/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d?.post) setPost(d.post); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  function fmtDate(iso: string | null) {
    if (!iso) return "";
    const locale = lang === "it" ? "it-IT" : lang === "es" ? "es-419" : "en-US";
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "3px solid #F1DCE2", borderTopColor: C.crimson, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 48, color: C.border }}>404</span>
        <button onClick={() => navigate("/blog")} className="btn-primary" style={{ maxWidth: 200 }}>← Blog</button>
      </div>
    );
  }

  const title = lang === "it" ? post.title_it || post.title_en || post.title_es
              : lang === "en" ? post.title_en || post.title_es
              : post.title_es;
  const body  = lang === "it" ? post.body_it  || post.body_en  || post.body_es
              : lang === "en" ? post.body_en  || post.body_es
              : post.body_es;

  const navBar = (
    <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", backgroundColor: C.bg, borderBottom: `1px solid ${C.surface}` }}>
      <button onClick={() => navigate("/")} style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", color: C.white, background: "none", border: "none", cursor: "pointer" }}>Códigos</button>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => navigate("/blog")} style={{ fontSize: 12, color: C.secondary, background: "none", border: "none", cursor: "pointer" }}>← Blog</button>
        <button onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : "es")} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>
          {lang === "es" ? "EN" : lang === "en" ? "IT" : "ES"}
        </button>
      </div>
    </nav>
  );

  // Social post layout — full-bleed image + caption
  if (post.post_type === "social") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
        {navBar}
        {post.image_url && (
          <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
            <img src={post.image_url} alt={title} style={{ width: "100%", display: "block" }} />
          </div>
        )}
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px 80px" }}>
          {title && <h1 style={{ fontSize: 20, color: C.white, marginBottom: 12 }}>{title}</h1>}
          <style>{articleBodyCSS}</style>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />
          {post.hashtags && (
            <p style={{ fontSize: 13, color: C.crimson, marginTop: 16 }}>{post.hashtags}</p>
          )}
          {post.published_at && (
            <p style={{ fontSize: 11, color: C.muted, marginTop: 20 }}>{fmtDate(post.published_at)}</p>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      {navBar}

      {post.image_url && (
        <div style={{ width: "100%", maxHeight: 360, overflow: "hidden" }}>
          <img src={post.image_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* JSON-LD for blog post */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": title,
        "author": { "@type": "Person", "name": "Dayana Guerrero" },
        "datePublished": post.published_at,
        "image": post.image_url || undefined,
        "publisher": { "@type": "Organization", "name": "Códigos de Mujeres" },
        "mainEntityOfPage": `https://codigosdemujeres.com/blog/${post.slug}`,
      }) }} />

      <article style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          {post.published_at && <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(post.published_at)}</span>}
          {post.published_at && <span style={{ fontSize: 11, color: C.border }}>·</span>}
          <span style={{ fontSize: 11, color: C.muted }}>{post.read_min} {lang === "it" ? "min di lettura" : lang === "es" ? "min de lectura" : "min read"}</span>
        </div>

        <h1 style={{ fontSize: "clamp(1.6rem,6vw,2.4rem)", color: C.white, lineHeight: 1.15, marginBottom: 24 }}>{title}</h1>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36, paddingBottom: 28, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: C.surface, border: `2px solid ${C.crimson}`, backgroundImage: "url('/author-photo.jpg')", backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.white }}>Dayana Guerrero</p>
            <p style={{ fontSize: 11, color: C.muted }}>{lang === "it" ? "Autrice" : lang === "es" ? "Autora" : "Author"}</p>
          </div>
        </div>

        <style>{articleBodyCSS}</style>
        <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />

        <div style={{ marginTop: 48, padding: 24, backgroundColor: C.surface, borderLeft: `3px solid ${C.crimson}` }}>
          <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: "0.01em", marginBottom: 8 }}>
            {lang === "it" ? "Pronta per i codici?" : lang === "es" ? "¿Lista para los códigos?" : "Ready for the codes?"}
          </p>
          <p style={{ fontSize: 13, color: C.secondary, marginBottom: 16, lineHeight: 1.6 }}>
            {lang === "it" ? "Il libro completo: 15 capitoli, audiolibro incluso." : lang === "es" ? "El libro completo: 15 capítulos, audiolibro incluido." : "The full book: 15 chapters, audiobook included."}
          </p>
          <button onClick={() => navigate("/")} className="btn-primary" style={{ maxWidth: 220 }}>
            {lang === "it" ? "Scopri il libro →" : lang === "es" ? "Ver el libro →" : "See the book →"}
          </button>
        </div>
      </article>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
