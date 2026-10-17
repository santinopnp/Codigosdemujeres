"use strict";

/**
 * generate-audiobook.js
 * Generates MP3 audiobook chapters using OpenAI TTS API,
 * saves files to /app/audio/, and seeds audio chapters into DB.
 *
 * Run on the server:
 *   docker compose exec api node scripts/generate-audiobook.js
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
const VOICE = "nova"; // feminine, warm, natural
const SPEED = 0.95;   // slightly slower for book narration

// OpenAI TTS limit is 4096 chars per request — we'll chunk longer chapters
const MAX_CHARS = 4000;

/* ─── helpers ─────────────────────────────────────────────────── */

/** Strip HTML tags and decode entities */
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

/** Split text into chunks of max characters, breaking at sentence boundaries */
function chunkText(text, max) {
  if (text.length <= max) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= max) {
      chunks.push(remaining);
      break;
    }

    // Find last sentence boundary within max
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

/** Call OpenAI TTS and return a Buffer of MP3 data */
function callTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      input: text,
      voice: VOICE,
      speed: SPEED,
      response_format: "mp3",
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/audio/speech",
      method: "POST",
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

/** Concatenate multiple MP3 buffers (simple concat works for MP3) */
function concatBuffers(buffers) {
  return Buffer.concat(buffers);
}

/** Rough MP3 duration estimate: MP3 bitrate ~64kbps for tts-1-hd */
function estimateDuration(mp3Buffer) {
  // tts-1-hd outputs ~48kbps VBR; rough estimate
  return Math.round((mp3Buffer.length * 8) / 48000);
}

/* ─── main ────────────────────────────────────────────────────── */
async function generate() {
  // Create audio directory
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Fetch all ebook chapters (Spanish text)
  const { rows: chapters } = await query(
    `SELECT chapter_number, title_es, title_en, body_es, body_en
     FROM book_chapters
     WHERE format = 'ebook'
     ORDER BY chapter_number ASC`
  );

  console.log(`\nGenerating audiobook for ${chapters.length} chapters…\n`);
  console.log(`  Model: ${MODEL} | Voice: ${VOICE} | Speed: ${SPEED}\n`);

  for (const ch of chapters) {
    const num = ch.chapter_number;
    const filePath = path.join(AUDIO_DIR, `chapter-${String(num).padStart(2, "0")}.mp3`);

    // Skip if already generated
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10000) {
      console.log(`  ⏭ Ch ${num}: ${ch.title_es} (already exists, skipping)`);
      // Still upsert DB entry
      const buf = fs.readFileSync(filePath);
      const dur = estimateDuration(buf);
      await upsertAudioChapter(num, ch.title_es, ch.title_en, `/api/audio/chapter-${String(num).padStart(2, "0")}.mp3`, dur);
      continue;
    }

    // Build narration text: title + body (Spanish)
    const plainText = `${ch.title_es}.\n\n${stripHtml(ch.body_es)}`;
    const chunks = chunkText(plainText, MAX_CHARS);

    console.log(`  🎙 Ch ${num}: ${ch.title_es} (${plainText.length} chars, ${chunks.length} chunk${chunks.length > 1 ? "s" : ""})…`);

    const mp3Parts = [];
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(`    chunk ${i + 1}/${chunks.length}…`);
      const mp3 = await callTTS(chunks[i]);
      mp3Parts.push(mp3);
      console.log(` ${(mp3.length / 1024).toFixed(0)}KB`);

      // Small delay to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Concat and save
    const fullMp3 = concatBuffers(mp3Parts);
    fs.writeFileSync(filePath, fullMp3);
    const duration = estimateDuration(fullMp3);
    console.log(`    ✓ Saved: ${(fullMp3.length / 1024).toFixed(0)}KB (~${Math.floor(duration / 60)}m${duration % 60}s)\n`);

    // Upsert audio chapter in DB
    const audioUrl = `/api/audio/chapter-${String(num).padStart(2, "0")}.mp3`;
    await upsertAudioChapter(num, ch.title_es, ch.title_en, audioUrl, duration);

    // Delay between chapters
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone! All audio chapters generated. ✦\n");
  await pool.end();
}

async function upsertAudioChapter(num, titleEs, titleEn, audioUrl, duration) {
  await query(
    `INSERT INTO book_chapters (format, chapter_number, title_es, title_en, audio_url, duration_seconds)
     VALUES ('audio', $1, $2, $3, $4, $5)
     ON CONFLICT (format, chapter_number) DO UPDATE SET
       title_es         = EXCLUDED.title_es,
       title_en         = EXCLUDED.title_en,
       audio_url        = EXCLUDED.audio_url,
       duration_seconds = EXCLUDED.duration_seconds`,
    [num, titleEs, titleEn || null, audioUrl, duration]
  );
}

generate().catch((err) => {
  console.error("Generation failed:", err.message);
  process.exit(1);
});
