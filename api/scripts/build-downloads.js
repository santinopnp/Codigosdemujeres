"use strict";

/**
 * build-downloads.js
 * Packages downloadable ZIP files for ebook, audiobook, and bundle.
 *
 * Creates:
 *   /app/downloads/codigos-ebook.zip    (EPUB + PDF-ready HTML)
 *   /app/downloads/codigos-audio.zip    (all MP3 chapters)
 *   /app/downloads/codigos-bundle.zip   (ebook + audio combined)
 *
 * Run: docker compose exec api node scripts/build-downloads.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { query, pool } = require("../db");

const DOWNLOADS_DIR = path.join(__dirname, "..", "downloads");
const AUDIO_DIR = path.join(__dirname, "..", "audio");

function createZip(outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", { zlib: { level: 5 } });
    output.on("close", () => resolve(archive.pointer()));
    archive.on("error", reject);
    archive.pipe(output);
    return archive;
  });
}

async function buildEbookHtml(lang) {
  const isEs = lang === "es";
  const { rows: chapters } = await query(
    `SELECT chapter_number, title_es, title_en, body_es, body_en
     FROM book_chapters WHERE format = 'ebook' ORDER BY chapter_number ASC`
  );

  let html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"/>
<title>Códigos que toda mujer ${isEs ? "necesita" : "needs to"} saber — Dayana Guerrero</title>
<style>
  body{font-family:Georgia,serif;color:#3D2B1F;background:#FBF7F1;max-width:640px;margin:0 auto;padding:40px 24px;line-height:1.8}
  h1{color:#C2506A;font-size:2em;text-align:center;letter-spacing:.1em;margin-bottom:8px}
  h2{color:#C2506A;font-size:1.4em;margin-top:3em;border-bottom:1px solid #F3EBE0;padding-bottom:8px}
  .subtitle{text-align:center;color:#7A6652;font-size:.9em;margin-bottom:3em}
  blockquote{border-left:3px solid #C2506A;padding:.5em 1em;margin:1.5em 0;font-style:italic;color:#8B3A50;background:rgba(194,80,106,.05)}
  .ornament{text-align:center;color:#C2506A;opacity:.4;letter-spacing:.5em;margin:2em 0;font-size:.8em}
  .author-photo img{display:block;margin:1.5em auto;width:140px;height:140px;border-radius:50%;object-fit:cover;border:2px solid rgba(194,80,106,.2)}
  .author-signature{text-align:right;font-style:italic;color:#C2506A;margin-top:2em}
  .dedicatoria{text-align:center;margin:1em 0 2em}
  .dedicatoria blockquote{border-left:none;border-top:1px solid rgba(194,80,106,.2);border-bottom:1px solid rgba(194,80,106,.2);text-align:center;background:none}
  ul.affirmations{list-style:none;text-align:center;padding:0}
  ul.affirmations li{color:#C2506A;font-style:italic;padding:.3em 0}
  ul.checklist{list-style:none;padding:0}
  ul.checklist li{padding:.4em 0 .4em 1.5em;position:relative;border-bottom:1px solid rgba(0,0,0,.06)}
  ul.checklist li::before{content:"✦";position:absolute;left:0;color:#C2506A;font-size:.7em;top:.55em}
  h3.checklist-section{font-size:.95em;letter-spacing:.1em;text-transform:uppercase;color:#C2506A;margin:1.5em 0 .5em;font-weight:normal}
  .final-message{margin-top:2em;padding:1.5em;background:rgba(194,80,106,.06);border-radius:8px;text-align:center}
  .final-message blockquote{border-left:none;background:none;text-align:center;font-size:1.1em}
  p.question{font-style:italic;color:#8B4A3A}
  @media print{body{background:#fff;max-width:none}}
</style></head><body>
<h1>CÓDIGOS</h1>
<p class="subtitle">${isEs ? "Que toda mujer necesita saber" : "That every woman should know"}<br/><em>Dayana Guerrero</em></p>
<hr style="border:none;border-top:2px solid #C2506A;width:60px;margin:2em auto"/>
`;

  for (const ch of chapters) {
    const title = isEs ? ch.title_es : (ch.title_en || ch.title_es);
    const body = isEs ? ch.body_es : (ch.body_en || ch.body_es);
    html += `<h2>${isEs ? "Capítulo" : "Chapter"} ${ch.chapter_number}: ${title}</h2>\n${body}\n`;
  }

  html += `</body></html>`;
  return html;
}

async function build() {
  if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  // ─── Build ebook ZIP ───
  console.log("Building ebook ZIP…");
  const ebookPath = path.join(DOWNLOADS_DIR, "codigos-ebook.zip");
  const ebookZip = archiver("zip", { zlib: { level: 5 } });
  const ebookStream = fs.createWriteStream(ebookPath);
  const ebookDone = new Promise((resolve, reject) => {
    ebookStream.on("close", resolve);
    ebookZip.on("error", reject);
  });
  ebookZip.pipe(ebookStream);

  const htmlEs = await buildEbookHtml("es");
  const htmlEn = await buildEbookHtml("en");
  ebookZip.append(htmlEs, { name: "Códigos - Dayana Guerrero (ES).html" });
  ebookZip.append(htmlEn, { name: "Codes - Dayana Guerrero (EN).html" });
  await ebookZip.finalize();
  await ebookDone;
  console.log(`  ✓ ${(fs.statSync(ebookPath).size / 1024).toFixed(0)}KB`);

  // ─── Build audio ZIP ───
  console.log("Building audio ZIP…");
  const audioPath = path.join(DOWNLOADS_DIR, "codigos-audio.zip");
  const audioZip = archiver("zip", { zlib: { level: 0 } }); // MP3 already compressed
  const audioStream = fs.createWriteStream(audioPath);
  const audioDone = new Promise((resolve, reject) => {
    audioStream.on("close", resolve);
    audioZip.on("error", reject);
  });
  audioZip.pipe(audioStream);

  const { rows: audioChapters } = await query(
    `SELECT chapter_number, title_es, title_en FROM book_chapters WHERE format = 'audio' ORDER BY chapter_number`
  );

  for (const ch of audioChapters) {
    const num = String(ch.chapter_number).padStart(2, "0");
    // Spanish audio
    const esFile = path.join(AUDIO_DIR, `chapter-${num}.mp3`);
    if (fs.existsSync(esFile)) {
      const slug = ch.title_es.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9 ]/g, "").substring(0, 40).trim();
      audioZip.file(esFile, { name: `Español/${num} - ${slug}.mp3` });
    }
    // English audio
    const enFile = path.join(AUDIO_DIR, `chapter-${num}-en.mp3`);
    if (fs.existsSync(enFile)) {
      const slug = (ch.title_en || ch.title_es).replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
      audioZip.file(enFile, { name: `English/${num} - ${slug}.mp3` });
    }
  }
  await audioZip.finalize();
  await audioDone;
  console.log(`  ✓ ${(fs.statSync(audioPath).size / (1024 * 1024)).toFixed(1)}MB`);

  // ─── Build bundle ZIP ───
  console.log("Building bundle ZIP…");
  const bundlePath = path.join(DOWNLOADS_DIR, "codigos-bundle.zip");
  const bundleZip = archiver("zip", { zlib: { level: 0 } });
  const bundleStream = fs.createWriteStream(bundlePath);
  const bundleDone = new Promise((resolve, reject) => {
    bundleStream.on("close", resolve);
    bundleZip.on("error", reject);
  });
  bundleZip.pipe(bundleStream);

  // Add ebook HTML files
  bundleZip.append(htmlEs, { name: "Ebook/Códigos - Dayana Guerrero (ES).html" });
  bundleZip.append(htmlEn, { name: "Ebook/Codes - Dayana Guerrero (EN).html" });

  // Add all audio files
  for (const ch of audioChapters) {
    const num = String(ch.chapter_number).padStart(2, "0");
    const esFile = path.join(AUDIO_DIR, `chapter-${num}.mp3`);
    if (fs.existsSync(esFile)) {
      const slug = ch.title_es.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9 ]/g, "").substring(0, 40).trim();
      bundleZip.file(esFile, { name: `Audiolibro/Español/${num} - ${slug}.mp3` });
    }
    const enFile = path.join(AUDIO_DIR, `chapter-${num}-en.mp3`);
    if (fs.existsSync(enFile)) {
      const slug = (ch.title_en || ch.title_es).replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 40).trim();
      bundleZip.file(enFile, { name: `Audiolibro/English/${num} - ${slug}.mp3` });
    }
  }
  await bundleZip.finalize();
  await bundleDone;
  console.log(`  ✓ ${(fs.statSync(bundlePath).size / (1024 * 1024)).toFixed(1)}MB`);

  console.log("\nDone! All download packages built. ✦\n");
  await pool.end();
}

build().catch(err => { console.error("Failed:", err.message); process.exit(1); });
