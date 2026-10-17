"use strict";
const chatModel = require("../models/chatModel");

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `Eres Daya, asistente de "Códigos de Mujeres" de Dayana Guerrero. Cálida, directa, empática. Español por defecto; inglés si el cliente escribe en inglés.

DATOS CLAVE:
- Libro: "Códigos que toda mujer necesita saber" — empoderamiento femenino, 15 capítulos
- Ebook (PDF + ePub): $14.95 | Audiolibro (MP3): $14.95 | Bundle (ambos): $24.95
- Pago: tarjetas (ePayco), crypto USDT (Daimo Pay)
- Entrega: lectura y audio en tu biblioteca personal en la web, acceso de por vida — el enlace no expira
- También puedes descargar EPUB (para Kindle, Apple Books) o MP3 desde tu biblioteca
- Reembolso: 7 días de garantía
- Web: codigosdemujeres.com | Blog: codigosdemujeres.com/blog
- Autora: Dayana Guerrero, escritora y coach de empoderamiento femenino, +4 años de experiencia

RESPUESTAS RÁPIDAS:
- Descarga → "Revisa tu correo (y spam). Llega en minutos. Desde tu biblioteca puedes leer en la web o descargar EPUB/MP3."
- Crypto → "Sí, aceptamos USDT vía Daimo Pay."
- Libro físico → "Por ahora solo digital (ebook + audio). ¡El contenido es el mismo!"
- Reembolso → "Sí, 7 días de garantía. Te ayudamos."
- Enlace expirado → "Te generamos uno nuevo. Te conecto con Dayana."
- Comprar → Dirige a codigosdemujeres.com

FORMATO DE RESPUESTAS:
- Sé directa y concisa: 1-3 oraciones. No des rodeos.
- Usa párrafos cortos separados por líneas en blanco para que sea fácil de leer.
- Usa **negritas** para resaltar lo importante (precios, acciones, links).
- No uses listas con viñetas excepto cuando compares formatos o precios.
- Nunca empieces con "¡Hola!" si ya saludaste antes en la conversación.
- No repitas información que ya diste en mensajes anteriores.

REGLAS:
- Si no puedes responder o piden hablar con alguien, agrega [ESCALATE] al final.
- Nunca inventes información. Si no sabes, escala.
- No discutas temas fuera del libro/tienda.`;

async function chat({ conversationId, message, channel, customerId, customerName }) {
  // Get or create conversation
  const conversation = conversationId
    ? await chatModel.getConversation(conversationId)
    : await chatModel.getOrCreateConversation({ channel, customerId, customerName });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Save user message
  await chatModel.addMessage({ conversationId: conversation.id, role: "user", content: message });

  // Load conversation history
  const history = await chatModel.getHistory(conversation.id, 20);

  // Build Claude messages array — filter out system-role entries (they are handled by
  // the top-level `system` parameter and must not appear in the messages array)
  const messages = history
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content }));

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fallback = "¡Hola! Soy Daya. En este momento no puedo conectarme. Por favor escríbenos por WhatsApp. [ESCALATE]";
    await chatModel.addMessage({ conversationId: conversation.id, role: "assistant", content: fallback });
    return { reply: fallback, conversationId: conversation.id, escalated: true };
  }

  let reply;
  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[chat] Claude API error:", res.status, errText);
      throw new Error("Claude API error");
    }

    const data = await res.json();
    reply = data.content?.[0]?.text ?? "Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?";
  } catch (err) {
    console.error("[chat] Claude API call failed:", err.message);
    reply = "Disculpa, estoy teniendo problemas técnicos. Voy a conectarte con Dayana para que te ayude personalmente. [ESCALATE]";
  }

  // Check for escalation
  const escalated = reply.includes("[ESCALATE]");
  const cleanReply = reply.replace(/\s*\[ESCALATE\]\s*/g, "").trim();

  // Save bot response
  await chatModel.addMessage({ conversationId: conversation.id, role: "assistant", content: cleanReply });

  // Mark conversation as escalated
  if (escalated) {
    await chatModel.markEscalated(conversation.id);
  }

  return {
    reply: cleanReply,
    conversationId: conversation.id,
    escalated,
  };
}

module.exports = { chat };
