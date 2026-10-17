import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";

const C = {
  bg: "#FBF7F1", surface: "#F3EBE0", border: "#D9C9B0",
  crimson: "#C2506A", white: "#3D2B1F", secondary: "#7A6652", muted: "#A89882",
};

type Post = {
  id: string;
  slug: string;
  title_es: string; title_en: string; title_it: string;
  excerpt_es: string; excerpt_en: string; excerpt_it: string;
  image_url: string | null;
  read_min: number;
  published_at: string | null;
  post_type: "article" | "social";
  hashtags: string;
};

type Tab = "articles" | "social";

export default function Blog() {
  usePageMeta("Blog | CÓDIGOS");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initLang = searchParams.get("lang");
  const [lang, setLang] = useState<"es" | "en" | "it">(
    initLang === "it" ? "it" : initLang === "en" ? "en" : "es"
  );
  const [tab, setTab]         = useState<Tab>("articles");
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    setLoading(true);
    const typeParam = tab === "social" ? "?type=social" : "?type=article";
    fetch(`/api/blog/posts${typeParam}`)
      .then(r => r.json())
      .then(d => setPosts(d.posts ?? []))
      .catch(() => setError(lang === "it" ? "Impossibile caricare gli articoli." : lang === "es" ? "No se pudieron cargar los artículos." : "Could not load articles."))
      .finally(() => setLoading(false));
  }, [tab]);

  function fmtDate(iso: string | null) {
    if (!iso) return "";
    const locale = lang === "it" ? "it-IT" : lang === "es" ? "es-419" : "en-US";
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric", month: "long", day: "numeric",
    });
  }

  const labels = {
    es: { title: "Blog", back: "← Inicio", readMin: "min de lectura", buy: "Comprar el libro", empty: "Próximos artículos.", articles: "Artículos", social: "Social", read: "Leer →" },
    en: { title: "Blog", back: "← Home",  readMin: "min read",       buy: "Buy the book",   empty: "Articles coming soon.", articles: "Articles", social: "Social", read: "Read →" },
    it: { title: "Blog", back: "← Home",  readMin: "min di lettura", buy: "Acquista il libro", empty: "Articoli in arrivo.", articles: "Articoli", social: "Social", read: "Leggi →" },
  };
  const l = labels[lang];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", backgroundColor: C.bg, borderBottom: `1px solid ${C.surface}` }}>
        <button onClick={() => navigate("/")} style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em", color: C.white, background: "none", border: "none", cursor: "pointer" }}>
          Códigos
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{ fontSize: 12, color: C.secondary, background: "none", border: "none", cursor: "pointer" }}>{l.back}</button>
          <button onClick={() => setLang(lang === "es" ? "en" : lang === "en" ? "it" : "es")} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>
            {lang === "es" ? "EN" : lang === "en" ? "IT" : "ES"}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 24px" }}>
        <p className="section-eyebrow" style={{ marginBottom: 8 }}>Dayana Guerrero</p>
        <h1 style={{ fontSize: "clamp(2rem,8vw,3rem)", color: C.white, marginBottom: 4 }}>{l.title}</h1>
        <div style={{ height: 2, width: 40, backgroundColor: C.crimson, marginTop: 12 }} />

        {/* Tab toggle */}
        <div style={{ display: "flex", gap: 0, marginTop: 24, borderBottom: `1px solid ${C.border}` }}>
          {(["articles", "social"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 20px", fontSize: 13, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? C.crimson : C.muted,
              borderBottom: tab === t ? `2px solid ${C.crimson}` : "2px solid transparent",
              background: "none", border: "none", borderBottomWidth: 2, borderBottomStyle: "solid",
              borderBottomColor: tab === t ? C.crimson : "transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {t === "articles" ? l.articles : l.social}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 80px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 28, height: 28, border: "3px solid #D9C9B0", borderTopColor: C.crimson, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}

        {error && <p style={{ color: C.muted, textAlign: "center", paddingTop: 60 }}>{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p style={{ color: C.muted, textAlign: "center", paddingTop: 60 }}>{l.empty}</p>
        )}

        {/* Articles list */}
        {tab === "articles" && posts.map(post => {
          const title   = lang === "it" ? post.title_it   || post.title_en   || post.title_es
                        : lang === "en" ? post.title_en   || post.title_es
                        : post.title_es;
          const excerpt = lang === "it" ? post.excerpt_it || post.excerpt_en || post.excerpt_es
                        : lang === "en" ? post.excerpt_en || post.excerpt_es
                        : post.excerpt_es;
          return (
            <article
              key={post.id}
              onClick={() => navigate(`/blog/${post.slug}?lang=${lang}`)}
              style={{ borderBottom: `1px solid ${C.border}`, padding: "28px 0", cursor: "pointer" }}
            >
              {post.image_url && (
                <div style={{ width: "100%", height: "clamp(180px, 30vw, 260px)", overflow: "hidden", marginBottom: 16, borderRadius: 8 }}>
                  <img src={post.image_url} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                {post.published_at && <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(post.published_at)}</span>}
                {post.published_at && <span style={{ fontSize: 11, color: C.border }}>·</span>}
                <span style={{ fontSize: 11, color: C.muted }}>{post.read_min} {l.readMin}</span>
              </div>
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.1rem,4vw,1.4rem)", fontWeight: 700, letterSpacing: "0.01em", color: C.white, marginBottom: 10, transition: "color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.crimson)}
                onMouseLeave={e => (e.currentTarget.style.color = C.white)}
              >
                {title}
              </h2>
              {excerpt && <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.7 }}>{excerpt}</p>}
              <span style={{ display: "inline-block", marginTop: 14, fontSize: 12, color: C.crimson, fontWeight: 600, letterSpacing: "0.04em" }}>
                {l.read}
              </span>
            </article>
          );
        })}

        {/* Social posts grid */}
        {tab === "social" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, paddingTop: 20 }}>
            {posts.map(post => {
              const caption = lang === "it" ? post.excerpt_it || post.excerpt_en || post.excerpt_es || post.title_it || post.title_es
                            : lang === "en" ? post.excerpt_en || post.excerpt_es || post.title_en || post.title_es
                            : post.excerpt_es || post.title_es;
              return (
                <div
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.slug}?lang=${lang}`)}
                  style={{
                    position: "relative", borderRadius: 12, overflow: "hidden",
                    cursor: "pointer", aspectRatio: "1",
                    backgroundColor: C.surface,
                  }}
                >
                  {post.image_url ? (
                    <img src={post.image_url} alt={caption} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                      <p style={{ fontSize: 13, color: C.secondary, textAlign: "center", lineHeight: 1.5 }}>{caption}</p>
                    </div>
                  )}
                  {post.image_url && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                      padding: "24px 10px 10px",
                    }}>
                      <p style={{ fontSize: 11, color: "#fff", lineHeight: 1.4 }}>
                        {caption.length > 80 ? caption.slice(0, 80) + "…" : caption}
                      </p>
                    </div>
                  )}
                  {post.ig_post_id && (
                    <div style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 4, padding: "2px 6px" }}>
                      <span style={{ fontSize: 10, color: "#fff" }}>IG</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div style={{ borderTop: `1px solid ${C.border}`, padding: "32px 20px", textAlign: "center" }}>
        <button onClick={() => navigate("/")} className="btn-primary" style={{ maxWidth: 280, margin: "0 auto" }}>
          {l.buy}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
