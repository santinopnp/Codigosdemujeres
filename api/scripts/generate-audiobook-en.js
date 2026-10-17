"use strict";

/**
 * generate-audiobook-en.js
 * Generates English MP3 audiobook chapters using OpenAI TTS API.
 * Saves as chapter-XX-en.mp3 alongside the Spanish files.
 *
 * Run on the server:
 *   docker compose exec -e OPENAI_API_KEY=<key> api node scripts/generate-audiobook-en.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const https = require("https");
const fs = require("fs");
const path = require("path");
const { query, pool } = require("../db");

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const AUDIO_DIR = path.join(__dirname, "..", "audio");
const MODEL = "tts-1-hd";
const VOICE = "nova";
const SPEED = 0.95;
const MAX_CHARS = 4000;

function stripHtml(html) {
  return html
    .replace(/<div class="ornament">.*?<\/div>/g, "\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/g, "\n$1\n")
    .replace(/<blockquote>(.*?)<\/blockquote>/gs, "\n$1\n")
    .replace(/<li>(.*?)<\/li>/g, "$1. ")
    .replace(/<[^>]+>/g, "")
    .replace(/&ldquo;/g, "\u201C")
    .replace(/&rdquo;/g, "\u201D")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text, max) {
  if (text.length <= max) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= max) { chunks.push(remaining); break; }
    let cutPoint = max;
    const searchArea = remaining.substring(0, max);
    const lastPeriod = Math.max(
      searchArea.lastIndexOf(". "),
      searchArea.lastIndexOf(".\n"),
      searchArea.lastIndexOf("? "),
      searchArea.lastIndexOf("?\n"),
      searchArea.lastIndexOf("! "),
      searchArea.lastIndexOf("!\n")
    );
    if (lastPeriod > max * 0.5) cutPoint = lastPeriod + 1;
    chunks.push(remaining.substring(0, cutPoint).trim());
    remaining = remaining.substring(cutPoint).trim();
  }
  return chunks;
}

function callTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL, input: text, voice: VOICE, speed: SPEED, response_format: "mp3",
    });
    const options = {
      hostname: "api.openai.com", path: "/v1/audio/speech", method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = "";
        res.on("data", (d) => (errData += d));
        res.on("end", () => reject(new Error(`TTS API ${res.statusCode}: ${errData}`)));
        return;
      }
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function estimateDuration(mp3Buffer) {
  return Math.round((mp3Buffer.length * 8) / 48000);
}

async function generate() {
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const { rows: chapters } = await query(
    `SELECT chapter_number, title_en, body_en
     FROM book_chapters
     WHERE format = 'ebook' AND body_en IS NOT NULL
     ORDER BY chapter_number ASC`
  );

  console.log(`\nGenerating ENGLISH audiobook for ${chapters.length} chapters…\n`);
  console.log(`  Model: ${MODEL} | Voice: ${VOICE} | Speed: ${SPEED}\n`);

  for (const ch of chapters) {
    const num = ch.chapter_number;
    const filePath = path.join(AUDIO_DIR, `chapter-${String(num).padStart(2, "0")}-en.mp3`);

    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
      console.log(`  ⏭ Ch ${num}: ${ch.title_en} (already exists, skipping)`);
      continue;
    }

    const plainText = `${ch.title_en}.\n\n${stripHtml(ch.body_en)}`;
    const chunks = chunkText(plainText, MAX_CHARS);

    console.log(`  🎙 Ch ${num}: ${ch.title_en} (${plainText.length} chars, ${chunks.length} chunk${chunks.length > 1 ? "s" : ""})…`);

    const mp3Parts = [];
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`    chunk ${i + 1}/${chunks.length}…`);
      const mp3 = await callTTS(chunks[i]);
      mp3Parts.push(mp3);
      console.log(` ${(mp3.length / 1024).toFixed(0)}KB`);
      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 500));
    }

    const fullMp3 = Buffer.concat(mp3Parts);
    fs.writeFileSync(filePath, fullMp3);
    const duration = estimateDuration(fullMp3);
    console.log(`    ✓ Saved: ${(fullMp3.length / 1024).toFixed(0)}KB (~${Math.floor(duration / 60)}m${duration % 60}s)\n`);

    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone! All English audio chapters generated. ✦\n");
  await pool.end();
}

generate().catch((err) => {
  console.error("Generation failed:", err.message);
  process.exit(1);
});
