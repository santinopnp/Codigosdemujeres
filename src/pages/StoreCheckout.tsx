import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { site, formatPrice, formatOriginalPrice, formatLabel, allProducts, type ProductKey, type ProductType } from "@/config/site";
import { trackEvent } from "@/components/FacebookPixel";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useLocalCurrency } from "@/hooks/useLocalCurrency";

function fetchT(url: string, opts?: RequestInit, ms = 30000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ─── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  es: {
    back: "← Volver",
    title: "Finalizar compra",
    step_account: "Cuenta",
    step_payment: "Pago",
    step_confirm: "Listo",
    first_name: "Nombre",
    first_name_ph: "María",
    last_name: "Apellido",
    last_name_ph: "García",
    email_label: "Correo electrónico",
    email_placeholder: "tu@correo.com",
    email_hint: "Te enviaremos el acceso a este correo.",
    continue: "Continuar",
    pay_title: "Método de pago",
    pay_card: "Tarjeta de crédito / débito",
    card_redirect: "Se abrirá una ventana segura para ingresar los datos de tu tarjeta.",
    pay_now: "Pagar ahora",
    order_summary: "Resumen del pedido",
    formats: { ebook: formatLabel("ebook", "es"), audio: formatLabel("audio", "es"), bundle: formatLabel("bundle", "es") },
    prices:  { ebook: formatPrice("ebook"), audio: formatPrice("audio"), bundle: formatPrice("bundle") },
    guarantee: "Garantía de devolución 7 días",
    secure: "Pago seguro · SSL",
    confirm_title: "¡Compra exitosa!",
    confirm_body: "Revisa tu correo — te enviamos tu enlace personal para leer o escuchar tu libro.",
    confirm_note: "Acceso de por vida — tu biblioteca no expira.",
    confirm_cta: "Volver al inicio",
    share_heading: "Cuéntale a tus amigas",
    share_body: "Ayuda a otras mujeres a descubrir este libro.",
    share_text: "Acabo de leer Códigos de Dayana Guerrero 📚 ¡Lo recomiendo! → codigosdemujeres.com",
    share_publish: "✓ Compartir",
    share_skip: "✗ Omitir",
    view_order: "Ver estado del pedido",
    processing: "Procesando…",
    error_email: "Ingresa un correo válido.",
    error_name: "Ingresa tu nombre.",
    error_generic: "Algo salió mal. Intenta de nuevo.",
  },
  en: {
    back: "← Back",
    title: "Checkout",
    step_account: "Account",
    step_payment: "Payment",
    step_confirm: "Done",
    first_name: "First name",
    first_name_ph: "Maria",
    last_name: "Last name",
    last_name_ph: "Garcia",
    email_label: "Email address",
    email_placeholder: "you@email.com",
    email_hint: "We'll send access to this email.",
    continue: "Continue",
    pay_title: "Payment method",
    pay_card: "Credit / Debit card",
    card_redirect: "A secure payment window will open to enter your card details.",
    pay_now: "Pay now",
    order_summary: "Order summary",
    formats: { ebook: formatLabel("ebook", "en"), audio: formatLabel("audio", "en"), bundle: formatLabel("bundle", "en") },
    prices:  { ebook: formatPrice("ebook"), audio: formatPrice("audio"), bundle: formatPrice("bundle") },
    guarantee: "7-day money-back guarantee",
    secure: "Secure payment · SSL",
    confirm_title: "Purchase successful!",
    confirm_body: "Check your inbox — we sent your personal link to read or listen to your book.",
    confirm_note: "Lifetime access — your library never expires.",
    confirm_cta: "Back to home",
    share_heading: "Tell your friends",
    share_body: "Help other women discover this book.",
    share_text: "I just read Códigos by Dayana Guerrero 📚 Highly recommend! → codigosdemujeres.com",
    share_publish: "✓ Share",
    share_skip: "✗ Skip",
    view_order: "View order status",
    processing: "Processing…",
    error_email: "Enter a valid email address.",
    error_name: "Enter your name.",
    error_generic: "Something went wrong. Please try again.",
  },
  it: {
    back: "← Indietro",
    title: "Pagamento",
    step_account: "Account",
    step_payment: "Pagamento",
    step_confirm: "Fatto",
    first_name: "Nome",
    first_name_ph: "Maria",
    last_name: "Cognome",
    last_name_ph: "Rossi",
    email_label: "Indirizzo email",
    email_placeholder: "la@tuaemail.it",
    email_hint: "Ti invieremo l'accesso a questa email.",
    continue: "Continua",
    pay_title: "Metodo di pagamento",
    pay_card: "Carta di credito / debito",
    card_redirect: "Si aprirà una finestra sicura per inserire i dati della tua carta.",
    pay_now: "Paga ora",
    order_summary: "Riepilogo ordine",
    formats: { ebook: formatLabel("ebook", "it"), audio: formatLabel("audio", "it"), bundle: formatLabel("bundle", "it") },
    prices:  { ebook: formatPrice("ebook"), audio: formatPrice("audio"), bundle: formatPrice("bundle") },
    guarantee: "Garanzia soddisfatti o rimborsati — 7 giorni",
    secure: "Pagamento sicuro · SSL",
    confirm_title: "Acquisto completato!",
    confirm_body: "Controlla la tua email — ti abbiamo inviato il link personale per leggere o ascoltare il libro.",
    confirm_note: "Accesso a vita — la tua biblioteca non scade.",
    confirm_cta: "Torna alla home",
    share_heading: "Raccontalo alle tue amiche",
    share_body: "Aiuta le altre donne a scoprire questo libro.",
    share_text: "Ho appena letto I Codici di Dayana Guerrero 📚 Lo consiglio vivamente! → codigosdemujeres.com",
    share_publish: "✓ Condividi",
    share_skip: "✗ Salta",
    view_order: "Vedi stato dell'ordine",
    processing: "Elaborazione in corso…",
    error_email: "Inserisci un indirizzo email valido.",
    error_name: "Inserisci il tuo nome.",
    error_generic: "Qualcosa è andato storto. Riprova.",
  },
  pt: {
    back: "← Voltar",
    title: "Finalizar compra",
    step_account: "Conta",
    step_payment: "Pagamento",
    step_confirm: "Pronto",
    first_name: "Nome",
    first_name_ph: "Maria",
    last_name: "Sobrenome",
    last_name_ph: "Silva",
    email_label: "Endereço de e-mail",
    email_placeholder: "seu@email.com",
    email_hint: "Enviaremos o acesso para este e-mail.",
    continue: "Continuar",
    pay_title: "Método de pagamento",
    pay_card: "Cartão de crédito / débito",
    card_redirect: "Uma janela segura será aberta para inserir os dados do seu cartão.",
    pay_now: "Pagar agora",
    order_summary: "Resumo do pedido",
    formats: { ebook: formatLabel("ebook", "pt"), audio: formatLabel("audio", "pt"), bundle: formatLabel("bundle", "pt") },
    prices:  { ebook: formatPrice("ebook"), audio: formatPrice("audio"), bundle: formatPrice("bundle") },
    guarantee: "Garantia de devolução 7 dias",
    secure: "Pagamento seguro · SSL",
    confirm_title: "Compra realizada com sucesso!",
    confirm_body: "Verifique seu e-mail — enviamos seu link pessoal para ler ou ouvir seu livro.",
    confirm_note: "Acesso vitalício — sua biblioteca não expira.",
    confirm_cta: "Voltar ao início",
    share_heading: "Conte para suas amigas",
    share_body: "Ajude outras mulheres a descobrir este livro.",
    share_text: "Acabei de ler Códigos da Dayana Guerrero 📚 Recomendo muito! → codigosdemujeres.com",
    share_publish: "✓ Compartilhar",
    share_skip: "✗ Pular",
    view_order: "Ver status do pedido",
    processing: "Processando…",
    error_email: "Digite um e-mail válido.",
    error_name: "Digite seu nome.",
    error_generic: "Algo deu errado. Tente novamente.",
  },
} as const;

type Lang      = keyof typeof T;
type Format    = ProductKey;
type PayMethod = "card";
type Step      = 1 | 2 | 3;

const BOOK_FORMATS = new Set<string>(["ebook", "audio", "bundle"]);
function isBookFormat(f: string): boolean { return BOOK_FORMATS.has(f); }
function getProductType(f: string): ProductType { return allProducts[f as ProductKey]?.type ?? "book"; }
function getProductLabel(f: string, lang: Lang): string {
  const p = allProducts[f as ProductKey];
  if (!p) return f;
  if (lang === "en") return p.label_en;
  if (lang === "it") return p.label_it;
  if (lang === "pt") return p.label_pt;
  return p.label_es;
}
function getProductPrice(f: string): number { return allProducts[f as ProductKey]?.price ?? 0; }
function getProductOriginalPrice(f: string): number { return allProducts[f as ProductKey]?.original ?? 0; }

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, t }: { step: Step; t: typeof T["es"] }) {
  const steps = [t.step_account, t.step_payment, t.step_confirm];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const n      = (i + 1) as Step;
        const done   = step > n;
        const active = step === n;
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`step${done ? " done" : active ? " active" : ""}`}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : n}
              </div>
              <span style={{ color: active || done ? "#C2506A" : "#A89882", fontSize: "0.625rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 2, backgroundColor: step > n ? "#C2506A" : "#D9C9B0", margin: "0 0.5rem", marginBottom: "1.25rem" }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Order summary ────────────────────────────────────────────────────────────
function OrderSummary({ format, lang, t }: { format: Format; lang: Lang; t: typeof T["es"] }) {
  const price = getProductPrice(format);
  const { amount: localPrice } = useLocalCurrency(price);
  const origPrice = `$${getProductOriginalPrice(format).toFixed(2)}`;
  const label = getProductLabel(format, lang);
  return (
    <div className="card p-4 mb-6">
      <p className="text-xs text-textSecondary mb-3" style={{ letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Playfair Display', Georgia, serif" }}>{t.order_summary}</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="font-editorial text-sm" style={{ color: "#3D2B1F" }}>Códigos</p>
          <p className="text-xs mt-0.5" style={{ color: "#7A6652" }}>{label}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p className="text-xs" style={{ color: "#7A6652", textDecoration: "line-through" }}>{origPrice}</p>
          <p className="font-editorial text-lg" style={{ color: "#C2506A" }}>${price.toFixed(2)}</p>
          {localPrice && <p className="text-xs" style={{ color: "#7A6652" }}>≈ {localPrice}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Social share block (Step 3) ──────────────────────────────────────────────
function ShareBlock({ t, lang }: { t: typeof T["es"]; lang: Lang }) {
  const [shared, setShared] = useState(false);

  function handleShare() {
    const text = t.share_text;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      // Fallback: open WhatsApp web share
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    }
    setShared(true);
  }

  if (shared) return null;

  return (
    <div className="card p-5 mb-6 text-center" style={{ borderColor: "#C2506A" }}>
      <p className="font-editorial text-base mb-1" style={{ color: "#3D2B1F" }}>{t.share_heading}</p>
      <p className="text-xs mb-4" style={{ color: "#7A6652" }}>{t.share_body}</p>

      <div
        className="p-3 mb-4 text-xs text-left"
        style={{ backgroundColor: "#FBF7F1", borderLeft: "3px solid #C2506A", color: "#7A6652", lineHeight: 1.6 }}
      >
        "{t.share_text}"
      </div>

      <div className="flex gap-3">
        <button
          className="btn-primary"
          style={{ flex: 2 }}
          onClick={handleShare}
        >
          {t.share_publish}
        </button>
        <button
          onClick={() => setShared(true)}
          style={{
            flex: 1,
            background: "transparent",
            border: "2px solid #D9C9B0",
            color: "#A89882",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 600,
            fontSize: "0.8125rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0.625rem 0",
          }}
        >
          {t.share_skip}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StoreCheckout() {
  usePageMeta("Comprar | CÓDIGOS");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const langParam = params.get("lang") as Lang | null;
  const fmtParam  = params.get("format") ?? "bundle";

  const [lang]   = useState<Lang>(langParam === "en" ? "en" : langParam === "it" ? "it" : langParam === "pt" ? "pt" : "es");
  const resolvedFormat: Format = (fmtParam in allProducts) ? fmtParam as Format : "bundle";
  const [format] = useState<Format>(resolvedFormat);
  const productType = getProductType(format);
  const [step, setStep]         = useState<Step>(params.get("confirmed") === "1" ? 3 : 1);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>("card");

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");

  // Card form fields (step 2)
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth,   setExpMonth]   = useState("");
  const [expYear,    setExpYear]    = useState("");
  const [cvc,        setCvc]        = useState("");

  // Payment flow state
  const [cardPayStep,    setCardPayStep]    = useState<"form" | "tokenizing" | "charging" | "3ds">("form");
  const [threeDsUrl,     setThreeDsUrl]     = useState("");
  const [processingMsg,  setProcessingMsg]  = useState("");

  // ePayco SDK requires jQuery — load jQuery first, then epayco.min.js
  useEffect(() => {
    function loadEpayco() {
      if (document.getElementById("epayco-sdk")) return;
      const s = document.createElement("script");
      s.id  = "epayco-sdk";
      s.src = "https://checkout.epayco.co/epayco.min.js";
      document.head.appendChild(s);
    }

    if (document.getElementById("jquery-sdk")) {
      // jQuery already in DOM — load ePayco immediately
      loadEpayco();
      return;
    }
    const jq = document.createElement("script");
    jq.id  = "jquery-sdk";
    jq.src = "https://code.jquery.com/jquery-3.7.1.min.js";
    jq.onload = loadEpayco;
    document.head.appendChild(jq);
  }, []);

  // Expiry year options
  const currentYear = new Date().getFullYear();
  const expiryYears = Array.from({ length: 15 }, (_, i) => {
    const full = currentYear + i;
    return { label: String(full), value: String(full).slice(-2) };
  });

  function formatCardNum(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function getBrowserInfo() {
    return {
      language:       navigator.language || "es-CO",
      colorDepth:     screen.colorDepth  || 24,
      screenWidth:    screen.width       || 1920,
      screenHeight:   screen.height      || 1080,
      timezoneOffset: new Date().getTimezoneOffset(),
      javaEnabled:    false,
      userAgent:      navigator.userAgent,
    };
  }

  function tokenizeCard(pubKey: string, testMode: boolean): Promise<string> {
    // Wait up to 10s for the ePayco SDK to become available (loaded async after jQuery)
    function waitForSDK(retries: number): Promise<any> {
      return new Promise((res, rej) => {
        const ep = (window as any).ePayco;
        if (ep) { res(ep); return; }
        if (retries <= 0) {
          rej(new Error(lang === "en" ? "Payment SDK failed to load. Please refresh." : "SDK de pago no cargó. Recarga la página."));
          return;
        }
        setTimeout(() => waitForSDK(retries - 1).then(res).catch(rej), 500);
      });
    }

    return waitForSDK(20).then(ep => new Promise((resolve, reject) => {
      try {
        ep.setPublicKey(pubKey);
        if (testMode && typeof ep.setTestMode === "function") ep.setTestMode(true);
        const form = document.createElement("form");
        form.style.display = "none";
        const fields: Record<string, string> = {
          "card[number]":    cardNumber.replace(/\s/g, ""),
          "card[exp_year]":  "20" + expYear,
          "card[exp_month]": expMonth,
          "card[cvc]":       cvc,
          "card[name]":      `${firstName} ${lastName}`.trim(),
          "card[email]":     email.trim().toLowerCase(),
        };
        Object.entries(fields).forEach(([fieldName, value]) => {
          const input = document.createElement("input");
          // Both data-epayco (SDK field detection) and name (jQuery serialization) are required
          input.setAttribute("data-epayco", fieldName);
          input.setAttribute("name", fieldName);
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        ep.token.create(form, (firstArg: any, secondArg: any) => {
          form.remove();
          // Handle both SDK callback conventions:
          //   Old SDK: callback(tokenData)        — single arg
          //   New SDK: callback(error, tokenData) — error-first
          let error: any, tokenData: any;
          if (secondArg === undefined) {
            error = null; tokenData = firstArg;
          } else {
            error = firstArg; tokenData = secondArg;
          }
          if (error) {
            reject(new Error(typeof error === "string" ? error : (error.message || t.error_generic)));
            return;
          }
          if      (tokenData?.status && tokenData?.id)   resolve(String(tokenData.id));
          else if (tokenData?.token)                     resolve(String(tokenData.token));
          else if (tokenData?.data?.id)                  resolve(String(tokenData.data.id));
          else {
            const errs = tokenData?.data?.errors;
            let msg: string;
            if (errs && typeof errs === "object") {
              msg = Object.values(errs).flat().join(" ");
            } else if (tokenData?.message) {
              msg = tokenData.message;
            } else if (tokenData?.status === false) {
              msg = lang === "en"
                ? "Card data is incorrect. Check the number, expiry and CVC."
                : "Los datos de la tarjeta son incorrectos. Verifica el número, fecha y CVC.";
            } else {
              msg = t.error_generic;
            }
            reject(new Error(msg));
          }
        });
      } catch (err: any) {
        reject(err);
      }
    }));
  }

  function handle3DS2(threeDSecure: any) {
    const data = (threeDSecure.data || {}) as Record<string, any>;
    if (data.deviceDataCollectionUrl && data.accessToken) {
      const iframe  = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.name = "cardinal-ddc-frame";
      document.body.appendChild(iframe);
      const form   = document.createElement("form");
      form.method  = "POST";
      form.action  = data.deviceDataCollectionUrl;
      form.target  = "cardinal-ddc-frame";
      const input  = document.createElement("input");
      input.type   = "hidden";
      input.name   = "JWT";
      input.value  = data.accessToken;
      form.appendChild(input);
      document.body.appendChild(form);
      iframe.onload = () => setTimeout(() => {
        iframe.remove();
        form.remove();
        setStep(3);
        window.scrollTo({ top: 0 });
      }, 3000);
      form.submit();
      form.remove();
    } else {
      setStep(3);
      window.scrollTo({ top: 0 });
    }
  }

  // UI state — must be declared BEFORE any useEffect that puts these in its dep array
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [orderId, setOrderId] = useState<string | null>(params.get("orderId") ?? null);
  const [libraryToken, setLibraryToken] = useState<string | null>(null);

  // 3DS 1.0 — poll while bank iframe is visible
  // Declared after all useState so orderId / setLoading etc. are not in TDZ when deps are evaluated
  useEffect(() => {
    if (!threeDsUrl || !orderId) return;
    let cancelled = false;
    let retries   = 0;
    // 60 retries × 5 s = 5 minutes max wait; after that we surface a timeout error
    const MAX_RETRIES = 60;
    const poll = setInterval(async () => {
      if (++retries > MAX_RETRIES) {
        clearInterval(poll);
        if (!cancelled) {
          setThreeDsUrl("");
          setCardPayStep("form");
          setError(
            lang === "en" ? "Payment timed out. Please try again or contact support."
            : lang === "it" ? "Il pagamento è scaduto. Riprova o contatta il supporto."
            : lang === "pt" ? "Pagamento expirou. Tente novamente ou entre em contato com o suporte."
            : "El pago expiró. Intenta de nuevo o contacta a soporte."
          );
          setLoading(false);
        }
        return;
      }
      try {
        const res  = await fetchT(`/api/store/checkout/${orderId}/status`, undefined, 10000);
        if (!res.ok) return;
        const data = await res.json();
        if (data.downloadToken && !cancelled) {
          setLibraryToken(data.downloadToken);
          setPaymentVerified(true);
          clearInterval(poll);
          setThreeDsUrl("");
          setStep(3);
          window.scrollTo({ top: 0 });
        } else if (data.status === "failed" && !cancelled) {
          clearInterval(poll);
          setThreeDsUrl("");
          setCardPayStep("form");
          setError(lang === "en" ? "Payment was not confirmed." : lang === "it" ? "Pagamento non confermato." : lang === "pt" ? "Pagamento não confirmado." : "El pago no fue confirmado.");
          setLoading(false);
        }
      } catch { /* ignore network blips — retry on next tick */ }
    }, 5000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [threeDsUrl, orderId]);

  // Track checkout initiation
  useEffect(() => {
    trackEvent("InitiateCheckout", { content_name: format, currency: "USD", value: getProductPrice(format) });
  }, [format]);

  // Abandoned cart: capture lead as soon as email is filled in
  // Reset flag when email is cleared so the correct address is captured if the user re-types
  const abandonedRef = useRef(false);
  const prevEmailRef = useRef("");
  function handleEmailBlur() {
    // If user cleared the email field, reset so we capture the new address on next blur
    if (!email.trim() && abandonedRef.current) {
      abandonedRef.current = false;
    }
    if (abandonedRef.current || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return;
    // Only send if the email actually changed
    if (email.trim() === prevEmailRef.current) return;
    prevEmailRef.current = email.trim();
    abandonedRef.current = true;
    fetch("/api/store/leads/abandoned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lang: params.get("lang") === "en" ? "en" : params.get("lang") === "it" ? "it" : "es",
        format,
        utmSource:   sessionStorage.getItem("utm_source")   || undefined,
        utmMedium:   sessionStorage.getItem("utm_medium")   || undefined,
        utmCampaign: sessionStorage.getItem("utm_campaign") || undefined,
      }),
    }).catch(() => {});
  }

  // Poll for payment confirmation and get library token
  useEffect(() => {
    if (step !== 3 || !orderId || libraryToken) return;
    let cancelled = false;
    const poll = setInterval(async () => {
      try {
        const res = await fetchT(`/api/store/checkout/${orderId}/status`, undefined, 10000);
        if (!res.ok) return;
        const data = await res.json();
        if (data.downloadToken && !cancelled) {
          setLibraryToken(data.downloadToken);
          setPaymentVerified(true);
          clearInterval(poll);
        } else if (data.status === "failed" && !cancelled) {
          setPaymentVerified(false);
          clearInterval(poll);
        }
      } catch (e) {
        console.warn("[checkout] status poll failed:", (e as Error).message);
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(poll); };
  }, [step, orderId, libraryToken]);

  const t = T[lang];

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleStep1() {
    if (!firstName.trim()) { setError(t.error_name); return; }
    if (!validateEmail(email)) { setError(t.error_email); return; }
    setError("");
    setStep(2);
    window.scrollTo({ top: 0 });
  }

  async function handleStep2() {
    // ── Card validation ──────────────────────────────────────────────────────
    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      setError(lang === "en" ? "Invalid card number." : lang === "it" ? "Numero di carta non valido." : lang === "pt" ? "Número do cartão inválido." : "Número de tarjeta inválido.");
      return;
    }
    if (!expMonth || !expYear) {
      setError(lang === "en" ? "Enter the expiry date." : lang === "it" ? "Inserisci la data di scadenza." : lang === "pt" ? "Insira a data de validade." : "Ingresa la fecha de vencimiento.");
      return;
    }
    if (cvc.length < 3) {
      setError(lang === "en" ? "Invalid CVC." : lang === "it" ? "CVC non valido." : lang === "pt" ? "CVC inválido." : "CVC inválido.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Create order record — get orderId + epayco public key
      setCardPayStep("charging");
      setProcessingMsg(lang === "en" ? "Creating order…" : lang === "it" ? "Creazione ordine…" : lang === "pt" ? "Criando pedido…" : "Creando orden…");

      const orderRes = await fetchT("/api/store/order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:       email.trim(),
          firstName:   firstName.trim(),
          lastName:    lastName.trim(),
          format,
          paymentMethod: "card",
          lang,
          utmSource:   sessionStorage.getItem("utm_source")   || undefined,
          utmMedium:   sessionStorage.getItem("utm_medium")   || undefined,
          utmCampaign: sessionStorage.getItem("utm_campaign") || undefined,
        }),
      });
      if (!orderRes.ok) throw new Error("api_error");
      const orderData = await orderRes.json();
      const newOrderId = orderData.orderId as string;
      if (newOrderId) setOrderId(newOrderId);

      // 2. Tokenize card (never send raw PAN to backend)
      setCardPayStep("tokenizing");
      setProcessingMsg(lang === "en" ? "Securing card…" : lang === "it" ? "Protezione della carta…" : lang === "pt" ? "Protegendo cartão…" : "Asegurando tarjeta…");
      const tokenCard = await tokenizeCard(orderData.epaycoPublicKey, orderData.testMode);

      // 3. Charge with 3DS
      setCardPayStep("charging");
      setProcessingMsg(lang === "en" ? "Processing payment…" : lang === "it" ? "Elaborazione pagamento…" : lang === "pt" ? "Processando pagamento…" : "Procesando pago…");
      const chargeRes = await fetchT("/api/store/charge", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:     newOrderId,
          tokenCard,
          firstName:   firstName.trim(),
          lastName:    lastName.trim(),
          browserInfo: getBrowserInfo(),
        }),
      });
      if (!chargeRes.ok) throw new Error("api_error");
      const chargeData = await chargeRes.json();

      // 4. Route by result
      if (chargeData.status === "processing") {
        // Approved via API — webhook will confirm; start polling in step 3
        setStep(3);
        window.scrollTo({ top: 0 });
        return;
      }
      if (chargeData.status === "pending" && chargeData.redirectUrl) {
        // 3DS 1.0 — bank iframe + polling in parallel
        setThreeDsUrl(chargeData.redirectUrl as string);
        setCardPayStep("3ds");
        return;
      }
      if (chargeData.status === "pending" && chargeData.threeDSecure) {
        // 3DS 2.0 — Cardinal Commerce DDC (hidden iframe) then poll
        handle3DS2(chargeData.threeDSecure);
        return;
      }
      if (chargeData.status === "pending") {
        setStep(3);
        window.scrollTo({ top: 0 });
        return;
      }
      // Rejected or error
      setError(chargeData.error || t.error_generic);
      setCardPayStep("form");
    } catch (err: any) {
      setError(err?.message || t.error_generic);
      setCardPayStep("form");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FBF7F1" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-3" style={{ backgroundColor: "#FBF7F1", borderBottom: "1px solid #F3EBE0" }}>
        <span className="font-editorial text-xl" style={{ color: "#C2506A", letterSpacing: "0.12em" }}>Códigos</span>
        <div className="flex items-center gap-3">
          {step < 3 && (
            <button
              onClick={() => step === 1 ? navigate("/") : setStep(1)}
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "#7A6652", background: "none", border: "none", cursor: "pointer" }}
            >
              {t.back}
            </button>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1.25rem 6rem" }}>

        {step < 3 && (
          <>
            <h1 className="mb-6" style={{ fontSize: "1.5rem" }}>{t.title}</h1>
            <StepBar step={step} t={t} />
            <OrderSummary format={format} lang={lang} t={t} />
          </>
        )}

        {/* ── STEP 1: Account ── */}
        {step === 1 && (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            {/* Name row */}
            <div className="flex gap-3 mb-4">
              <div style={{ flex: 1 }}>
                <label className="field-label">{t.first_name}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={t.first_name_ph}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  autoFocus
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">{t.last_name}</label>
                <input
                  className="input"
                  type="text"
                  placeholder={t.last_name_ph}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="field-label">{t.email_label}</label>
              <input
                className="input"
                type="email"
                placeholder={t.email_placeholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                onKeyDown={e => e.key === "Enter" && handleStep1()}
                autoComplete="email"
              />
              <p className="mt-2 text-xs" style={{ color: "#A89882" }}>{t.email_hint}</p>
            </div>

            {error && <p className="mb-4 text-xs" style={{ color: "#C44D4D" }}>{error}</p>}

            <button className="btn-primary hidden sm:block" onClick={handleStep1}>{t.continue}</button>
          </div>
        )}

        {/* ── STEP 2: Card form ── */}
        {step === 2 && (
          <div style={{ animation: "fadeIn 0.25s ease", position: "relative" }}>

            {/* 3DS 1.0 — bank authentication overlay */}
            {cardPayStep === "3ds" && threeDsUrl && (
              <div style={{ position: "fixed", inset: 0, backgroundColor: "#FBF7F1", zIndex: 200, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #F3EBE0", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 32, height: 32, border: "3px solid #D9C9B0", borderTopColor: "#C2506A", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                  <div>
                    <p style={{ color: "#3D2B1F", fontWeight: 700, fontSize: "0.9rem", fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {lang === "en" ? "Bank authentication" : lang === "it" ? "Autenticazione bancaria" : lang === "pt" ? "Autenticação bancária" : "Autenticación bancaria"}
                    </p>
                    <p style={{ color: "#7A6652", fontSize: "0.72rem" }}>
                      {lang === "en" ? "Complete the verification in the window below." : lang === "it" ? "Completa la verifica nella finestra qui sotto." : lang === "pt" ? "Complete a verificação na janela abaixo." : "Completa la verificación en la ventana de abajo."}
                    </p>
                  </div>
                </div>
                <iframe
                  src={threeDsUrl}
                  title="3D Secure"
                  sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation allow-popups"
                  style={{ flex: 1, border: "none", width: "100%" }}
                />
              </div>
            )}

            {/* Processing overlay (tokenizing / charging) */}
            {(cardPayStep === "tokenizing" || cardPayStep === "charging") && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(251,247,241,0.92)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", minHeight: 280 }}>
                <div style={{ width: 40, height: 40, border: "3px solid #D9C9B0", borderTopColor: "#C2506A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <p style={{ color: "#7A6652", fontSize: "0.85rem" }}>{processingMsg}</p>
              </div>
            )}

            <p className="field-label mb-4">{t.pay_title}</p>

            {/* Card number */}
            <div className="mb-4">
              <label className="field-label">
                {lang === "en" ? "Card number" : lang === "it" ? "Numero di carta" : lang === "pt" ? "Número do cartão" : "Número de tarjeta"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNum(e.target.value))}
                  maxLength={19}
                  style={{ letterSpacing: "0.1em" }}
                />
                {/* Card brand icons (Visa / MC placeholder) */}
                <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "0.35rem", opacity: 0.6 }}>
                  <svg width="28" height="18" viewBox="0 0 28 18" fill="none"><rect width="28" height="18" rx="3" fill="#1A1F71"/><text x="4" y="13" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="Arial">VISA</text></svg>
                  <svg width="28" height="18" viewBox="0 0 28 18" fill="none"><rect width="28" height="18" rx="3" fill="#252525"/><circle cx="11" cy="9" r="5.5" fill="#EB001B" opacity="0.9"/><circle cx="17" cy="9" r="5.5" fill="#F79E1B" opacity="0.9"/></svg>
                </div>
              </div>
            </div>

            {/* Expiry + CVC */}
            <div className="flex gap-3 mb-4">
              <div style={{ flex: 2 }}>
                <label className="field-label">
                  {lang === "en" ? "Expiry" : lang === "it" ? "Scadenza" : lang === "pt" ? "Validade" : "Vencimiento"}
                </label>
                <div className="flex gap-2">
                  <select
                    className="input"
                    value={expMonth}
                    onChange={e => setExpMonth(e.target.value)}
                    autoComplete="cc-exp-month"
                    style={{ flex: 1 }}
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = String(i + 1).padStart(2, "0");
                      return <option key={m} value={m}>{m}</option>;
                    })}
                  </select>
                  <select
                    className="input"
                    value={expYear}
                    onChange={e => setExpYear(e.target.value)}
                    autoComplete="cc-exp-year"
                    style={{ flex: 1 }}
                  >
                    <option value="">AA</option>
                    {expiryYears.map(y => (
                      <option key={y.value} value={y.value}>{y.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label className="field-label">CVC</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cvc}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  style={{ letterSpacing: "0.15em" }}
                />
              </div>
            </div>

            {error && <p className="mb-4 text-xs" style={{ color: "#C44D4D" }}>{error}</p>}

            <button
              className="btn-primary hidden sm:block"
              onClick={handleStep2}
              disabled={loading || cardPayStep !== "form"}
            >
              {loading ? t.processing : `${t.pay_now} · $${getProductPrice(format).toFixed(2)}`}
            </button>

            {/* Trust badges */}
            <div className="flex justify-center gap-6 mt-5 text-xs" style={{ color: "#A89882" }}>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                {t.guarantee}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {t.secure}
              </span>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 3 && (
          <div className="flex flex-col items-center pt-10" style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Success icon or verifying spinner */}
            <div className="flex items-center justify-center mb-6" style={{ width: 72, height: 72, backgroundColor: "#F3EBE0", border: `2px solid ${paymentVerified ? "#C2506A" : "#D9C9B0"}` }}>
              {paymentVerified ? (
                <svg className="w-9 h-9" style={{ color: "#C2506A" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div style={{ width: 36, height: 36, border: "3px solid #D9C9B0", borderTopColor: "#C2506A", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              )}
            </div>

            <h1 className="mb-4 text-center" style={{ fontSize: "1.75rem" }}>
              {paymentVerified ? t.confirm_title : (lang === "en" ? "Verifying payment…" : lang === "it" ? "Verifica pagamento…" : lang === "pt" ? "Verificando pagamento…" : "Verificando pago…")}
            </h1>
            <p className="text-base mb-2 text-center" style={{ color: "#7A6652", maxWidth: 320 }}>
              {paymentVerified
                ? productType === "coaching"
                  ? (lang === "en" ? "Dayana will contact you soon to schedule your session." : lang === "it" ? "Dayana ti contatterà presto per pianificare la sessione." : lang === "pt" ? "Dayana entrará em contato em breve para agendar sua sessão." : "Dayana se pondrá en contacto contigo pronto para agendar la sesión.")
                  : productType === "digital"
                  ? (lang === "en" ? "Dayana will send your material within 24 hours." : lang === "it" ? "Dayana ti invierà il materiale entro 24 ore." : lang === "pt" ? "Dayana enviará seu material em até 24 horas." : "Dayana te enviará el material en las próximas 24 horas.")
                  : t.confirm_body
                : (lang === "en" ? "Please wait a moment." : lang === "it" ? "Attendi un momento." : lang === "pt" ? "Aguarde um momento." : "Espera un momento.")}
            </p>
            <p className="text-xs mb-8 text-center" style={{ color: "#A89882" }}>
              {paymentVerified
                ? productType === "coaching"
                  ? (lang === "en" ? "Check your inbox for booking confirmation." : lang === "it" ? "Controlla la tua email per la conferma della prenotazione." : lang === "pt" ? "Verifique seu e-mail para a confirmação de reserva." : "Revisa tu correo para la confirmación de reserva.")
                  : productType === "digital"
                  ? (lang === "en" ? "Check your inbox for confirmation." : lang === "it" ? "Controlla la tua email per la conferma." : lang === "pt" ? "Verifique seu e-mail para a confirmação." : "Revisa tu correo para la confirmación.")
                  : t.confirm_note
                : ""}
            </p>

            {/* Social share */}
            <div style={{ width: "100%", maxWidth: 380 }}>
              <ShareBlock t={t} lang={lang} />
            </div>

            {/* CTAs */}
            <div style={{ width: "100%", maxWidth: 380 }} className="flex flex-col gap-3">
              {libraryToken ? (
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/library/${libraryToken}`)}
                >
                  {lang === "en" ? "Open my library" : lang === "pt" ? "Abrir minha biblioteca" : "Abrir mi biblioteca"}
                </button>
              ) : orderId ? (
                <button
                  className="btn-outline"
                  onClick={() => navigate(`/order/${orderId}`)}
                >
                  {t.view_order}
                </button>
              ) : null}
              <button className="btn-primary" style={libraryToken ? { background: "transparent", border: "2px solid #D9C9B0", color: "#A89882" } : {}} onClick={() => navigate("/")}>{t.confirm_cta}</button>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE STICKY CTA (step 1 & 2 only) */}
      {step < 3 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0" style={{ backgroundColor: "#FBF7F1", borderTop: "1px solid #F3EBE0", padding: "1rem", zIndex: 40 }}>
          <button
            className="btn-primary"
            onClick={step === 1 ? handleStep1 : handleStep2}
            disabled={loading || (step === 2 && cardPayStep !== "form")}
          >
            {step === 1 ? t.continue : loading ? t.processing : `${t.pay_now} · $${getProductPrice(format).toFixed(2)}`}
          </button>
        </div>
      )}
      {step < 3 && <div className="sm:hidden h-20" />}
    </div>
  );
}
