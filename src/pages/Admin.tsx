import React, { useState, useEffect, useCallback, useRef } from "react";

const C = {
  bg: "#FBF7F1", surface: "#F3EBE0", border: "#D9C9B0",
  crimson: "#C2506A", white: "#3D2B1F", secondary: "#7A6652", muted: "#A89882",
  success: "#5A9E6F", error: "#C44D4D", warn: "#C4983D", pureWhite: "#FFFFFF",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Order = {
  id: string; email: string; format: string; amount_usd: string;
  payment_method: string; payment_provider: string | null;
  status: string; paid_at: string | null; created_at: string; provider_ref: string | null;
};

type Post = {
  id: string; slug: string; title_es: string; title_en: string;
  excerpt_es: string; excerpt_en: string; body_es: string; body_en: string;
  image_url: string | null; read_min: number; published: boolean;
  published_at: string | null; fb_post_id: string | null; ig_post_id: string | null; li_post_id: string | null;
  post_type: "article" | "social"; hashtags: string;
};

type Testimonial = {
  id: string; author: string; location: string;
  text_es: string; text_en: string; stars: number; sort_order: number; active: boolean;
};

type Tab = "dashboard" | "orders" | "posts" | "testimonials" | "chats" | "biblioteca" | "credenciales" | "documentos" | "leads";

type Conversation = {
  id: string; channel: "web" | "whatsapp"; customer_id: string;
  customer_name: string | null; escalated: boolean;
  created_at: string; updated_at: string;
  message_count: number; last_message: string | null;
};

type ChatMessage = { role: "user" | "assistant" | "system"; content: string; created_at: string };

type DashboardData = {
  revenue: { today: number; week: number; month: number; total: number };
  ordersByDay: { date: string; count: number; revenue: number }[];
  ordersByFormat: { format: string; count: number; revenue: number }[];
  funnel: { total: number; pending: number; paid: number; failed: number; refunded: number };
  recentOrders: { id: string; email: string; format: string; amount_usd: string; status: string; created_at: string }[];
  leads: { total: number; byDay: { date: string; count: number }[] };
  posts: { total: number; published: number; social: number };
};

// ─── Easy Social Types ────────────────────────────────────────────────────────
type EasySocialTab = "easybot" | "calendario" | "campanas" | "metricas" | "conexiones";

type BotMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  contentType?: string;
  tone?: string;
  hashtags?: string;
  imageSuggestion?: string;
  mediaUrl?: string;
  timestamp: string;
};

type ScheduledPost = {
  id: string;
  title: string;
  content_preview: string;
  image_url: string | null;
  scheduled_at: string;
  publish_to_ig: boolean;
  publish_to_fb: boolean;
  publish_to_li: boolean;
  publish_to_blog: boolean;
  status: string;
};

type Campaign = {
  id: string;
  name: string;
  goal: string;
  status: "draft" | "active" | "completed" | "paused";
  start_date: string;
  end_date: string;
  platforms: string[];
  tone: string;
  post_count: number;
  posts?: CampaignPost[];
};

type CampaignPost = {
  id: string;
  day: number;
  content_type: string;
  content: string;
  hashtags: string;
  platform: string;
  status: "pending" | "accepted" | "published";
  scheduled_at: string | null;
};

type SocialMetrics = {
  total_reach: number;
  engagement_rate: number;
  posts_published: number;
  top_platform: string;
  top_posts: {
    id: string;
    content_preview: string;
    image_url: string | null;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    engagement_rate: number;
  }[];
  ai_analysis: {
    summary: string;
    recommendations: string[];
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-419", { dateStyle: "short", timeStyle: "short" });
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-419", { day: "numeric", month: "short" });
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: "2px 8px", fontSize: 10, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, border: `1px solid ${color}` }}>
      {label}
    </span>
  );
}

function PillBadge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      textTransform: "uppercase", color, backgroundColor: bg,
      borderRadius: 12, display: "inline-block", lineHeight: 1.4,
    }}>
      {label}
    </span>
  );
}

function Spinner() {
  return <div style={{ width: 24, height: 24, border: "3px solid #D9C9B0", borderTopColor: C.crimson, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onAuth }: { onAuth: (t: string) => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!token.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/store/admin/orders?limit=1", { headers: { "x-admin-token": token.trim() } });
      if (res.status === 401) { setError("Token invalido."); return; }
      onAuth(token.trim());
    } catch { setError("Sin conexion."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: "0.12em", color: C.white, marginBottom: 32 }}>CODIGOS · ADMIN</span>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <label className="field-label">Admin token</label>
        <input className="input" type="password" placeholder="••••••••" value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
        {error && <p style={{ fontSize: 12, color: C.error, marginTop: 8 }}>{error}</p>}
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={submit} disabled={loading}>
          {loading ? "Verificando…" : "Acceder"}
        </button>
      </div>
    </div>
  );
}

// ─── Orders panel ─────────────────────────────────────────────────────────────
function OrdersPanel({ token }: { token: string }) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [total, setTotal]     = useState(0);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/store/admin/orders?limit=200" : `/api/store/admin/orders?status=${filter}&limit=200`;
      const res = await fetch(url, { headers: { "x-admin-token": token } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setOrders(d.orders ?? []); setTotal(d.total ?? 0);
    } catch (err) {
      console.error("[admin] orders load error:", (err as Error).message);
    }
    setLoading(false);
  }, [filter, token]);

  useEffect(() => { load(); }, [load]);

  async function refund(id: string) {
    if (!confirm("¿Confirmar reembolso?")) return;
    setRefunding(id);
    await fetch(`/api/store/order/${id}/refund`, { method: "POST", headers: { "x-admin-token": token } });
    setRefunding(null); load();
  }

  const STATUS_COLOR: Record<string, string> = { pending: C.muted, paid: C.success, failed: C.error, refunded: C.secondary };

  const stats = { paid: orders.filter(o=>o.status==="paid").length, pending: orders.filter(o=>o.status==="pending").length, failed: orders.filter(o=>o.status==="failed").length };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[{ label: "Ingresos", value: `$${Number(total).toFixed(2)}`, color: C.crimson },
          { label: "Pagados",  value: String(stats.paid),    color: C.success },
          { label: "Pendientes",value: String(stats.pending), color: C.muted },
          { label: "Fallidos", value: String(stats.failed),  color: C.error }].map(s => (
          <div key={s.label} style={{ backgroundColor: C.surface, padding: "14px 18px", borderLeft: `3px solid ${s.color}` }}>
            <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["all","paid","pending","failed","refunded"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 12px", fontSize: 10, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", backgroundColor: filter === f ? C.crimson : "transparent", color: filter === f ? C.white : C.muted, border: `1px solid ${filter === f ? C.crimson : C.border}` }}>
            {f === "all" ? "Todos" : f}
          </button>
        ))}
        <button onClick={load} style={{ marginLeft: "auto", fontSize: 11, color: C.muted, background: "none", border: "none", cursor: "pointer" }}>↻ Refrescar</button>
      </div>

      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Fecha","Email","Formato","Monto","Metodo","Estado","Ref",""].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${C.surface}` }} onMouseEnter={e=>(e.currentTarget.style.backgroundColor=C.surface)} onMouseLeave={e=>(e.currentTarget.style.backgroundColor="transparent")}>
                  <td style={{ padding: "10px", color: C.muted, whiteSpace: "nowrap" }}>{fmt(o.created_at)}</td>
                  <td style={{ padding: "10px", color: C.secondary, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.email}</td>
                  <td style={{ padding: "10px", color: C.secondary, textTransform: "uppercase", fontWeight: 600 }}>{o.format}</td>
                  <td style={{ padding: "10px", color: C.white, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}>${o.amount_usd}</td>
                  <td style={{ padding: "10px", color: C.muted }}>{o.payment_provider ?? o.payment_method}</td>
                  <td style={{ padding: "10px" }}><Badge label={o.status} color={STATUS_COLOR[o.status] ?? C.muted} /></td>
                  <td style={{ padding: "10px", color: C.muted, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 10 }}>{o.provider_ref ?? "—"}</td>
                  <td style={{ padding: "10px" }}>
                    {o.status === "paid" && (
                      <button onClick={() => refund(o.id)} disabled={refunding === o.id} style={{ fontSize: 10, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.error, background: "none", border: `1px solid ${C.error}`, padding: "3px 8px", cursor: "pointer", opacity: refunding === o.id ? 0.5 : 1 }}>
                        {refunding === o.id ? "…" : "Reembolsar"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <p style={{ color: C.muted, textAlign: "center", padding: 40 }}>Sin pedidos.</p>}
        </div>
      )}
    </div>
  );
}

// ─── Easy Social Panel ───────────────────────────────────────────────────────
function EasySocialPanel({ token }: { token: string }) {
  const [subTab, setSubTab] = useState<EasySocialTab>("easybot");

  const subTabs: { id: EasySocialTab; label: string; icon: string }[] = [
    { id: "easybot",    label: "Easy Bot",    icon: "🤖" },
    { id: "calendario", label: "Calendario",  icon: "📅" },
    { id: "campanas",   label: "Campanas",    icon: "🚀" },
    { id: "metricas",   label: "Metricas",    icon: "📊" },
    { id: "conexiones", label: "Conexiones",  icon: "🔗" },
  ];

  return (
    <div>
      {/* Header branding */}
      <div style={{
        background: `linear-gradient(135deg, ${C.crimson}18, ${C.crimson}08)`,
        borderLeft: `3px solid ${C.crimson}`,
        padding: "16px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: `linear-gradient(135deg, ${C.crimson}, #D4708A)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, boxShadow: `0 4px 12px ${C.crimson}40`,
        }}>
          🤖
        </div>
        <div>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700,
            color: C.white, letterSpacing: "0.06em",
          }}>
            Easy Social Media
          </p>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: "0.04em" }}>
            Asistente de Redes Sociales Easy Bot®
          </p>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div style={{
        display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`,
        marginBottom: 24, overflowX: "auto",
      }}>
        {subTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            style={{
              padding: "12px 20px", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.04em", background: "none", border: "none",
              cursor: "pointer", whiteSpace: "nowrap",
              color: subTab === t.id ? C.crimson : C.muted,
              borderBottom: `2px solid ${subTab === t.id ? C.crimson : "transparent"}`,
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "easybot"    && <EasyBotSubTab token={token} />}
      {subTab === "calendario" && <CalendarioSubTab token={token} />}
      {subTab === "campanas"   && <CampanasSubTab token={token} />}
      {subTab === "metricas"   && <MetricasSubTab token={token} />}
      {subTab === "conexiones" && <ConexionesSubTab token={token} />}
    </div>
  );
}

// ─── Sub-tab: Conexiones — Meta OAuth & connection status ────────────────────
type MetaStatus = {
  connected: boolean;
  pageId?: string;
  pageName?: string;
  igConnected?: boolean;
  source?: string;
  updatedAt?: string | null;
};

function ConexionesSubTab({ token }: { token: string }) {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meta/status", { headers: { "x-admin-token": token } });
      const d = await res.json();
      setStatus(d);
    } catch { setStatus({ connected: false }); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Listen for postMessage from OAuth popup
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data === "meta_connected") {
        setConnecting(false);
        setMsg({ text: "Facebook conectado exitosamente.", ok: true });
        loadStatus();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [loadStatus]);

  function openConnectPopup() {
    setConnecting(true);
    setMsg(null);
    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(
      `/api/admin/meta/connect?t=${encodeURIComponent(token)}`,
      "meta_oauth",
      `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`,
    );
    // Fallback: if popup closed without postMessage (e.g. user closed it)
    const poll = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(poll);
        setConnecting(false);
        loadStatus();
      }
    }, 800);
  }

  async function disconnect() {
    if (!confirm("¿Desconectar Facebook e Instagram?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/admin/meta/disconnect", { method: "DELETE", headers: { "x-admin-token": token } });
      if (res.ok) { setMsg({ text: "Desconectado.", ok: true }); loadStatus(); }
      else setMsg({ text: "Error al desconectar.", ok: false });
    } catch { setMsg({ text: "Error de red.", ok: false }); }
    setDisconnecting(false);
  }

  const platCard = (
    icon: string, name: string, color: string, connected: boolean, detail: string
  ) => (
    <div style={{
      backgroundColor: C.pureWhite, borderRadius: 12, padding: "20px 22px",
      border: `1px solid ${connected ? color + "60" : C.border}`,
      boxShadow: connected ? `0 0 0 1px ${color}30, 0 4px 16px ${color}10` : "0 2px 8px rgba(0,0,0,0.04)",
      display: "flex", alignItems: "center", gap: 16, position: "relative",
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.white, marginBottom: 4 }}>{name}</p>
        <p style={{ fontSize: 11, color: connected ? C.success : C.muted }}>{detail}</p>
      </div>
      <PillBadge
        label={connected ? "Conectado" : "Sin conectar"}
        bg={connected ? C.success + "18" : C.border + "60"}
        color={connected ? C.success : C.muted}
      />
    </div>
  );

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 17, fontWeight: 700, color: C.white, marginBottom: 6,
        }}>
          Cuentas de Redes Sociales
        </p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
          Conecta tu pagina de Facebook para publicar contenido en Facebook e Instagram desde el panel de administracion.
        </p>
      </div>

      {/* Feedback message */}
      {msg && (
        <div style={{
          padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 13,
          backgroundColor: msg.ok ? C.success + "15" : C.error + "15",
          color: msg.ok ? C.success : C.error,
          border: `1px solid ${msg.ok ? C.success + "40" : C.error + "40"}`,
        }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Platform cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {platCard(
          "📘", "Facebook",
          "#1877F2",
          !!status?.connected,
          status?.connected
            ? `Pagina: ${status.pageName ?? status.pageId} • Conectado ${status.updatedAt ? fmt(status.updatedAt) : ""}`
            : "Publica posts de texto e imagen en tu pagina de Facebook",
        )}
        {platCard(
          "📸", "Instagram Business",
          "#E1306C",
          !!(status?.connected && status?.igConnected),
          status?.connected && status?.igConnected
            ? "Vinculado a traves de tu pagina de Facebook"
            : status?.connected
              ? "No se encontro cuenta de Instagram Business en esta pagina"
              : "Requiere conectar Facebook primero",
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {!status?.connected ? (
          <button
            onClick={openConnectPopup}
            disabled={connecting}
            style={{
              padding: "12px 28px", fontSize: 13, fontWeight: 700,
              color: C.pureWhite,
              background: connecting
                ? C.muted
                : "linear-gradient(135deg, #1877F2, #0E5FCC)",
              border: "none", borderRadius: 10, cursor: connecting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: connecting ? "none" : "0 4px 14px #1877F240",
              transition: "all 0.2s ease",
            }}
          >
            {connecting ? <><Spinner /> Esperando autorización…</> : "📘 Conectar con Facebook"}
          </button>
        ) : (
          <>
            <button
              onClick={openConnectPopup}
              disabled={connecting}
              style={{
                padding: "12px 22px", fontSize: 12, fontWeight: 700,
                color: "#1877F2",
                background: "transparent",
                border: "2px solid #1877F240", borderRadius: 10, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              ↻ Reconectar / cambiar pagina
            </button>
            <button
              onClick={disconnect}
              disabled={disconnecting}
              style={{
                padding: "12px 22px", fontSize: 12, fontWeight: 700,
                color: C.error,
                background: "transparent",
                border: `2px solid ${C.error}40`, borderRadius: 10, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                opacity: disconnecting ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {disconnecting ? <Spinner /> : "🔌 Desconectar"}
            </button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: 32, padding: "16px 18px", borderRadius: 10,
        backgroundColor: C.surface, border: `1px solid ${C.border}`,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Como funciona
        </p>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {[
            "Haz clic en 'Conectar con Facebook' — se abrira una ventana emergente de autorización.",
            "Inicia sesión en Facebook y selecciona la pagina que quieres gestionar.",
            "El sistema guardara el token de acceso y lo usara automaticamente para publicar.",
            "Instagram se conecta automaticamente si tu pagina tiene una cuenta Business vinculada.",
          ].map((step, i) => (
            <li key={i} style={{ fontSize: 12, color: C.secondary, lineHeight: 1.7, marginBottom: 4 }}>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Sub-tab 1: Easy Bot — AI Content Assistant ──────────────────────────────
function EasyBotSubTab({ token }: { token: string }) {
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: uid(), role: "bot",
      text: "Hola! Soy Easy Bot, tu asistente de contenido. Selecciona un tipo de contenido y dime sobre que quieres crear. Yo me encargo del resto.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [contentType, setContentType] = useState("IG Post");
  const [tone, setTone] = useState("Profesional");
  const [loading, setLoading] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [schedulePlatforms, setSchedulePlatforms] = useState({ ig: true, fb: false, li: false });
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishPlatforms, setPublishPlatforms] = useState({ ig: true, fb: true, blog: false });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadMsgId = useRef<string | null>(null);

  function handleMediaClick(msgId: string) {
    pendingUploadMsgId.current = msgId;
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const msgId = pendingUploadMsgId.current;
    if (!file || !msgId) return;
    e.target.value = "";

    setUploadingId(msgId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-token": token },
        body: formData,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Upload failed");

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, mediaUrl: d.url } : m
      ));
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: "bot", text: `Error subiendo archivo: ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setUploadingId(null);
  }

  function handleRemoveMedia(msgId: string) {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, mediaUrl: undefined } : m
    ));
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const contentTypes = [
    { label: "IG Post",  dbValue: "ig_post",  icon: "📸", color: "#E1306C" },
    { label: "FB Post",  dbValue: "fb_post",  icon: "📘", color: "#1877F2" },
    { label: "Blog",     dbValue: "blog",     icon: "📝", color: C.warn },
    { label: "Story",    dbValue: "ig_story", icon: "📱", color: "#833AB4" },
    { label: "Carousel", dbValue: "carousel", icon: "🎠", color: "#F77737" },
  ];
  const toDbContentType = (label: string) =>
    contentTypes.find(ct => ct.label === label)?.dbValue ?? "ig_post";

  const tones = ["Profesional", "Casual", "Inspiracional", "Educativo", "Storytelling", "Humor", "Empoderante"];

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: BotMessage = {
      id: uid(), role: "user", text: input.trim(), timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    const topic = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/easy-social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ contentType, tone, topic, lang: "es" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error generando contenido");

      const botMsg: BotMessage = {
        id: uid(), role: "bot",
        text: d.content ?? d.text ?? "Contenido generado",
        contentType: d.content_type ?? contentType,
        tone: d.tone ?? tone,
        hashtags: d.hashtags ?? "",
        imageSuggestion: d.image_suggestion ?? "",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: "bot",
        text: `Error: ${err.message}. Intenta de nuevo.`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  }

  async function handleImprove(msgId: string) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/easy-social/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ text: msg.text, contentType: msg.contentType ?? contentType, instruction: "Mejora este contenido haciendolo mas atractivo y persuasivo" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error mejorando");
      const botMsg: BotMessage = {
        id: uid(), role: "bot",
        text: d.content ?? d.text ?? msg.text,
        contentType: msg.contentType ?? contentType,
        tone: msg.tone ?? tone,
        hashtags: d.hashtags ?? msg.hashtags ?? "",
        imageSuggestion: d.image_suggestion ?? msg.imageSuggestion ?? "",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: "bot", text: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  }

  function handleUsar(msgId: string) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const fullText = msg.text + (msg.hashtags ? "\n\n" + msg.hashtags : "");
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleScheduleOpen(msgId: string) {
    setSchedulingId(schedulingId === msgId ? null : msgId);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduleDate(tomorrow.toISOString().split("T")[0]);
  }

  async function handleScheduleConfirm(msgId: string) {
    if (!scheduleDate) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    try {
      // First create the post, then schedule it
      const createRes = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          title_es: msg.text.slice(0, 80),
          excerpt_es: msg.text.slice(0, 200),
          body_es: msg.text,
          image_url: msg.mediaUrl || null,
          hashtags: msg.hashtags ?? "",
          post_type: "social",
          content_type: toDbContentType(msg.contentType ?? contentType),
          published: false,
          read_min: 1,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error ?? "Error creando post");

      const postId = createData.post.id;
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;

      await fetch(`/api/admin/posts/${postId}/schedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          scheduled_at: scheduledAt,
          publish_to_ig: schedulePlatforms.ig,
          publish_to_fb: schedulePlatforms.fb,
          publish_to_li: schedulePlatforms.li,
        }),
      });

      setMessages(prev => [...prev, {
        id: uid(), role: "bot",
        text: `Programado para ${fmtDate(scheduledAt)} a las ${scheduleTime}. ${schedulePlatforms.ig ? "IG " : ""}${schedulePlatforms.fb ? "FB " : ""}${schedulePlatforms.li ? "LI " : ""}`,
        timestamp: new Date().toISOString(),
      }]);
      setSchedulingId(null);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: "bot", text: `Error al programar: ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }

  async function handlePublish(msgId: string, platforms: { ig: boolean; fb: boolean; blog: boolean }) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    setPublishingId(null);

    let toIG = platforms.ig;
    if (toIG && !msg.mediaUrl) {
      const ok = confirm("No hay imagen adjunta. Instagram requiere imagen. ¿Continuar sin publicar en IG?");
      if (!ok) return;
      toIG = false;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          title_es: msg.text.slice(0, 80),
          excerpt_es: msg.text.slice(0, 200),
          body_es: msg.text,
          image_url: msg.mediaUrl || null,
          hashtags: msg.hashtags ?? "",
          post_type: platforms.blog ? "article" : "social",
          content_type: toDbContentType(msg.contentType ?? contentType),
          published: true,
          read_min: 1,
          publishToInstagram: toIG,
          publishToFacebook: platforms.fb,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error publicando");

      const lines = ["Publicado!"];
      if (platforms.blog) lines.push("Blog ✓");
      if (d.social?.instagram) lines.push("IG ✓");
      if (d.social?.facebook) lines.push("FB ✓");
      if (d.social?.errors?.instagram) lines.push(`IG error: ${d.social.errors.instagram}`);
      if (d.social?.errors?.facebook) lines.push(`FB error: ${d.social.errors.facebook}`);

      setMessages(prev => [...prev, {
        id: uid(), role: "bot", text: lines.join(" · "),
        timestamp: new Date().toISOString(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: uid(), role: "bot", text: `Error: ${err.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 320px)", minHeight: 500 }}>
      {/* Hidden file input for media uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />
      {/* Quick action buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {contentTypes.map(ct => (
          <button
            key={ct.label}
            onClick={() => setContentType(ct.label)}
            style={{
              padding: "8px 16px", fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${contentType === ct.label ? ct.color : C.border}`,
              backgroundColor: contentType === ct.label ? ct.color + "14" : "transparent",
              color: contentType === ct.label ? ct.color : C.secondary,
              cursor: "pointer", borderRadius: 20,
              transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span>{ct.icon}</span> {ct.label}
          </button>
        ))}
      </div>

      {/* Tone selector */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, flexShrink: 0 }}>
          Tono:
        </label>
        <select
          value={tone}
          onChange={e => setTone(e.target.value)}
          style={{
            padding: "7px 14px", fontSize: 12, color: C.secondary,
            backgroundColor: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, cursor: "pointer", outline: "none",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          {tones.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 4px",
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        marginBottom: 16,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: 16,
            animation: "fadeSlideIn 0.3s ease",
          }}>
            {msg.role === "user" ? (
              /* User bubble */
              <div style={{
                maxWidth: "75%", padding: "12px 16px", borderRadius: "16px 16px 4px 16px",
                background: `linear-gradient(135deg, ${C.crimson}, #D4708A)`,
                color: C.pureWhite, fontSize: 13, lineHeight: 1.6,
                boxShadow: `0 2px 8px ${C.crimson}30`,
              }}>
                {msg.text}
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>{fmt(msg.timestamp)}</p>
              </div>
            ) : msg.contentType ? (
              /* Bot content card */
              <div style={{
                maxWidth: "85%", backgroundColor: C.pureWhite,
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                border: `1px solid ${C.border}`,
              }}>
                {/* Card header */}
                <div style={{
                  padding: "10px 16px",
                  background: `linear-gradient(135deg, ${C.surface}, ${C.bg})`,
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <PillBadge
                    label={msg.contentType}
                    bg={contentTypes.find(ct => ct.label === msg.contentType)?.color + "20" ?? C.surface}
                    color={contentTypes.find(ct => ct.label === msg.contentType)?.color ?? C.crimson}
                  />
                  {msg.tone && <PillBadge label={msg.tone} bg={C.crimson + "12"} color={C.crimson} />}
                  <span style={{ fontSize: 9, color: C.muted, marginLeft: "auto" }}>{fmt(msg.timestamp)}</span>
                </div>

                {/* Card body */}
                <div style={{ padding: "14px 16px" }}>
                  <p style={{
                    fontSize: 13, color: C.white, lineHeight: 1.7,
                    whiteSpace: "pre-wrap", fontFamily: "'Nunito', sans-serif",
                  }}>
                    {msg.text}
                  </p>

                  {/* Hashtags */}
                  {msg.hashtags && (
                    <div style={{
                      marginTop: 12, padding: "8px 12px",
                      backgroundColor: C.crimson + "08", borderRadius: 8,
                    }}>
                      <p style={{ fontSize: 12, color: C.crimson, lineHeight: 1.6 }}>{msg.hashtags}</p>
                    </div>
                  )}

                  {/* Image suggestion */}
                  {msg.imageSuggestion && !msg.mediaUrl && (
                    <div style={{
                      marginTop: 10, padding: "8px 12px",
                      backgroundColor: C.warn + "10", borderRadius: 8,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ fontSize: 14 }}>🖼</span>
                      <p style={{ fontSize: 11, color: C.warn, fontStyle: "italic" }}>{msg.imageSuggestion}</p>
                    </div>
                  )}

                  {/* Media attachment zone */}
                  <div style={{ marginTop: 12 }}>
                    {msg.mediaUrl ? (
                      /* Attached media preview */
                      <div style={{
                        position: "relative", borderRadius: 10, overflow: "hidden",
                        border: `2px solid ${C.success}`, backgroundColor: C.bg,
                      }}>
                        {msg.mediaUrl.match(/\.(mp4|mov|webm)$/i) ? (
                          <video src={msg.mediaUrl} controls style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
                        ) : (
                          <img src={msg.mediaUrl} alt="Media adjunto" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
                        )}
                        <div style={{
                          position: "absolute", top: 0, left: 0, right: 0,
                          padding: "6px 10px",
                          background: "linear-gradient(rgba(0,0,0,0.5), transparent)",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>Adjunto</span>
                          <button
                            onClick={() => handleRemoveMedia(msg.id)}
                            style={{
                              width: 22, height: 22, borderRadius: "50%",
                              backgroundColor: "rgba(0,0,0,0.5)", color: "#fff",
                              border: "none", cursor: "pointer", fontSize: 12,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Upload button */
                      <button
                        onClick={() => handleMediaClick(msg.id)}
                        disabled={uploadingId === msg.id}
                        style={{
                          width: "100%", padding: "14px",
                          border: `2px dashed ${C.border}`, borderRadius: 10,
                          backgroundColor: C.bg, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          transition: "all 0.2s ease",
                          opacity: uploadingId === msg.id ? 0.6 : 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.crimson; e.currentTarget.style.backgroundColor = C.crimson + "06"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.backgroundColor = C.bg; }}
                      >
                        <span style={{ fontSize: 20 }}>{uploadingId === msg.id ? "⏳" : "📎"}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.secondary }}>
                          {uploadingId === msg.id ? "Subiendo..." : "Adjuntar foto o video"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{
                  padding: "10px 16px",
                  borderTop: `1px solid ${C.border}`,
                  display: "flex", gap: 8, flexWrap: "wrap",
                }}>
                  <button
                    onClick={() => handleUsar(msg.id)}
                    style={{
                      padding: "6px 14px", fontSize: 11, fontWeight: 700,
                      color: copiedId === msg.id ? C.pureWhite : C.success,
                      backgroundColor: copiedId === msg.id ? C.success : "transparent",
                      border: `1px solid ${C.success}`, borderRadius: 6,
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}
                  >
                    {copiedId === msg.id ? "Copiado!" : "✓ Usar"}
                  </button>
                  <button
                    onClick={() => handleImprove(msg.id)}
                    disabled={loading}
                    style={{
                      padding: "6px 14px", fontSize: 11, fontWeight: 700,
                      color: C.warn, backgroundColor: "transparent",
                      border: `1px solid ${C.warn}`, borderRadius: 6,
                      cursor: "pointer", transition: "all 0.2s ease",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    Mejorar
                  </button>
                  <button
                    onClick={() => handleScheduleOpen(msg.id)}
                    style={{
                      padding: "6px 14px", fontSize: 11, fontWeight: 700,
                      color: "#833AB4", backgroundColor: schedulingId === msg.id ? "#833AB412" : "transparent",
                      border: `1px solid #833AB4`, borderRadius: 6,
                      cursor: "pointer", transition: "all 0.2s ease",
                    }}
                  >
                    Programar
                  </button>
                  <button
                    onClick={() => setPublishingId(publishingId === msg.id ? null : msg.id)}
                    disabled={loading}
                    style={{
                      padding: "6px 14px", fontSize: 11, fontWeight: 700,
                      color: C.pureWhite,
                      backgroundColor: publishingId === msg.id ? C.crimson + "cc" : C.crimson,
                      border: `1px solid ${C.crimson}`, borderRadius: 6,
                      cursor: "pointer", transition: "all 0.2s ease",
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    {publishingId === msg.id ? "✕ Cancelar" : "Publicar"}
                  </button>
                </div>

                {/* Inline schedule picker */}
                {schedulingId === msg.id && (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: "#833AB408",
                    borderTop: `1px solid ${C.border}`,
                    animation: "fadeSlideIn 0.2s ease",
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        style={{
                          padding: "6px 10px", fontSize: 12, border: `1px solid ${C.border}`,
                          borderRadius: 6, backgroundColor: C.pureWhite, color: C.white,
                        }}
                      />
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        style={{
                          padding: "6px 10px", fontSize: 12, border: `1px solid ${C.border}`,
                          borderRadius: 6, backgroundColor: C.pureWhite, color: C.white,
                        }}
                      />
                      <label style={{ fontSize: 11, color: C.secondary, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="checkbox" checked={schedulePlatforms.ig} onChange={e => setSchedulePlatforms(p => ({ ...p, ig: e.target.checked }))} /> IG
                      </label>
                      <label style={{ fontSize: 11, color: C.secondary, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="checkbox" checked={schedulePlatforms.fb} onChange={e => setSchedulePlatforms(p => ({ ...p, fb: e.target.checked }))} /> FB
                      </label>
                      <label style={{ fontSize: 11, color: "#0A66C2", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="checkbox" checked={schedulePlatforms.li} onChange={e => setSchedulePlatforms(p => ({ ...p, li: e.target.checked }))} /> LI
                      </label>
                      <button
                        onClick={() => handleScheduleConfirm(msg.id)}
                        style={{
                          padding: "6px 14px", fontSize: 11, fontWeight: 700,
                          color: C.pureWhite, backgroundColor: "#833AB4",
                          border: "none", borderRadius: 6, cursor: "pointer",
                        }}
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline publish picker */}
                {publishingId === msg.id && (
                  <div style={{
                    padding: "12px 16px",
                    backgroundColor: C.crimson + "08",
                    borderTop: `1px solid ${C.border}`,
                    animation: "fadeSlideIn 0.2s ease",
                  }}>
                    <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: 1 }}>
                      Publicar en:
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{ fontSize: 12, color: C.warn, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 600 }}>
                        <input type="checkbox" checked={publishPlatforms.blog} onChange={e => setPublishPlatforms(p => ({ ...p, blog: e.target.checked }))} />
                        📝 Blog
                      </label>
                      <label style={{ fontSize: 12, color: "#E1306C", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 600 }}>
                        <input type="checkbox" checked={publishPlatforms.ig} onChange={e => setPublishPlatforms(p => ({ ...p, ig: e.target.checked }))} />
                        📸 Instagram
                      </label>
                      <label style={{ fontSize: 12, color: "#1877F2", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontWeight: 600 }}>
                        <input type="checkbox" checked={publishPlatforms.fb} onChange={e => setPublishPlatforms(p => ({ ...p, fb: e.target.checked }))} />
                        📘 Facebook
                      </label>
                      <button
                        onClick={() => handlePublish(msg.id, publishPlatforms)}
                        disabled={loading || (!publishPlatforms.ig && !publishPlatforms.fb && !publishPlatforms.blog)}
                        style={{
                          padding: "6px 16px", fontSize: 11, fontWeight: 700,
                          color: C.pureWhite, backgroundColor: C.crimson,
                          border: "none", borderRadius: 6, cursor: "pointer",
                          opacity: (!publishPlatforms.ig && !publishPlatforms.fb && !publishPlatforms.blog) ? 0.4 : 1,
                        }}
                      >
                        Publicar Ahora
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Bot plain message */
              <div style={{
                maxWidth: "75%", padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                backgroundColor: C.surface, color: C.white, fontSize: 13, lineHeight: 1.6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                {msg.text}
                <p style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>{fmt(msg.timestamp)}</p>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 16 }}>
            <div style={{
              padding: "14px 20px", borderRadius: "16px 16px 16px 4px",
              backgroundColor: C.surface, display: "flex", gap: 6, alignItems: "center",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.crimson, animation: "pulse 1s ease-in-out infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.crimson, animation: "pulse 1s ease-in-out 0.2s infinite" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: C.crimson, animation: "pulse 1s ease-in-out 0.4s infinite" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        display: "flex", gap: 10, alignItems: "center",
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder={`Ej: "Crea un post sobre empoderamiento femenino"...`}
          disabled={loading}
          style={{
            flex: 1, padding: "12px 16px", fontSize: 13,
            border: `1.5px solid ${C.border}`, borderRadius: 12,
            backgroundColor: C.pureWhite, color: C.white,
            outline: "none", fontFamily: "'Nunito', sans-serif",
            transition: "border-color 0.2s ease",
          }}
          onFocus={e => e.target.style.borderColor = C.crimson}
          onBlur={e => e.target.style.borderColor = C.border}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.crimson}, #D4708A)`,
            color: C.pureWhite, border: "none", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${C.crimson}30`,
            opacity: loading || !input.trim() ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── Sub-tab 2: Calendario — Content Calendar ────────────────────────────────
function CalendarioSubTab({ token }: { token: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadScheduled = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/easy-social/scheduled", { headers: { "x-admin-token": token } });
      const d = await res.json();
      setScheduledPosts(d.posts ?? []);
    } catch { setScheduledPosts([]); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadScheduled(); }, [loadScheduled]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function getPostsForDay(day: number): ScheduledPost[] {
    return scheduledPosts.filter(p => {
      const d = new Date(p.scheduled_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  async function cancelSchedule(postId: string) {
    if (!confirm("¿Cancelar esta publicacion programada?")) return;
    setCancellingId(postId);
    try {
      await fetch(`/api/admin/posts/${postId}/schedule`, {
        method: "DELETE",
        headers: { "x-admin-token": token },
      });
      loadScheduled();
    } catch { /* ignore */ }
    setCancellingId(null);
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const upcomingPosts = [...scheduledPosts]
    .filter(p => new Date(p.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 10);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;

  return (
    <div>
      {/* Month navigation */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
        marginBottom: 24,
      }}>
        <button onClick={prevMonth} style={{
          width: 36, height: 36, borderRadius: "50%",
          backgroundColor: C.surface, border: `1px solid ${C.border}`,
          cursor: "pointer", fontSize: 16, color: C.secondary,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
        }}>
          ←
        </button>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20,
          fontWeight: 700, color: C.white, letterSpacing: "0.04em",
          minWidth: 200, textAlign: "center",
        }}>
          {monthNames[month]} {year}
        </span>
        <button onClick={nextMonth} style={{
          width: 36, height: 36, borderRadius: "50%",
          backgroundColor: C.surface, border: `1px solid ${C.border}`,
          cursor: "pointer", fontSize: 16, color: C.secondary,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
        }}>
          →
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{
        backgroundColor: C.pureWhite, borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20,
        border: `1px solid ${C.border}`,
      }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {dayNames.map(d => (
            <div key={d} style={{
              padding: "10px 4px", textAlign: "center", fontSize: 10,
              fontWeight: 700, color: C.muted, textTransform: "uppercase",
              letterSpacing: "0.1em", backgroundColor: C.surface,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            const dayPosts = day ? getPostsForDay(day) : [];
            const isSelected = day === selectedDay;
            return (
              <div
                key={i}
                onClick={() => day && setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 72, padding: "6px 8px",
                  borderRight: (i + 1) % 7 !== 0 ? `1px solid ${C.border}30` : "none",
                  borderBottom: `1px solid ${C.border}30`,
                  backgroundColor: isSelected ? C.crimson + "08" : day ? "transparent" : C.bg,
                  cursor: day ? "pointer" : "default",
                  transition: "background-color 0.15s ease",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    <span style={{
                      fontSize: 12, fontWeight: isToday(day) ? 800 : 500,
                      color: isToday(day) ? C.pureWhite : C.white,
                      backgroundColor: isToday(day) ? C.crimson : "transparent",
                      width: isToday(day) ? 24 : "auto", height: isToday(day) ? 24 : "auto",
                      borderRadius: "50%", display: "inline-flex",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                        {dayPosts.map(p => (
                          <div key={p.id} style={{
                            width: 7, height: 7, borderRadius: "50%",
                            backgroundColor: p.publish_to_ig ? "#E1306C" : p.publish_to_fb ? "#1877F2" : C.warn,
                          }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded day view */}
      {selectedDay && (
        <div style={{
          backgroundColor: C.pureWhite, borderRadius: 12, padding: 16,
          marginBottom: 20, border: `1px solid ${C.border}`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          animation: "fadeSlideIn 0.2s ease",
        }}>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: 14,
            fontWeight: 700, color: C.white, marginBottom: 12,
          }}>
            {selectedDay} de {monthNames[month]}
          </p>
          {getPostsForDay(selectedDay).length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>Sin publicaciones programadas para este dia.</p>
          ) : (
            getPostsForDay(selectedDay).map(post => (
              <div key={post.id} style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${C.border}30`,
              }}>
                {post.image_url && (
                  <img src={post.image_url} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.content_preview || post.title}
                  </p>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: C.muted }}>{fmt(post.scheduled_at)}</span>
                    {post.publish_to_ig && <PillBadge label="IG" bg="#E1306C20" color="#E1306C" />}
                    {post.publish_to_fb && <PillBadge label="FB" bg="#1877F220" color="#1877F2" />}
                    {post.publish_to_li && <PillBadge label="LI" bg="#0A66C220" color="#0A66C2" />}
                    {post.publish_to_blog && <PillBadge label="Blog" bg={C.warn + "20"} color={C.warn} />}
                  </div>
                </div>
                <button
                  onClick={() => cancelSchedule(post.id)}
                  disabled={cancellingId === post.id}
                  style={{
                    fontSize: 10, fontWeight: 700, color: C.error,
                    background: "none", border: `1px solid ${C.error}`,
                    padding: "4px 10px", cursor: "pointer", borderRadius: 4,
                    opacity: cancellingId === post.id ? 0.5 : 1,
                  }}
                >
                  Cancelar
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 20, padding: "0 4px" }}>
        {[
          { label: "Instagram", color: "#E1306C" },
          { label: "Facebook", color: "#1877F2" },
          { label: "Blog", color: C.warn },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: l.color }} />
            <span style={{ fontSize: 11, color: C.muted }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming posts list */}
      <div style={{
        backgroundColor: C.pureWhite, borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: "14px 18px", backgroundColor: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Proximas publicaciones ({upcomingPosts.length})
          </p>
        </div>
        {upcomingPosts.length === 0 ? (
          <p style={{ padding: 24, fontSize: 12, color: C.muted, textAlign: "center" }}>
            No hay publicaciones programadas.
          </p>
        ) : (
          upcomingPosts.map(post => (
            <div key={post.id} style={{
              display: "flex", gap: 12, alignItems: "center",
              padding: "12px 18px", borderBottom: `1px solid ${C.border}30`,
              transition: "background-color 0.15s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              {post.image_url ? (
                <img src={post.image_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 8, backgroundColor: C.surface,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>
                  📄
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 12, color: C.white, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {post.content_preview || post.title}
                </p>
                <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: C.muted }}>{fmt(post.scheduled_at)}</span>
                  {post.publish_to_ig && <PillBadge label="IG" bg="#E1306C20" color="#E1306C" />}
                  {post.publish_to_fb && <PillBadge label="FB" bg="#1877F220" color="#1877F2" />}
                  {post.publish_to_li && <PillBadge label="LI" bg="#0A66C220" color="#0A66C2" />}
                  {post.publish_to_blog && <PillBadge label="Blog" bg={C.warn + "20"} color={C.warn} />}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => cancelSchedule(post.id)}
                  disabled={cancellingId === post.id}
                  style={{
                    fontSize: 10, fontWeight: 700, color: C.error,
                    background: "none", border: `1px solid ${C.error}`,
                    padding: "4px 10px", cursor: "pointer", borderRadius: 4,
                    opacity: cancellingId === post.id ? 0.5 : 1,
                  }}
                >
                  {cancellingId === post.id ? "…" : "Cancelar"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Sub-tab 3: Campanas — Campaign Manager ─────────────────────────────────
function CampanasSubTab({ token }: { token: string }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<CampaignPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Planner state
  const [planGoal, setPlanGoal] = useState("");
  const [planDuration, setPlanDuration] = useState(7);
  const [planPlatforms, setPlanPlatforms] = useState({ ig: true, fb: false, li: false, blog: false });
  const [planTone, setPlanTone] = useState("Profesional");
  const [generatedPlan, setGeneratedPlan] = useState<CampaignPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [planName, setPlanName] = useState("");

  const tones = ["Profesional", "Casual", "Inspiracional", "Educativo", "Storytelling", "Humor", "Empoderante"];

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns", { headers: { "x-admin-token": token } });
      const d = await res.json();
      setCampaigns(d.campaigns ?? d ?? []);
    } catch { setCampaigns([]); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  async function generatePlan() {
    if (!planGoal.trim()) return;
    setGenerating(true);
    try {
      const platforms: string[] = [];
      if (planPlatforms.ig) platforms.push("instagram");
      if (planPlatforms.fb) platforms.push("facebook");
      if (planPlatforms.li) platforms.push("linkedin");
      if (planPlatforms.blog) platforms.push("blog");

      const res = await fetch("/api/admin/easy-social/campaign-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ goal: planGoal, duration: planDuration, platforms, tone: planTone, lang: "es" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error generando plan");
      setGeneratedPlan(d.posts ?? d.plan ?? []);
      setPlanName(d.name ?? planGoal.slice(0, 60));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setGenerating(false);
  }

  async function saveCampaign() {
    if (generatedPlan.length === 0) return;
    setSavingCampaign(true);
    try {
      const platforms: string[] = [];
      if (planPlatforms.ig) platforms.push("instagram");
      if (planPlatforms.fb) platforms.push("facebook");
      if (planPlatforms.li) platforms.push("linkedin");
      if (planPlatforms.blog) platforms.push("blog");

      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          name: planName || planGoal.slice(0, 60),
          goal: planGoal,
          platforms,
          tone: planTone,
          duration: planDuration,
          posts: generatedPlan,
        }),
      });
      if (!res.ok) throw new Error("Error guardando campana");
      setShowPlanner(false);
      setGeneratedPlan([]);
      setPlanGoal("");
      setPlanName("");
      loadCampaigns();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
    setSavingCampaign(false);
  }

  async function regeneratePost(index: number) {
    const post = generatedPlan[index];
    if (!post) return;
    try {
      const res = await fetch("/api/admin/easy-social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({
          contentType: post.content_type,
          tone: planTone,
          topic: planGoal + " - dia " + post.day,
          lang: "es",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Error");
      setGeneratedPlan(prev => prev.map((p, i) =>
        i === index ? { ...p, content: d.content ?? d.text ?? p.content, hashtags: d.hashtags ?? p.hashtags } : p
      ));
    } catch { /* ignore */ }
  }

  function acceptPost(index: number) {
    setGeneratedPlan(prev => prev.map((p, i) =>
      i === index ? { ...p, status: "accepted" } : p
    ));
  }

  async function toggleCampaignExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLoadingPosts(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { headers: { "x-admin-token": token } });
      const d = await res.json();
      setExpandedPosts(d.posts ?? d.campaign?.posts ?? []);
    } catch { setExpandedPosts([]); }
    setLoadingPosts(false);
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    draft: { bg: C.muted + "20", color: C.muted },
    active: { bg: C.success + "20", color: C.success },
    completed: { bg: C.crimson + "20", color: C.crimson },
    paused: { bg: C.warn + "20", color: C.warn },
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: C.secondary }}>
          {campaigns.length} campana{campaigns.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setShowPlanner(!showPlanner); setGeneratedPlan([]); }}
          style={{
            padding: "8px 20px", fontSize: 12, fontWeight: 700,
            color: showPlanner ? C.muted : C.pureWhite,
            backgroundColor: showPlanner ? "transparent" : C.crimson,
            border: `1px solid ${showPlanner ? C.border : C.crimson}`,
            borderRadius: 8, cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {showPlanner ? "✕ Cerrar" : "+ Nueva Campana"}
        </button>
      </div>

      {/* Campaign planner */}
      {showPlanner && (
        <div style={{
          backgroundColor: C.pureWhite, borderRadius: 12, padding: 24,
          marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: `1px solid ${C.border}`,
          animation: "fadeSlideIn 0.3s ease",
        }}>
          <p style={{
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16,
            fontWeight: 700, color: C.white, marginBottom: 20,
          }}>
            Planificador de Campana AI
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Objetivo de la campana *
              </label>
              <input
                className="input"
                value={planGoal}
                onChange={e => setPlanGoal(e.target.value)}
                placeholder="Ej: Lanzamiento del libro, Aumentar seguidores..."
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Nombre (opcional)
              </label>
              <input
                className="input"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder="Se genera automaticamente si lo dejas vacio"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Duracion
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[3, 7, 14, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setPlanDuration(d)}
                    style={{
                      padding: "6px 14px", fontSize: 12, fontWeight: 600,
                      border: `1.5px solid ${planDuration === d ? C.crimson : C.border}`,
                      backgroundColor: planDuration === d ? C.crimson + "12" : "transparent",
                      color: planDuration === d ? C.crimson : C.secondary,
                      borderRadius: 6, cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Plataformas
              </label>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {[
                  { key: "ig" as const, label: "IG", color: "#E1306C" },
                  { key: "fb" as const, label: "FB", color: "#1877F2" },
                  { key: "li" as const, label: "LI", color: "#0A66C2" },
                  { key: "blog" as const, label: "Blog", color: C.warn },
                ].map(p => (
                  <label key={p.key} style={{
                    display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, color: planPlatforms[p.key] ? p.color : C.muted,
                  }}>
                    <input
                      type="checkbox"
                      checked={planPlatforms[p.key]}
                      onChange={e => setPlanPlatforms(prev => ({ ...prev, [p.key]: e.target.checked }))}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, display: "block", marginBottom: 6 }}>
                Tono
              </label>
              <select
                value={planTone}
                onChange={e => setPlanTone(e.target.value)}
                style={{
                  padding: "7px 14px", fontSize: 12, color: C.secondary,
                  backgroundColor: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, cursor: "pointer", outline: "none", width: "100%",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                {tones.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {generatedPlan.length === 0 ? (
            <button
              onClick={generatePlan}
              disabled={generating || !planGoal.trim()}
              style={{
                padding: "12px 28px", fontSize: 14, fontWeight: 700,
                color: C.pureWhite,
                background: `linear-gradient(135deg, ${C.crimson}, #D4708A)`,
                border: "none", borderRadius: 8, cursor: "pointer",
                boxShadow: `0 3px 12px ${C.crimson}30`,
                opacity: generating || !planGoal.trim() ? 0.5 : 1,
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {generating ? (
                <>
                  <Spinner /> Generando plan...
                </>
              ) : (
                "🤖 Generar Plan"
              )}
            </button>
          ) : (
            <>
              {/* Generated plan timeline */}
              <p style={{
                fontFamily: "'Playfair Display', Georgia, serif", fontSize: 14,
                fontWeight: 700, color: C.white, marginBottom: 16,
              }}>
                Plan generado: {generatedPlan.length} publicaciones
              </p>

              <div style={{ position: "relative", paddingLeft: 24, marginBottom: 20 }}>
                {/* Timeline line */}
                <div style={{
                  position: "absolute", left: 7, top: 0, bottom: 0, width: 2,
                  backgroundColor: C.border,
                }} />

                {generatedPlan.map((post, i) => (
                  <div key={i} style={{
                    position: "relative", marginBottom: 16,
                    animation: `fadeSlideIn 0.3s ease ${i * 0.05}s both`,
                  }}>
                    {/* Timeline dot */}
                    <div style={{
                      position: "absolute", left: -20, top: 14,
                      width: 12, height: 12, borderRadius: "50%",
                      backgroundColor: post.status === "accepted" ? C.success : C.crimson,
                      border: `2px solid ${C.pureWhite}`,
                      boxShadow: "0 0 0 2px " + (post.status === "accepted" ? C.success + "40" : C.crimson + "40"),
                    }} />

                    <div style={{
                      backgroundColor: C.bg, borderRadius: 10, padding: 16,
                      border: `1px solid ${post.status === "accepted" ? C.success + "40" : C.border}`,
                      transition: "all 0.2s ease",
                    }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <PillBadge label={`Dia ${post.day}`} bg={C.crimson + "15"} color={C.crimson} />
                        <PillBadge label={post.content_type} bg={C.surface} color={C.secondary} />
                        <PillBadge label={post.platform} bg={
                          post.platform === "instagram" ? "#E1306C20" :
                          post.platform === "facebook" ? "#1877F220" :
                          post.platform === "linkedin" ? "#0A66C220" : C.warn + "20"
                        } color={
                          post.platform === "instagram" ? "#E1306C" :
                          post.platform === "facebook" ? "#1877F2" :
                          post.platform === "linkedin" ? "#0A66C2" : C.warn
                        } />
                        {post.status === "accepted" && <PillBadge label="Aceptado" bg={C.success + "15"} color={C.success} />}
                      </div>

                      <p style={{ fontSize: 13, color: C.white, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 8 }}>
                        {post.content}
                      </p>
                      {post.hashtags && (
                        <p style={{ fontSize: 11, color: C.crimson, marginBottom: 8 }}>{post.hashtags}</p>
                      )}

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => acceptPost(i)}
                          style={{
                            padding: "5px 12px", fontSize: 10, fontWeight: 700,
                            color: post.status === "accepted" ? C.pureWhite : C.success,
                            backgroundColor: post.status === "accepted" ? C.success : "transparent",
                            border: `1px solid ${C.success}`, borderRadius: 5,
                            cursor: "pointer", transition: "all 0.2s ease",
                          }}
                        >
                          {post.status === "accepted" ? "Aceptado" : "Aceptar"}
                        </button>
                        <button
                          onClick={() => regeneratePost(i)}
                          style={{
                            padding: "5px 12px", fontSize: 10, fontWeight: 700,
                            color: C.warn, backgroundColor: "transparent",
                            border: `1px solid ${C.warn}`, borderRadius: 5,
                            cursor: "pointer",
                          }}
                        >
                          Regenerar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={saveCampaign}
                disabled={savingCampaign}
                style={{
                  padding: "12px 28px", fontSize: 14, fontWeight: 700,
                  color: C.pureWhite,
                  background: `linear-gradient(135deg, ${C.success}, #6DB87F)`,
                  border: "none", borderRadius: 8, cursor: "pointer",
                  boxShadow: `0 3px 12px ${C.success}30`,
                  opacity: savingCampaign ? 0.5 : 1,
                  transition: "all 0.2s ease",
                }}
              >
                {savingCampaign ? "Guardando..." : "Crear Campana"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Campaign list */}
      {campaigns.length === 0 && !showPlanner ? (
        <p style={{ color: C.muted, textAlign: "center", padding: 40 }}>
          Sin campanas. Crea la primera con el boton de arriba.
        </p>
      ) : (
        campaigns.map(campaign => {
          const sc = statusColors[campaign.status] ?? statusColors.draft;
          const isExpanded = expandedId === campaign.id;
          return (
            <div key={campaign.id} style={{ marginBottom: 12 }}>
              <div
                onClick={() => toggleCampaignExpand(campaign.id)}
                style={{
                  backgroundColor: C.pureWhite, borderRadius: 12, padding: 18,
                  border: `1px solid ${isExpanded ? C.crimson + "40" : C.border}`,
                  boxShadow: isExpanded ? `0 4px 16px ${C.crimson}10` : "0 1px 4px rgba(0,0,0,0.04)",
                  cursor: "pointer", transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <p style={{
                        fontFamily: "'Playfair Display', Georgia, serif", fontSize: 15,
                        fontWeight: 700, color: C.white,
                      }}>
                        {campaign.name}
                      </p>
                      <PillBadge label={campaign.status} bg={sc.bg} color={sc.color} />
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: C.muted }}>
                        {fmtDate(campaign.start_date)} — {fmtDate(campaign.end_date)}
                      </span>
                      <span style={{ fontSize: 11, color: C.secondary, fontWeight: 600 }}>
                        {campaign.post_count} publicaciones
                      </span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {campaign.platforms.map(p => (
                          <PillBadge key={p}
                            label={p === "instagram" ? "IG" : p === "facebook" ? "FB" : p === "linkedin" ? "LI" : "Blog"}
                            bg={p === "instagram" ? "#E1306C15" : p === "facebook" ? "#1877F215" : p === "linkedin" ? "#0A66C215" : C.warn + "15"}
                            color={p === "instagram" ? "#E1306C" : p === "facebook" ? "#1877F2" : p === "linkedin" ? "#0A66C2" : C.warn}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 16, color: C.muted,
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}>
                    ▶
                  </span>
                </div>
              </div>

              {/* Expanded campaign posts */}
              {isExpanded && (
                <div style={{
                  backgroundColor: C.bg, borderRadius: "0 0 12px 12px",
                  padding: 16, marginTop: -4,
                  border: `1px solid ${C.border}`, borderTop: "none",
                  animation: "fadeSlideIn 0.2s ease",
                }}>
                  {loadingPosts ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>
                  ) : expandedPosts.length === 0 ? (
                    <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 20 }}>Sin posts en esta campana.</p>
                  ) : (
                    expandedPosts.map((post, i) => (
                      <div key={post.id || i} style={{
                        padding: "12px 14px", backgroundColor: C.pureWhite,
                        borderRadius: 8, marginBottom: 8,
                        border: `1px solid ${C.border}`,
                      }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                          <PillBadge label={`Dia ${post.day}`} bg={C.crimson + "12"} color={C.crimson} />
                          <PillBadge label={post.content_type} bg={C.surface} color={C.secondary} />
                          <PillBadge label={post.platform}
                            bg={post.platform === "instagram" ? "#E1306C15" : post.platform === "facebook" ? "#1877F215" : post.platform === "linkedin" ? "#0A66C215" : C.warn + "15"}
                            color={post.platform === "instagram" ? "#E1306C" : post.platform === "facebook" ? "#1877F2" : post.platform === "linkedin" ? "#0A66C2" : C.warn}
                          />
                          {post.status === "published" && <PillBadge label="Publicado" bg={C.success + "15"} color={C.success} />}
                          {post.scheduled_at && <span style={{ fontSize: 10, color: C.muted }}>Programado: {fmt(post.scheduled_at)}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: C.white, lineHeight: 1.5 }}>{post.content}</p>
                        {post.hashtags && <p style={{ fontSize: 11, color: C.crimson, marginTop: 4 }}>{post.hashtags}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Sub-tab 4: Metricas — Social Analytics ─────────────────────────────────
function MetricasSubTab({ token }: { token: string }) {
  const [metrics, setMetrics] = useState<SocialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/easy-social/metrics", { headers: { "x-admin-token": token } });
      const d = await res.json();
      setMetrics(d);
    } catch { setMetrics(null); }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  async function refreshMetrics() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/easy-social/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({}),
      });
      if (res.ok) await loadMetrics();
    } catch { /* ignore */ }
    setRefreshing(false);
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;

  const overviewCards = [
    { label: "Alcance Total", value: metrics?.total_reach ?? 0, icon: "👁", color: C.crimson, format: (v: number) => v >= 1000 ? (v / 1000).toFixed(1) + "K" : String(v) },
    { label: "Engagement Rate", value: metrics?.engagement_rate ?? 0, icon: "💖", color: "#E1306C", format: (v: number) => v.toFixed(1) + "%" },
    { label: "Publicaciones", value: metrics?.posts_published ?? 0, icon: "📝", color: C.success, format: (v: number) => String(v) },
    { label: "Top Plataforma", value: 0, icon: "🏆", color: C.warn, format: () => metrics?.top_platform ?? "—" },
  ];

  return (
    <div>
      {/* Refresh button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={refreshMetrics}
          disabled={refreshing}
          style={{
            padding: "8px 18px", fontSize: 12, fontWeight: 700,
            color: C.crimson, backgroundColor: "transparent",
            border: `1px solid ${C.crimson}`, borderRadius: 8,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            opacity: refreshing ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
        >
          {refreshing ? <Spinner /> : "↻"} Actualizar metricas
        </button>
      </div>

      {/* Overview cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 14, marginBottom: 28,
      }}>
        {overviewCards.map(card => (
          <div key={card.label} style={{
            backgroundColor: C.pureWhite, borderRadius: 12, padding: "20px 18px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            transition: "all 0.2s ease",
            position: "relative", overflow: "hidden",
          }}>
            {/* Subtle gradient accent */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg, ${card.color}, ${card.color}60)`,
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                backgroundColor: card.color + "12",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{
                  fontSize: 10, color: C.muted, textTransform: "uppercase",
                  letterSpacing: "0.1em", fontWeight: 600, marginBottom: 2,
                }}>
                  {card.label}
                </p>
                <p style={{
                  fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24,
                  fontWeight: 700, color: card.color,
                }}>
                  {card.format(card.value)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top posts table */}
      <div style={{
        backgroundColor: C.pureWhite, borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          padding: "14px 18px", backgroundColor: C.surface,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Top publicaciones por engagement
          </p>
        </div>

        {!metrics?.top_posts || metrics.top_posts.length === 0 ? (
          <p style={{ padding: 24, fontSize: 12, color: C.muted, textAlign: "center" }}>
            Sin datos de publicaciones aun.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["", "Contenido", "Plataforma", "Likes", "Comentarios", "Compartidos", "Engagement"].map(h => (
                    <th key={h} style={{
                      padding: "10px 14px", textAlign: "left", fontSize: 10,
                      fontWeight: 600, color: C.muted, letterSpacing: "0.08em",
                      textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.top_posts.map((post, i) => (
                  <tr key={post.id || i} style={{ borderBottom: `1px solid ${C.border}30` }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.bg}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      {post.image_url ? (
                        <img src={post.image_url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📄</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.white, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {post.content_preview}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <PillBadge
                        label={post.platform === "instagram" ? "IG" : post.platform === "facebook" ? "FB" : post.platform === "linkedin" ? "LI" : "Blog"}
                        bg={post.platform === "instagram" ? "#E1306C20" : post.platform === "facebook" ? "#1877F220" : post.platform === "linkedin" ? "#0A66C220" : C.warn + "20"}
                        color={post.platform === "instagram" ? "#E1306C" : post.platform === "facebook" ? "#1877F2" : post.platform === "linkedin" ? "#0A66C2" : C.warn}
                      />
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.secondary, fontWeight: 600 }}>
                      {post.likes}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.secondary, fontWeight: 600 }}>
                      {post.comments}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: C.secondary, fontWeight: 600 }}>
                      {post.shares}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 14, fontWeight: 700, color: C.crimson,
                      }}>
                        {post.engagement_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI Analysis card */}
      {metrics?.ai_analysis && (
        <div style={{
          backgroundColor: C.pureWhite, borderRadius: 12, overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: `1px solid ${C.border}`,
        }}>
          <div style={{
            padding: "14px 18px",
            background: `linear-gradient(135deg, ${C.crimson}10, ${C.crimson}05)`,
            borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13,
              fontWeight: 700, color: C.crimson, letterSpacing: "0.04em",
            }}>
              Easy Bot dice...
            </p>
          </div>
          <div style={{ padding: "18px 20px" }}>
            <p style={{ fontSize: 13, color: C.white, lineHeight: 1.7, marginBottom: 16 }}>
              {metrics.ai_analysis.summary}
            </p>
            {metrics.ai_analysis.recommendations.length > 0 && (
              <>
                <p style={{
                  fontSize: 11, color: C.muted, textTransform: "uppercase",
                  letterSpacing: "0.08em", fontWeight: 600, marginBottom: 8,
                }}>
                  Recomendaciones
                </p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {metrics.ai_analysis.recommendations.map((rec, i) => (
                    <li key={i} style={{
                      fontSize: 12, color: C.secondary, lineHeight: 1.7, marginBottom: 6,
                    }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* No metrics fallback */}
      {!metrics && (
        <div style={{
          backgroundColor: C.surface, borderRadius: 12, padding: 40,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 12 }}>
            No hay metricas disponibles aun.
          </p>
          <p style={{ fontSize: 12, color: C.border }}>
            Publica contenido en tus redes y las metricas apareceran aqui.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Testimonials panel ───────────────────────────────────────────────────────
function TestimonialsPanel({ token }: { token: string }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const empty = { author: "", location: "", text_es: "", text_en: "", stars: 5, sort_order: 0 };
  const [form, setForm]   = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/testimonials", { headers: { "x-admin-token": token } });
    const d   = await res.json();
    setTestimonials(d.testimonials ?? []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.author.trim() || !form.text_es.trim()) { setMsg("Nombre y texto en ES son obligatorios."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Error al guardar");
      setForm(empty); setShowForm(false); load();
    } catch (err: any) { setMsg(err.message); }
    finally { setSaving(false); }
  }

  async function toggle(t: Testimonial) {
    await fetch(`/api/admin/testimonials/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ active: !t.active }) });
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar?")) return;
    await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE", headers: { "x-admin-token": token } });
    load();
  }

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: C.secondary }}>{testimonials.length} testimonio{testimonials.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary" style={{ width: "auto", padding: "8px 20px", fontSize: 12 }}>
          {showForm ? "✕ Cerrar" : "+ Nuevo testimonio"}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: C.surface, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="field-label">Nombre *</label>
              <input className="input" value={form.author} onChange={e => set("author", e.target.value)} />
            </div>
            <div>
              <label className="field-label">Ubicacion</label>
              <input className="input" placeholder="Bogota, Colombia" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="field-label">Testimonio (ES) *</label>
              <textarea className="input" rows={3} value={form.text_es} onChange={e => set("text_es", e.target.value)} style={{ resize: "vertical" }} />
            </div>
            <div>
              <label className="field-label">Testimonio (EN)</label>
              <textarea className="input" rows={3} value={form.text_en} onChange={e => set("text_en", e.target.value)} style={{ resize: "vertical" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="field-label">Estrellas (1–5)</label>
              <input className="input" type="number" min={1} max={5} value={form.stars} onChange={e => set("stars", Number(e.target.value))} />
            </div>
            <div>
              <label className="field-label">Orden</label>
              <input className="input" type="number" min={0} value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value))} />
            </div>
          </div>
          {msg && <p style={{ fontSize: 12, color: C.error, marginBottom: 10 }}>{msg}</p>}
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Guardando…" : "Guardar testimonio"}
          </button>
        </div>
      )}

      {loading ? <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div> : (
        testimonials.length === 0
          ? <p style={{ color: C.muted, textAlign: "center", padding: 40 }}>Sin testimonios.</p>
          : testimonials.map(t => (
            <div key={t.id} style={{ backgroundColor: C.surface, padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start", opacity: t.active ? 1 : 0.5 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{t.author}</p>
                  {t.location && <p style={{ fontSize: 11, color: C.muted }}>{t.location}</p>}
                  <span style={{ fontSize: 11, color: C.crimson }}>{"★".repeat(t.stars)}</span>
                  {!t.active && <Badge label="oculto" color={C.muted} />}
                </div>
                <p style={{ fontSize: 13, color: C.secondary, lineHeight: 1.5 }}>{t.text_es}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => toggle(t)} style={{ fontSize: 10, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: t.active ? C.muted : C.success, background: "none", border: `1px solid ${t.active ? C.border : C.success}`, padding: "4px 10px", cursor: "pointer" }}>
                  {t.active ? "Ocultar" : "Mostrar"}
                </button>
                <button onClick={() => remove(t.id)} style={{ fontSize: 10, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, color: C.error, background: "none", border: `1px solid ${C.error}`, padding: "4px 10px", cursor: "pointer" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))
      )}
    </div>
  );
}

// ─── Chats panel ─────────────────────────────────────────────────────────────
function ChatsPanel({ token }: { token: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => {
    fetch("/api/admin/conversations", { headers: { "x-admin-token": token } })
      .then(r => r.json())
      .then(d => setConversations(d.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/admin/conversations/${id}/messages`, { headers: { "x-admin-token": token } });
      const d = await res.json();
      setMessages(d.messages ?? []);
    } catch { setMessages([]); }
    setLoadingMsgs(false);
  }

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>;

  return (
    <div>
      <p style={{ fontSize: 13, color: C.secondary, marginBottom: 16 }}>{conversations.length} conversacion{conversations.length !== 1 ? "es" : ""}</p>

      {conversations.length === 0 ? (
        <p style={{ color: C.muted, textAlign: "center", padding: 40 }}>Sin conversaciones aun.</p>
      ) : conversations.map(conv => (
        <div key={conv.id} style={{ marginBottom: 8 }}>
          <div
            onClick={() => toggleExpand(conv.id)}
            style={{
              backgroundColor: C.surface, padding: "14px 16px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            {/* Channel icon */}
            <span style={{ fontSize: 18 }}>{conv.channel === "whatsapp" ? "📱" : "💬"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.white }}>
                  {conv.customer_name || conv.customer_id.slice(0, 12)}
                </span>
                <Badge label={conv.channel} color={conv.channel === "whatsapp" ? "#25D366" : C.crimson} />
                {conv.escalated && <Badge label="escalado" color={C.error} />}
              </div>
              <p style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {conv.last_message || "—"}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 11, color: C.muted }}>{conv.message_count} msgs</p>
              <p style={{ fontSize: 10, color: C.border }}>{fmt(conv.updated_at)}</p>
            </div>
          </div>

          {/* Expanded messages */}
          {expandedId === conv.id && (
            <div style={{ backgroundColor: "#FAFAFA", padding: "12px 16px", borderLeft: `3px solid ${C.crimson}`, maxHeight: 400, overflowY: "auto" }}>
              {loadingMsgs ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}><Spinner /></div>
              ) : messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 10, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "8px 12px", borderRadius: 10,
                    backgroundColor: msg.role === "user" ? C.crimson : C.surface,
                    color: msg.role === "user" ? C.pureWhite : C.white,
                    fontSize: 13, lineHeight: 1.5,
                  }}>
                    {msg.content}
                    <p style={{ fontSize: 9, color: msg.role === "user" ? "rgba(255,255,255,0.6)" : C.muted, marginTop: 4 }}>
                      {fmt(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {conv.channel === "whatsapp" && (
                <a
                  href={`https://wa.me/${conv.customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#25D366", fontWeight: 600 }}
                >
                  Responder en WhatsApp →
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Dashboard panel (analytics) ─────────────────────────────────────────────
function DashboardPanel({ token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard", { headers: { "x-admin-token": token } })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setData(d))
      .catch(err => console.error("[admin] dashboard load error:", err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>;
  if (!data) return <p style={{ color: C.error, textAlign: "center", padding: 40 }}>Error al cargar el dashboard. Verifica la conexión o el token.</p>;

  const maxDayCount = Math.max(1, ...data.ordersByDay.map(d => d.count));
  const maxFormatCount = Math.max(1, ...data.ordersByFormat.map(f => f.count));

  return (
    <div>
      {/* Revenue cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Hoy", value: data.revenue.today, color: C.crimson },
          { label: "Esta semana", value: data.revenue.week, color: C.warn },
          { label: "Este mes", value: data.revenue.month, color: C.success },
          { label: "Total", value: data.revenue.total, color: C.white },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: C.surface, padding: "16px 18px", borderLeft: `3px solid ${s.color}` }}>
            <p style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: s.color }}>
              ${s.value.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      {/* Orders chart (last 30 days) */}
      <div style={{ backgroundColor: C.surface, padding: 20, marginBottom: 20 }}>
        <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Pedidos (ultimos 30 dias)</p>
        {data.ordersByDay.length === 0 ? (
          <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>Sin datos aun.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
            {data.ordersByDay.map(d => (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: "100%", maxWidth: 20,
                  height: Math.max(4, (d.count / maxDayCount) * 100),
                  backgroundColor: C.crimson, borderRadius: 2,
                }} title={`${d.date}: ${d.count} orders, $${d.revenue}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Conversion funnel */}
        <div style={{ backgroundColor: C.surface, padding: 20 }}>
          <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Embudo</p>
          {[
            { label: "Leads", value: data.leads.total, color: C.warn },
            { label: "Pedidos", value: data.funnel.total, color: C.muted },
            { label: "Pagados", value: data.funnel.paid, color: C.success },
            { label: "Fallidos", value: data.funnel.failed, color: C.error },
            { label: "Reembolsados", value: data.funnel.refunded, color: C.secondary },
          ].map(f => {
            const maxVal = Math.max(1, data.leads.total, data.funnel.total);
            return (
              <div key={f.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.secondary }}>{f.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{f.value}</span>
                </div>
                <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${(f.value / maxVal) * 100}%`, backgroundColor: f.color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Format breakdown + blog stats */}
        <div style={{ backgroundColor: C.surface, padding: 20 }}>
          <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Por formato</p>
          {data.ordersByFormat.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>Sin datos.</p>
          ) : data.ordersByFormat.map(f => (
            <div key={f.format} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: C.secondary, textTransform: "uppercase", fontWeight: 600 }}>{f.format}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{f.count} · ${f.revenue.toFixed(2)}</span>
              </div>
              <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3 }}>
                <div style={{ height: "100%", width: `${(f.count / maxFormatCount) * 100}%`, backgroundColor: C.crimson, borderRadius: 3 }} />
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 16, paddingTop: 16 }}>
            <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Blog</p>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 12, color: C.secondary }}>{data.posts.total} posts</span>
              <span style={{ fontSize: 12, color: C.success }}>{data.posts.published} publicados</span>
              <span style={{ fontSize: 12, color: C.crimson }}>{data.posts.social} social</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div style={{ backgroundColor: C.surface, padding: 20 }}>
        <p style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Ultimos pedidos</p>
        {data.recentOrders.map(o => (
          <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div>
              <span style={{ fontSize: 12, color: C.secondary }}>{o.email}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{o.format}</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.white }}>${o.amount_usd}</span>
              <Badge label={o.status} color={o.status === "paid" ? C.success : o.status === "failed" ? C.error : C.muted} />
            </div>
          </div>
        ))}
        {data.recentOrders.length === 0 && <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 20 }}>Sin pedidos aun.</p>}
      </div>
    </div>
  );
}

// ─── Biblioteca — Chapter management ─────────────────────────────────────────
interface Chapter {
  id: number;
  format: "ebook" | "audio";
  chapter_number: number;
  title_es: string;
  title_en?: string;
  body_es?: string;
  body_en?: string;
  audio_url?: string;
  duration_seconds?: number;
}

function BibliotecaPanel({ token }: { token: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [counts, setCounts] = useState({ ebook: 0, audio: 0 });
  const [loading, setLoading] = useState(true);
  const [filterFormat, setFilterFormat] = useState<"all" | "ebook" | "audio">("all");
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState<Partial<Chapter & { chapterNumber: number; titleEs: string; titleEn: string; bodyEs: string; bodyEn: string; audioUrl: string; durationSeconds: string }>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [testToken, setTestToken] = useState<string | null>(null);

  const h = { "x-admin-token": token, "Content-Type": "application/json" };

  const load = async () => {
    setLoading(true);
    try {
      const fmt = filterFormat === "all" ? "" : `?format=${filterFormat}`;
      const res = await fetch(`/api/admin/chapters${fmt}`, { headers: h });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setChapters(data.chapters);
      setCounts(data.counts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterFormat]);

  // Load a test token for library preview links
  useEffect(() => {
    fetch("/api/store/admin/orders?status=paid", { headers: { "x-admin-token": token } })
      .then(r => r.json())
      .then(d => { if (d.orders?.[0]?.download_token) setTestToken(d.orders[0].download_token); })
      .catch(() => {});
  }, [token]);

  const openNew = () => {
    setEditing(null);
    setForm({ format: filterFormat === "all" ? "ebook" : filterFormat });
    setMsg(null);
  };

  const openEdit = (ch: Chapter) => {
    setEditing(ch);
    setForm({
      format: ch.format,
      chapterNumber: ch.chapter_number,
      titleEs: ch.title_es,
      titleEn: ch.title_en ?? "",
      bodyEs: ch.body_es ?? "",
      bodyEn: ch.body_en ?? "",
      audioUrl: ch.audio_url ?? "",
      durationSeconds: ch.duration_seconds ? String(ch.duration_seconds) : "",
    });
    setMsg(null);
  };

  const save = async () => {
    if (!form.format || !form.chapterNumber || !form.titleEs) {
      setMsg({ text: "Formato, número y título son obligatorios.", ok: false });
      return;
    }
    setSaving(true);
    try {
      const body = {
        format: form.format,
        chapterNumber: Number(form.chapterNumber),
        titleEs: form.titleEs,
        titleEn: form.titleEn || null,
        bodyEs: form.bodyEs || null,
        bodyEn: form.bodyEn || null,
        audioUrl: form.audioUrl || null,
        durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : null,
      };
      let res: Response;
      if (editing) {
        res = await fetch(`/api/admin/chapters/${editing.id}`, { method: "PATCH", headers: h, body: JSON.stringify(body) });
      } else {
        res = await fetch("/api/admin/chapters", { method: "POST", headers: h, body: JSON.stringify(body) });
      }
      if (!res.ok) throw new Error();
      setMsg({ text: editing ? "Capítulo actualizado." : "Capítulo creado.", ok: true });
      setEditing(null);
      setForm({});
      await load();
    } catch {
      setMsg({ text: "Error al guardar.", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const del = async (ch: Chapter) => {
    if (!window.confirm(`¿Eliminar capítulo ${ch.chapter_number}?`)) return;
    try {
      const res = await fetch(`/api/admin/chapters/${ch.id}`, { method: "DELETE", headers: h });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setMsg({ text: "Error al eliminar.", ok: false });
    }
  };

  const isEditorOpen = form.format !== undefined && (editing !== null || Object.keys(form).length > 0);

  return (
    <div>
      {/* ── Media Library ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.white, fontSize: 20, margin: "0 0 16px" }}>Biblioteca de Medios</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {[
            { src: "/cover-es.png", label: "Portada ES", type: "Imagen" },
            { src: "/cover-en.png", label: "Portada EN", type: "Imagen" },
            { src: "/cover-it.png", label: "Portada IT", type: "Imagen" },
            { src: "/daya.jpg", label: "Foto autora", type: "Imagen" },
          ].map(item => (
            <div key={item.src} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 10, textAlign: "center" }}>
              <img src={item.src} alt={item.label} style={{ width: "100%", height: 120, objectFit: "cover", objectPosition: "center top", marginBottom: 8, borderRadius: 2 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>{item.label}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{item.type}</div>
            </div>
          ))}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 10, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: 28, color: C.crimson, marginBottom: 8 }}>🎧</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.white }}>Audio (ES + EN)</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>30 archivos MP3</div>
            <div style={{ fontSize: 10, color: C.muted }}>~128 MB total</div>
          </div>
        </div>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${C.border}`, margin: "24px 0" }} />

      {/* ── Chapter Management ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.white, fontSize: 20, margin: 0 }}>Capítulos</h2>
          <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            {counts.ebook} capítulos eBook · {counts.audio} capítulos Audio
          </p>
        </div>
        <button onClick={openNew} style={{ background: C.crimson, color: "#FBF7F1", border: "none", padding: "10px 20px", cursor: "pointer", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 12, letterSpacing: ".08em" }}>
          + Nuevo capítulo
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${C.border}` }}>
        {(["all", "ebook", "audio"] as const).map(f => (
          <button key={f} onClick={() => setFilterFormat(f)} style={{
            padding: "8px 20px", border: "none", background: "none", cursor: "pointer",
            color: filterFormat === f ? C.white : C.muted, fontSize: 12, letterSpacing: ".06em",
            borderBottom: filterFormat === f ? `2px solid ${C.crimson}` : "2px solid transparent",
            fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700,
          }}>
            {f === "all" ? "Todos" : f === "ebook" ? "eBook" : "Audio"}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: "10px 16px", marginBottom: 16, background: msg.ok ? C.success + "22" : C.error + "22", color: msg.ok ? C.success : C.error, fontSize: 13 }}>
          {msg.text}
        </div>
      )}

      {/* Editor form */}
      {isEditorOpen && (
        <div style={{ background: C.surface, padding: 20, marginBottom: 24, border: `1px solid ${C.border}` }}>
          <h3 style={{ color: C.white, fontFamily: "'Playfair Display', Georgia, serif", marginTop: 0, marginBottom: 16 }}>
            {editing ? `Editar capítulo ${editing.chapter_number}` : "Nuevo capítulo"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Formato *</label>
              <select value={form.format ?? "ebook"} onChange={e => setForm(f => ({ ...f, format: e.target.value as "ebook" | "audio" }))}
                style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13 }}>
                <option value="ebook">eBook</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Número de capítulo *</label>
              <input type="number" value={form.chapterNumber ?? ""} onChange={e => setForm(f => ({ ...f, chapterNumber: Number(e.target.value) }))}
                style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Título (ES) *</label>
              <input value={form.titleEs ?? ""} onChange={e => setForm(f => ({ ...f, titleEs: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Título (EN)</label>
              <input value={form.titleEn ?? ""} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
            </div>
          </div>
          {form.format !== "audio" && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Contenido HTML (ES)</label>
                <textarea value={form.bodyEs ?? ""} onChange={e => setForm(f => ({ ...f, bodyEs: e.target.value }))} rows={8}
                  style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Contenido HTML (EN)</label>
                <textarea value={form.bodyEn ?? ""} onChange={e => setForm(f => ({ ...f, bodyEn: e.target.value }))} rows={8}
                  style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "monospace", resize: "vertical", boxSizing: "border-box" }} />
              </div>
            </>
          )}
          {form.format === "audio" && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Ruta del archivo de audio</label>
                <input value={form.audioUrl ?? ""} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="/app/audio/capitulo-01.mp3"
                  style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", color: C.muted, fontSize: 11, marginBottom: 4 }}>Duración (segundos)</label>
                <input type="number" value={form.durationSeconds ?? ""} onChange={e => setForm(f => ({ ...f, durationSeconds: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={() => { setForm({}); setEditing(null); setMsg(null); }} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>
              Cancelar
            </button>
            <button onClick={save} disabled={saving} style={{ background: C.crimson, color: "#FBF7F1", border: "none", padding: "8px 24px", cursor: saving ? "default" : "pointer", fontSize: 13, fontFamily: "'Playfair Display', Georgia, serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Chapters list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.crimson, borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
        </div>
      ) : chapters.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>
          No hay capítulos aún. Agrega el primero con el botón de arriba.
        </div>
      ) : (
        <>
          {testToken && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
              <span style={{ color: C.muted }}>Vista previa como cliente:</span>
              <a href={`/library/${testToken}`} target="_blank" rel="noopener" style={{ color: C.crimson, textDecoration: "none", fontWeight: 700 }}>
                Abrir Biblioteca →
              </a>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chapters.map(ch => (
              <div key={ch.id} style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 32, height: 32, background: ch.format === "ebook" ? C.crimson + "33" : C.warn + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: ch.format === "ebook" ? C.crimson : C.warn, fontWeight: 700, flexShrink: 0 }}>
                    {ch.chapter_number}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: C.white, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.title_es}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {ch.format === "ebook" ? "eBook" : "Audio"}
                      {ch.duration_seconds ? ` · ${Math.floor(ch.duration_seconds / 60)}:${String(ch.duration_seconds % 60).padStart(2, "0")}` : ""}
                      {ch.body_es ? ` · ${Math.round(ch.body_es.length / 5)} palabras` : ""}
                      {ch.audio_url ? ` · ${ch.audio_url}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => setPreviewId(previewId === ch.id ? null : ch.id)}
                      style={{ background: previewId === ch.id ? C.crimson : "none", border: `1px solid ${C.crimson}`, color: previewId === ch.id ? "#FBF7F1" : C.crimson, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}
                    >
                      {ch.format === "ebook" ? "Leer" : "▶ Play"}
                    </button>
                    <button onClick={() => openEdit(ch)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>Editar</button>
                    <button onClick={() => del(ch)} style={{ background: "none", border: `1px solid ${C.error}33`, color: C.error, padding: "5px 12px", cursor: "pointer", fontSize: 12 }}>✕</button>
                  </div>
                </div>
                {/* Inline preview */}
                {previewId === ch.id && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px 20px", background: C.bg }}>
                    {ch.format === "ebook" ? (
                      ch.body_es ? (
                        <div
                          style={{ fontSize: 14, lineHeight: 1.8, color: C.white, maxHeight: 400, overflowY: "auto", paddingRight: 8 }}
                          dangerouslySetInnerHTML={{ __html: ch.body_es }}
                        />
                      ) : (
                        <p style={{ color: C.muted, fontSize: 13 }}>Sin contenido. Usa "Editar" para agregar el HTML del capítulo.</p>
                      )
                    ) : (
                      <div>
                        <audio
                          controls
                          src={`/api/library/admin-preview/${ch.chapter_number}?token=${token}`}
                          style={{ width: "100%", accentColor: C.crimson }}
                          onError={() => {}}
                        />
                        <p style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>
                          Archivo: {ch.audio_url || "no configurado"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Leads Panel ──────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  phone: string | null;
  lang: string;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  newsletter_opt_in: boolean;
  email_sequence_step: number;
  open_count: number;
  click_count: number;
  converted_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
}

const SOURCE_LABELS: Record<string, string> = {
  landing: "Landing",
  checkout_abandoned: "Carrito abandonado",
  checkout: "Compra",
  blog: "Blog",
};

function LeadsPanel({ token }: { token: string }) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const h = { "x-admin-token": token };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/leads?limit=500", { headers: h });
      const d = await r.json();
      setAllLeads(d.leads ?? []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const exportCsv = () => {
    const src = filterSource !== "all" ? `?source=${filterSource}` : "";
    const url = `/api/admin/leads/export.csv${src}`;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "leads.csv");
    // Need auth header — use fetch + blob approach
    fetch(url, { headers: h })
      .then(r => r.blob())
      .then(blob => {
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
      });
  };

  const sources = ["all", ...Array.from(new Set(allLeads.map(l => l.source)))];

  const visible = allLeads.filter(l => {
    if (filterSource !== "all" && l.source !== filterSource) return false;
    if (filterStatus === "converted" && !l.converted_at) return false;
    if (filterStatus === "subscribed" && (!l.newsletter_opt_in || l.unsubscribed_at)) return false;
    if (filterStatus === "unsubscribed" && !l.unsubscribed_at) return false;
    if (filterStatus === "abandoned" && l.source !== "checkout_abandoned") return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.email.includes(q) && !(l.first_name ?? "").toLowerCase().includes(q) && !(l.phone ?? "").includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total:     allLeads.length,
    converted: allLeads.filter(l => l.converted_at).length,
    abandoned: allLeads.filter(l => l.source === "checkout_abandoned").length,
    subscribed: allLeads.filter(l => l.newsletter_opt_in && !l.unsubscribed_at).length,
  };

  const stepLabel = (step: number) => {
    if (step === 0)  return { label: "Nuevo", color: C.crimson };
    if (step === 99) return { label: "Compró", color: C.success };
    return { label: `Drip ${step}`, color: C.warn };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.white, fontSize: 20, margin: 0 }}>Leads</h2>
        <button onClick={exportCsv} style={{ padding: "8px 20px", background: "none", border: `1px solid ${C.warn}`, color: C.warn, cursor: "pointer", fontSize: 12, fontFamily: "'Playfair Display', Georgia, serif" }}>
          ↓ Exportar CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total",      val: stats.total,     color: C.white },
          { label: "Suscritos",  val: stats.subscribed, color: C.crimson },
          { label: "Compraron",  val: stats.converted,  color: C.success },
          { label: "Abandonaron",val: stats.abandoned,  color: C.warn },
        ].map(s => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          type="search" placeholder="Buscar email, nombre, teléfono…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 200px", padding: "8px 12px", background: C.surface, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, outline: "none" }}
        />
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
          style={{ padding: "8px 10px", background: C.surface, color: C.white, border: `1px solid ${C.border}`, fontSize: 12 }}>
          {sources.map(s => <option key={s} value={s}>{s === "all" ? "Todas las fuentes" : SOURCE_LABELS[s] ?? s}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "8px 10px", background: C.surface, color: C.white, border: `1px solid ${C.border}`, fontSize: 12 }}>
          <option value="all">Todos los estados</option>
          <option value="subscribed">Suscritos</option>
          <option value="converted">Compraron</option>
          <option value="abandoned">Carrito abandonado</option>
          <option value="unsubscribed">Desuscritos</option>
        </select>
      </div>

      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{visible.length} resultado{visible.length !== 1 ? "s" : ""}</div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.crimson, borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>No hay leads con esos filtros.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {["Nombre","Email","Teléfono","Fuente","Estado","Opens","Clicks","UTM","Fecha"].map(col => (
                  <th key={col} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 600, whiteSpace: "nowrap", borderBottom: `1px solid ${C.border}` }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(l => {
                const st = stepLabel(l.email_sequence_step);
                return (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }} onMouseEnter={e => (e.currentTarget.style.background = C.surface)} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <td style={{ padding: "9px 12px", color: C.white }}>{l.first_name ?? <span style={{ color: C.muted }}>—</span>}</td>
                    <td style={{ padding: "9px 12px", color: C.muted }}>{l.email}</td>
                    <td style={{ padding: "9px 12px", color: C.muted }}>{l.phone ?? <span style={{ color: C.border }}>—</span>}</td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", background: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>{SOURCE_LABELS[l.source] ?? l.source}</span>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", color: st.color, border: `1px solid ${st.color}33`, background: st.color + "11" }}>{st.label}</span>
                      {l.unsubscribed_at && <span style={{ fontSize: 10, marginLeft: 4, color: C.error }}>Desus.</span>}
                    </td>
                    <td style={{ padding: "9px 12px", color: C.muted, textAlign: "center" }}>{l.open_count}</td>
                    <td style={{ padding: "9px 12px", color: C.muted, textAlign: "center" }}>{l.click_count}</td>
                    <td style={{ padding: "9px 12px", color: C.muted, fontSize: 11 }}>{l.utm_source ? `${l.utm_source}/${l.utm_medium ?? ""}` : "—"}</td>
                    <td style={{ padding: "9px 12px", color: C.muted, whiteSpace: "nowrap" }}>{fmtDate(l.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Documentos Panel ─────────────────────────────────────────────────────────
interface DocItem {
  id: number;
  label: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  category: string;
  uploaded_at: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CATEGORIES = ["general", "factura", "contrato", "soporte", "legal", "impuestos", "otro"];

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/vnd.ms-excel": "📊",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
  "image/jpeg": "🖼️", "image/png": "🖼️", "image/webp": "🖼️",
};
function mimeIcon(mime: string) { return MIME_ICONS[mime] ?? "📎"; }

function DocumentosPanel({ token }: { token: string }) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("general");
  const [file, setFile] = useState<File | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const h = { "x-admin-token": token };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/documents", { headers: h });
      const d = await r.json();
      setDocs(d.documents ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label || file.name);
      fd.append("category", category);
      const r = await fetch("/api/admin/documents", { method: "POST", headers: h, body: fd });
      if (!r.ok) throw new Error((await r.json()).error ?? "Error");
      setMsg({ text: "Documento subido correctamente.", ok: true });
      setLabel(""); setCategory("general"); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (e: any) {
      setMsg({ text: e.message, ok: false });
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc: DocItem) => {
    const r = await fetch(`/api/admin/documents/${doc.id}/download`, { headers: h });
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = doc.filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const del = async (doc: DocItem) => {
    if (!confirm(`¿Eliminar "${doc.label}"?`)) return;
    await fetch(`/api/admin/documents/${doc.id}`, { method: "DELETE", headers: h });
    await load();
  };

  const visible = filterCat === "all" ? docs : docs.filter(d => d.category === filterCat);

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.white, fontSize: 20, margin: "0 0 20px" }}>Documentos</h2>

      {/* Upload */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "18px 20px", marginBottom: 20 }}>
        <p style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>PDF, Word, Excel, imágenes · máx. 20 MB</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>Nombre / etiqueta</label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder="ej. Factura Stripe Mayo 2026"
              style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ flex: "1 1 130px" }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", background: C.bg, color: C.white, border: `1px solid ${C.border}`, fontSize: 13 }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ flex: "2 1 200px" }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4 }}>Archivo</label>
            <input ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.webp"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%", fontSize: 12, color: C.muted }}
            />
          </div>
          <button
            onClick={upload} disabled={!file || uploading}
            style={{ padding: "9px 24px", background: file && !uploading ? C.crimson : C.muted, color: "#FBF7F1", border: "none", cursor: file && !uploading ? "pointer" : "default", fontSize: 13, fontFamily: "'Playfair Display', Georgia, serif", whiteSpace: "nowrap" }}
          >
            {uploading ? "Subiendo…" : "Subir"}
          </button>
        </div>
        {msg && <p style={{ marginTop: 10, fontSize: 13, color: msg.ok ? C.success : C.error }}>{msg.text}</p>}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {["all", ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "7px 16px", border: "none", background: "none", cursor: "pointer", whiteSpace: "nowrap",
            color: filterCat === c ? C.white : C.muted, fontSize: 12, letterSpacing: ".05em",
            borderBottom: filterCat === c ? `2px solid ${C.crimson}` : "2px solid transparent",
          }}>
            {c === "all" ? "Todos" : c.charAt(0).toUpperCase() + c.slice(1)}
            {c !== "all" && <span style={{ marginLeft: 4, fontSize: 10, color: C.muted }}>({docs.filter(d => d.category === c).length})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.crimson, borderRadius: "50%", animation: "spin .7s linear infinite", margin: "0 auto" }} />
        </div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 13 }}>
          {docs.length === 0 ? "No hay documentos. Sube el primero arriba." : "Sin documentos en esta categoría."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {visible.map(doc => (
            <div key={doc.id} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{mimeIcon(doc.mime_type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.label}</div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                  {doc.category} · {fmtSize(doc.size_bytes)} · {fmtDate(doc.uploaded_at)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => download(doc)} style={{ padding: "5px 14px", background: "none", border: `1px solid ${C.crimson}`, color: C.crimson, cursor: "pointer", fontSize: 12 }}>
                  ↓ Descargar
                </button>
                <button onClick={() => del(doc)} style={{ padding: "5px 10px", background: "none", border: `1px solid ${C.error}33`, color: C.error, cursor: "pointer", fontSize: 12 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Credenciales Panel ───────────────────────────────────────────────────────
function CredencialesPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const CopyBtn = ({ val, k }: { val: string; k: string }) => (
    <button
      onClick={() => copy(val, k)}
      style={{ padding: "4px 12px", fontSize: 11, background: copied === k ? C.success : "none", border: `1px solid ${copied === k ? C.success : C.border}`, color: copied === k ? "#fff" : C.muted, cursor: "pointer", transition: "all .2s" }}
    >
      {copied === k ? "✓" : "Copy"}
    </button>
  );

  const creds = [
    {
      icon: "✉️", title: "Email — Hostinger Mail", link: "https://mail.hostinger.com", linkLabel: "Abrir Hostinger Mail →",
      rows: [
        { label: "Email", val: "daya@codigosdemujeres.com", k: "email-email" },
        { label: "Password", val: "Mujeres2026#", k: "email-pass", masked: true },
      ],
    },
    {
      icon: "💳", title: "Stripe — Pagos", link: "https://dashboard.stripe.com", linkLabel: "Abrir Stripe Dashboard →",
      rows: [
        { label: "Email", val: "daya@codigosdemujeres.com", k: "stripe-email" },
        { label: "Password", val: "Mujeres2026#", k: "stripe-pass", masked: true },
      ],
    },
    {
      icon: "🖥️", title: "Hostinger — VPS & Dominio", link: "https://hpanel.hostinger.com", linkLabel: "Abrir Hostinger Panel →",
      rows: [
        { label: "Email", val: "daya@codigosdemujeres.com", k: "host-email" },
        { label: "Password", val: "Mujeres2026#", k: "host-pass", masked: true },
      ],
    },
    {
      icon: "📊", title: "Meta — Facebook & Instagram", link: "https://business.facebook.com", linkLabel: "Abrir Meta Business →",
      rows: [
        { label: "Email", val: "hello@codigosdemujeres.com", k: "meta-email" },
      ],
    },
  ];

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: C.white, fontSize: 20, margin: "0 0 20px" }}>Accesos & Credenciales</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {creds.map(card => (
          <div key={card.title} style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 16 }}>{card.icon}</span>
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, color: C.warn, fontWeight: 700, letterSpacing: ".05em" }}>{card.title}</span>
            </div>
            {card.rows.map(row => (
              <div key={row.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                <span style={{ fontSize: 11, color: C.muted, width: 64, flexShrink: 0 }}>{row.label}</span>
                <span style={{ fontSize: 13, color: C.white, fontFamily: row.masked ? "monospace" : "inherit", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.val}</span>
                <CopyBtn val={row.val} k={row.k} />
              </div>
            ))}
            <a href={card.link} target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: 6, fontSize: 12, color: C.crimson, textDecoration: "none", fontWeight: 600 }}>{card.linkLabel}</a>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────
function DashboardShell({ token }: { token: string }) {
  const [tab, setTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard",    label: "Dashboard" },
    { id: "orders",       label: "Pedidos" },
    { id: "posts",        label: "Easy Social" },
    { id: "chats",        label: "Chats" },
    { id: "testimonials", label: "Testimonios" },
    { id: "biblioteca",   label: "Biblioteca" },
    { id: "credenciales", label: "🔑 Accesos" },
    { id: "documentos",   label: "📁 Documentos" },
    { id: "leads",        label: "👥 Leads" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${C.surface}`, position: "sticky", top: 0, zIndex: 40, backgroundColor: C.bg }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.1em", color: C.white }}>CODIGOS · ADMIN</span>
        <button onClick={() => window.location.reload()} style={{ fontSize: 11, color: C.error, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Salir
        </button>
      </nav>

      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 24px", fontSize: 12, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", color: tab === t.id ? C.white : C.muted, borderBottom: tab === t.id ? `2px solid ${C.crimson}` : "2px solid transparent", whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {tab === "dashboard"    && <DashboardPanel    token={token} />}
        {tab === "orders"       && <OrdersPanel        token={token} />}
        {tab === "posts"        && <EasySocialPanel    token={token} />}
        {tab === "chats"        && <ChatsPanel         token={token} />}
        {tab === "testimonials" && <TestimonialsPanel  token={token} />}
        {tab === "biblioteca"   && <BibliotecaPanel    token={token} />}
        {tab === "credenciales" && <CredencialesPanel />}
        {tab === "documentos"   && <DocumentosPanel   token={token} />}
        {tab === "leads"        && <LeadsPanel        token={token} />}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
// Token is kept in React state only — never persisted to sessionStorage/localStorage
// (any script on the page could read it, including XSS payloads)
export default function Admin() {
  const [token, setToken] = useState<string | null>(null);
  if (!token) return <Login onAuth={setToken} />;
  return <DashboardShell token={token} />;
}
