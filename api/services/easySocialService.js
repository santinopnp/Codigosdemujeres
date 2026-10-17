"use strict";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ─── Brand Context ───────────────────────────────────────────────────────────
const BRAND_CONTEXT = `
MARCA: "Codigos de Mujeres" por Dayana Guerrero
SITIO WEB: codigosdemujeres.com
MISION: Empoderar a mujeres hispanohablantes a traves de herramientas de autoconocimiento, codigos de vida y transformacion personal.
PRODUCTO PRINCIPAL: Libro "Codigos que toda mujer necesita saber" (ebook, audiolibro, bundle).
VOZ DE MARCA: Femenina, calida, empoderadora, autentica, cercana pero profesional.
AUDIENCIA: Mujeres 25-55, Latinoamerica y latinas en EE.UU./Europa. Buscan crecimiento personal, autoestima, relaciones sanas y proposito de vida.
PILARES DE CONTENIDO:
  1. Empoderamiento femenino y autoestima
  2. Relaciones sanas y limites
  3. Crecimiento personal y proposito
  4. Historias de transformacion
  5. Tips practicos de bienestar emocional
  6. Detras de escenas (autenticidad de la autora)
`.trim();

// ─── Tone Definitions ────────────────────────────────────────────────────────
const TONE_DESCRIPTIONS = {
  professional: "Tono profesional y autoritativo. Usa datos, estadisticas y lenguaje pulido. Posiciona a Dayana como experta en su campo. Evita coloquialismos excesivos pero mantiene calidez.",
  casual: "Tono relajado y conversacional, como hablarle a una amiga. Usa contracciones, preguntas retoricas y expresiones coloquiales latinas. Cercano y accesible.",
  inspirational: "Tono elevador y motivacional. Usa metaforas poderosas, frases de impacto y llamados a la accion emocionales. Cada oracion debe mover algo dentro de quien lee. Apela al potencial y la grandeza interior.",
  educational: "Tono didactico y claro. Estructura la informacion en pasos, listas o tips numerados. Usa ejemplos concretos. El objetivo es que la audiencia aprenda algo actionable en cada post.",
  storytelling: "Tono narrativo. Cuenta una historia (propia de Dayana, de una lectora, o una parabola). Usa arco narrativo: situacion inicial, conflicto/reto, transformacion. Conecta emocionalmente antes de dar el mensaje.",
  humorous: "Tono ligero y divertido con toques de humor femenino inteligente. Usa ironia suave, situaciones cotidianas graciosas y memes verbales. Nunca humor que ofenda o minimice. El objetivo es que se rian Y reflexionen.",
  empowering: "Tono fuerte, directo y empoderante. Habla como una hermana mayor que te sacude con amor. Frases cortas y contundentes. Usa imperativos positivos: 'Levantate', 'Tu puedes', 'No te achiques'. Energia de guerrera.",
};

// ─── Platform Rules ──────────────────────────────────────────────────────────
const PLATFORM_RULES = {
  ig_post: `INSTAGRAM POST (Feed):
- Maximo 2200 caracteres (ideal 800-1500 para engagement).
- Primera linea = GANCHO irresistible (5-7 palabras que detengan el scroll).
- Usa saltos de linea para legibilidad (parrafos cortos de 1-2 oraciones).
- Incluye emojis estrategicamente (no mas de 3-5 por post, que refuercen el mensaje).
- Termina con CTA claro (guarda, comparte, comenta, link en bio).
- Formato ideal: Gancho -> Desarrollo (3-4 parrafos cortos) -> CTA.
- Los hashtags van SEPARADOS del caption (en primer comentario o al final con espacio).`,

  fb_post: `FACEBOOK POST:
- Tono mas conversacional y extenso que Instagram.
- Ideal 100-500 palabras. Facebook premia contenido que genera comentarios largos.
- Haz preguntas abiertas para fomentar debate.
- Puedes usar listas y formato mas estructurado.
- Los links funcionan bien en Facebook (incluir link al blog/sitio cuando sea relevante).
- Emojis moderados (1-3 por post).
- No uses hashtags excesivos en FB (maximo 3-5 relevantes).`,

  blog: `ARTICULO DE BLOG (SEO):
- Titulo SEO-friendly con palabra clave principal (60-70 caracteres).
- Extracto/meta description de 150-160 caracteres.
- Estructura con subtitulos H2/H3 claros.
- Parrafos cortos (3-4 oraciones max).
- Incluye listas, negritas y puntos clave.
- Minimo 600 palabras, ideal 800-1200.
- Intro que enganche en las primeras 2 oraciones.
- Conclusion con CTA al libro o newsletter.
- Usa lenguaje natural con keywords integradas organicamente.`,

  ig_story: `INSTAGRAM STORY:
- Texto MUY corto: maximo 100-150 caracteres por slide.
- Mensaje directo y visual.
- Usa stickers sugeridos: encuesta, pregunta, slider de emoji, quiz.
- Formato: 1 idea por slide, maximo 3-5 slides.
- Urgencia y cercania: "Oye", "Mira esto", "Te cuento algo".
- Siempre incluir elemento interactivo.`,

  ig_reel: `INSTAGRAM REEL (Script):
- GANCHO en los primeros 2 segundos (frase controversial, pregunta, dato impactante).
- Duracion ideal del script: 15-30 segundos de lectura (para reels de 30-60 seg).
- Estructura: Hook (2s) -> Contenido (20-25s) -> CTA (3-5s).
- Escribe como guion hablado, no como texto leido.
- Incluye indicaciones de edicion entre corchetes: [corte], [zoom], [texto en pantalla: X].
- Trending audio suggestion al final.
- Lenguaje ultra dinamico, oraciones cortas, ritmo rapido.`,

  li_post: `LINKEDIN POST (Company Page):
- Longitud ideal: 150-300 palabras. LinkedIn premia contenido de valor profesional.
- Sin emojis excesivos; 1-3 si refuerzan el mensaje. Tono mas profesional que Instagram.
- Primera linea = GANCHO que genere curiosidad o debata una idea convencional.
- Usa saltos de linea generosamente (parrafos de 1-2 lineas) para legibilidad en feed.
- Hashtags: maximo 5, muy relevantes (#LiderazgoFemenino #DesarrolloPersonal #MujeresEmprendedoras).
- CTA al final: invitar a comentar, compartir, o visitar el sitio.
- Estructura ideal: Gancho -> Contexto (2-3 parrafos) -> Insight clave -> CTA.
- Puedes mencionar estadisticas o logros para credibilidad.`,

  carousel: `INSTAGRAM CAROUSEL:
- Slide 1 (portada): Titulo gancho en 5-8 palabras. Debe funcionar como "mini-titular de revista".
- Slides 2-9: Un punto clave por slide. Maximo 40-60 palabras por slide.
- Slide final: CTA potente + "Guarda este post" + mencion del libro si aplica.
- Total: 7-10 slides.
- Formato: Numera cada slide. Separa claramente el texto de cada una.
- Ejemplo de formato de salida:
  [SLIDE 1] Titulo
  [SLIDE 2] Punto 1...
  ...
  [SLIDE FINAL] CTA`,
};

// ─── Master System Prompt ────────────────────────────────────────────────────
function buildSystemPrompt({ contentType, tone }) {
  const platformRule = PLATFORM_RULES[contentType] || PLATFORM_RULES.ig_post;
  const toneDesc = TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.casual;

  return `Eres "Easy Bot", el motor creativo de inteligencia artificial de "Easy Social Media: Easy Bot" para la marca Codigos de Mujeres.

${BRAND_CONTEXT}

═══ TU ROL ═══
Eres un director creativo senior especializado en contenido para redes sociales en el nicho de empoderamiento femenino y desarrollo personal para audiencia latina. Tienes 15 anos de experiencia en social media marketing, copywriting persuasivo y storytelling emocional.

═══ TONO SELECCIONADO ═══
${toneDesc}

═══ REGLAS DE PLATAFORMA ═══
${platformRule}

═══ CONOCIMIENTO EXPERTO DE ALGORITMOS ═══
INSTAGRAM:
- El algoritmo prioriza: Reels > Carousels > Single Image > Stories (para alcance).
- Saves y Shares pesan mas que Likes en el ranking.
- Publica cuando tu audiencia esta activa (Latinoamerica: 7-9am, 12-2pm, 7-9pm hora local).
- Hashtags: mezcla de 3-5 amplios (#empoderamientofemenino), 5-10 nicho (#mujeresqueseaman), 3-5 de marca (#codigosdemujeres), 2-3 trending.
- Los Reels con gancho en <3 segundos tienen 2x mas retencion.
- Los carousels que ensenen algo tienen 3x mas saves.

FACEBOOK:
- El algoritmo prioriza contenido que genera conversaciones significativas.
- Posts con preguntas obtienen 2x mas comentarios.
- Videos nativos > links externos > fotos > texto puro.
- Mejores horarios para Latinoamerica: 9-11am, 1-3pm, 7-8pm.
- Grupos y comunidades son el arma secreta de Facebook.

═══ TECNICAS DE GANCHOS (HOOKS) ═══
Usa estas tecnicas probadas:
1. Controversia suave: "Esto que te voy a decir no le va a gustar a todo el mundo..."
2. Numero especifico: "3 senales de que estas dando mas de lo que recibes"
3. Historia personal: "Hoy me paso algo que me hizo reflexionar..."
4. Pregunta provocadora: "Y si todo lo que crees sobre el amor propio esta mal?"
5. Dato impactante: "El 78% de las mujeres no saben poner limites. Eres una de ellas?"
6. Contraste: "Antes lloraba por amor. Ahora lloro de orgullo por quien soy."
7. Promesa: "Despues de leer esto vas a ver tus relaciones de otra manera."

═══ FORMATO DE RESPUESTA OBLIGATORIO ═══
Tu respuesta SIEMPRE debe incluir estas secciones claramente separadas:

[CONTENT]
(El contenido principal aqui)

[HASHTAGS]
(Lista de hashtags separados por espacios, 15-25 hashtags)

[IMAGE_SUGGESTION]
(Descripcion detallada de la imagen/visual ideal para acompanar el contenido. Incluye: composicion, colores, estilo, elementos. Usa la paleta de marca: beige, cherry/cereza, ocre, dorado.)

[CTA]
(Call-to-action principal sugerido)

═══ IDIOMA ═══
Escribe SIEMPRE en espanol latino (no espanol de Espana) a menos que se indique lo contrario. Usa "tu" en vez de "vos" o "usted" para mantener cercania universal.

═══ REGLAS CRITICAS ═══
1. NUNCA uses contenido generico. Cada pieza debe sentirse escrita especificamente para la audiencia de Codigos de Mujeres.
2. NUNCA copies frases cliche sin darles un giro fresco.
3. SIEMPRE incluye un elemento emocional que conecte.
4. SIEMPRE adapta el formato exacto a la plataforma solicitada.
5. Si el contenido puede relacionarse con el libro, hazlo de forma natural (NO forzada).
6. Los hashtags deben ser una mezcla estrategica de alcance amplio, nicho y marca.`;
}

// ─── Claude API Call Helper ──────────────────────────────────────────────────
async function callClaude({ system, messages, maxTokens = 2048 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[easySocial] Claude API error:", res.status, errText);
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

// ─── Response Parser ─────────────────────────────────────────────────────────
function parseGeneratedContent(raw) {
  const result = { text: "", hashtags: [], imageSuggestion: "", cta: "" };

  // Extract [CONTENT]
  const contentMatch = raw.match(/\[CONTENT\]\s*([\s\S]*?)(?=\[HASHTAGS\]|$)/i);
  result.text = contentMatch ? contentMatch[1].trim() : raw.split("[HASHTAGS]")[0].trim();

  // Extract [HASHTAGS]
  const hashtagMatch = raw.match(/\[HASHTAGS\]\s*([\s\S]*?)(?=\[IMAGE_SUGGESTION\]|$)/i);
  if (hashtagMatch) {
    result.hashtags = hashtagMatch[1]
      .trim()
      .split(/[\s,]+/)
      .filter(h => h.startsWith("#"))
      .map(h => h.trim());
  }

  // Extract [IMAGE_SUGGESTION]
  const imageMatch = raw.match(/\[IMAGE_SUGGESTION\]\s*([\s\S]*?)(?=\[CTA\]|$)/i);
  result.imageSuggestion = imageMatch ? imageMatch[1].trim() : "";

  // Extract [CTA]
  const ctaMatch = raw.match(/\[CTA\]\s*([\s\S]*?)$/i);
  result.cta = ctaMatch ? ctaMatch[1].trim() : "";

  return result;
}

// ─── Public Functions ────────────────────────────────────────────────────────

/**
 * Generate social media content using AI.
 * @param {object} opts
 * @param {'blog'|'ig_post'|'fb_post'|'ig_story'|'ig_reel'|'carousel'} opts.contentType
 * @param {'professional'|'casual'|'inspirational'|'educational'|'storytelling'|'humorous'|'empowering'} opts.tone
 * @param {string} opts.topic - What the content should be about
 * @param {string} [opts.context] - Additional context (current campaign, recent posts, etc.)
 * @param {string} [opts.lang] - Language code, defaults to 'es'
 */
async function generateContent({ contentType = "ig_post", tone = "casual", topic, context = "", lang = "es" }) {
  const system = buildSystemPrompt({ contentType, tone });

  let userMessage = `Genera contenido de tipo "${contentType}" sobre el siguiente tema:\n\n${topic}`;
  if (context) userMessage += `\n\nContexto adicional:\n${context}`;
  if (lang !== "es") userMessage += `\n\nIMPORTANTE: Escribe en ${lang === "en" ? "ingles" : lang}.`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const parsed = parseGeneratedContent(raw);
  return {
    text: parsed.text,
    hashtags: parsed.hashtags,
    imageSuggestion: parsed.imageSuggestion,
    cta: parsed.cta,
    contentType,
    tone,
    raw,
  };
}

/**
 * Improve existing content with specific instructions.
 */
async function improveContent({ text, contentType = "ig_post", instruction }) {
  const system = buildSystemPrompt({ contentType, tone: "casual" });

  const userMessage = `Mejora el siguiente contenido de tipo "${contentType}".

INSTRUCCION: ${instruction}

CONTENIDO ORIGINAL:
${text}

Reescribe el contenido mejorado usando el formato de respuesta obligatorio ([CONTENT], [HASHTAGS], [IMAGE_SUGGESTION], [CTA]).`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const parsed = parseGeneratedContent(raw);
  return {
    text: parsed.text,
    hashtags: parsed.hashtags,
    imageSuggestion: parsed.imageSuggestion,
    cta: parsed.cta,
    contentType,
    raw,
  };
}

/**
 * Generate a curated set of hashtags for given text and niche.
 */
async function generateHashtags({ text, niche = "empoderamiento femenino", count = 25 }) {
  const system = `Eres un experto en estrategia de hashtags para Instagram y redes sociales en el nicho de ${niche} para audiencia latina.

${BRAND_CONTEXT}

Tu trabajo es generar hashtags estrategicos categorizados. Conoces profundamente:
- Hashtags trending en el nicho de desarrollo personal femenino
- Volumenes de busqueda relativos (amplio vs nicho)
- Hashtags de comunidad latina
- Hashtags de marca para Codigos de Mujeres

FORMATO DE RESPUESTA (JSON estricto):
{
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "categories": {
    "brand": ["#codigosdemujeres", ...],
    "niche": ["#empoderamientofemenino", ...],
    "trending": ["#mujeresreales", ...],
    "community": ["#latinasempoderadas", ...]
  }
}

Responde UNICAMENTE con el JSON, sin texto adicional.`;

  const raw = await callClaude({
    system,
    messages: [{
      role: "user",
      content: `Genera ${count} hashtags estrategicos para el siguiente contenido:\n\n${text}\n\nNicho: ${niche}`,
    }],
    maxTokens: 1024,
  });

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[easySocial] Failed to parse hashtags JSON:", err.message);
    // Fallback: extract any hashtags from raw text
    const found = raw.match(/#\w+/g) || [];
    return {
      hashtags: found.slice(0, count),
      categories: { brand: [], niche: found.slice(0, 10), trending: [], community: [] },
    };
  }
}

/**
 * Analyze social media metrics and provide AI recommendations.
 */
async function analyzeMetrics({ metrics = {}, recentPosts = [] }) {
  const system = `Eres un analista senior de social media marketing especializado en marcas de desarrollo personal femenino en Latinoamerica.

${BRAND_CONTEXT}

Analiza las metricas y posts proporcionados. Da recomendaciones accionables y especificas basadas en datos.

FORMATO DE RESPUESTA (JSON estricto):
{
  "summary": "Resumen ejecutivo en 2-3 oraciones",
  "bestContentType": "tipo de contenido con mejor rendimiento",
  "bestPostingTime": "mejor horario identificado",
  "recommendations": ["recomendacion 1", "recomendacion 2", ...],
  "actionItems": ["accion concreta 1", "accion concreta 2", ...]
}

Responde UNICAMENTE con el JSON, sin texto adicional.`;

  const userMessage = `Analiza estas metricas de redes sociales y dame recomendaciones:

METRICAS GENERALES:
${JSON.stringify(metrics, null, 2)}

POSTS RECIENTES (con rendimiento):
${JSON.stringify(recentPosts, null, 2)}`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 1536,
  });

  try {
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[easySocial] Failed to parse metrics JSON:", err.message);
    return {
      summary: raw.slice(0, 500),
      bestContentType: "unknown",
      bestPostingTime: "unknown",
      recommendations: ["No se pudo analizar las metricas automaticamente. Revisa los datos manualmente."],
      actionItems: [],
    };
  }
}

/**
 * Create a full campaign plan with scheduled posts.
 */
async function createCampaignPlan({ goal, duration = "7 days", platforms = ["instagram", "facebook"], tone = "casual", lang = "es" }) {
  const system = `Eres un estratega de contenidos senior para redes sociales. Creas planes de campana completos y detallados.

${BRAND_CONTEXT}

CONOCIMIENTO DE FRECUENCIA OPTIMA:
- Instagram: 4-7 posts/semana en feed + 1-2 reels/semana + stories diarias
- Facebook: 3-5 posts/semana
- LinkedIn: 2-3 posts/semana (martes a jueves son los mejores dias)
- Mezcla ideal de contenido: 40% educativo, 30% inspiracional, 20% storytelling, 10% promocional
- Nunca publicar contenido promocional dos dias seguidos
- Los lunes y jueves son los mejores dias para contenido educativo
- Los viernes y domingos para contenido ligero/inspiracional
- Horarios optimos Latinoamerica: 7-9am, 12-2pm, 7-9pm
- LinkedIn horario optimo: 8-10am y 12-1pm dias laborales

FORMATO DE RESPUESTA (JSON estricto):
{
  "name": "Nombre de la campana",
  "description": "Descripcion breve de la campana y su objetivo",
  "posts": [
    {
      "day": 1,
      "contentType": "ig_post|fb_post|ig_reel|carousel|ig_story|blog",
      "platform": "instagram|facebook",
      "tone": "casual|professional|inspirational|educational|storytelling|humorous|empowering",
      "draftContent": "Texto completo del post listo para publicar",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "suggestedTime": "HH:MM (hora de Colombia/Mexico)"
    }
  ]
}

Responde UNICAMENTE con el JSON. Genera contenido COMPLETO para cada post (no solo ideas, sino el texto real listo para publicar).`;

  const langNote = lang !== "es" ? `\nIMPORTANTE: Todo el contenido debe estar en ${lang === "en" ? "ingles" : lang}.` : "";

  const userMessage = `Crea un plan de campana con las siguientes especificaciones:

OBJETIVO: ${goal}
DURACION: ${duration}
PLATAFORMAS: ${platforms.join(", ")}
TONO PREDOMINANTE: ${tone}${langNote}

Genera posts completos (no solo titulos o ideas). Cada post debe estar listo para copiar y pegar.`;

  const raw = await callClaude({
    system,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 4096,
  });

  try {
    const jsonStr = raw.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[easySocial] Failed to parse campaign JSON:", err.message);
    return {
      name: "Campaign",
      description: goal,
      posts: [],
      raw,
      parseError: "AI response could not be parsed. Raw content included.",
    };
  }
}

/**
 * Free-form chat with Easy Bot for ad-hoc social media questions.
 */
async function chat({ message, history = [], context = {} }) {
  const system = `Eres "Easy Bot", el asistente de inteligencia artificial de "Easy Social Media: Easy Bot" para la marca Codigos de Mujeres.

${BRAND_CONTEXT}

Eres experto en:
- Estrategia de contenidos para redes sociales
- Copywriting persuasivo y emocional
- Algoritmos de Instagram, Facebook, TikTok
- Marketing digital para autoras y coaches
- Analisis de metricas de redes sociales
- Tendencias de social media en Latinoamerica
- SEO para blogs de nicho
- Email marketing y funnels de venta para productos digitales
- Branding personal para mujeres emprendedoras

Responde siempre en espanol latino. Se conciso pero completo. Si te piden crear contenido, usa el formato con [CONTENT], [HASHTAGS], [IMAGE_SUGGESTION] y [CTA].

CONTEXTO ACTUAL DE LA CUENTA:
${JSON.stringify(context, null, 2)}`;

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const reply = await callClaude({
    system,
    messages,
    maxTokens: 2048,
  });

  return { reply };
}

module.exports = {
  generateContent,
  improveContent,
  generateHashtags,
  analyzeMetrics,
  createCampaignPlan,
  chat,
};
