"use strict";
// NOTE: requires `archiver` package — run `npm install archiver` on the server
const archiver = require("archiver");

/**
 * Generate a watermarked EPUB 3.0 file from chapter data.
 *
 * @param {Array} chapters - Array of chapter rows from book_chapters table
 * @param {Object} opts
 * @param {string} opts.title - Book title
 * @param {string} opts.author - Author name
 * @param {string} opts.lang - Language code ("es" or "en")
 * @param {string} opts.watermarkEmail - Buyer email for watermark
 * @returns {Promise<Buffer>} EPUB file as a Buffer
 */
async function generateEpub(chapters, { title, author, lang, watermarkEmail }) {
  const isEs = lang !== "en";
  const bookId = "codigos-de-mujeres-" + Date.now();

  // Sort chapters by chapter_number
  const sorted = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);

  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const buffers = [];

    archive.on("data", (chunk) => buffers.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(buffers)));
    archive.on("error", (err) => reject(err));

    // ── 1. mimetype (MUST be first entry, stored uncompressed) ──────────
    archive.append("application/epub+zip", {
      name: "mimetype",
      store: true, // no compression
    });

    // ── 2. META-INF/container.xml ───────────────────────────────────────
    archive.append(containerXml(), { name: "META-INF/container.xml" });

    // ── 3. OEBPS/style.css ──────────────────────────────────────────────
    archive.append(stylesheet(watermarkEmail), { name: "OEBPS/style.css" });

    // ── 4. OEBPS/cover.xhtml ───────────────────────────────────────────
    archive.append(coverPage(title, author, isEs, lang), { name: "OEBPS/cover.xhtml" });

    // ── 5. Chapter XHTML files ──────────────────────────────────────────
    for (const ch of sorted) {
      const chTitle = isEs
        ? (ch.title_es || "Capitulo " + ch.chapter_number)
        : (ch.title_en || ch.title_es || "Chapter " + ch.chapter_number);
      const chBody = isEs
        ? (ch.body_es || "")
        : (ch.body_en || ch.body_es || "");

      archive.append(
        chapterXhtml(ch.chapter_number, chTitle, chBody, watermarkEmail, lang),
        { name: "OEBPS/chapter-" + String(ch.chapter_number).padStart(2, "0") + ".xhtml" }
      );
    }

    // ── 6. OEBPS/toc.xhtml (navigation document) ───────────────────────
    archive.append(tocXhtml(sorted, isEs, lang), { name: "OEBPS/toc.xhtml" });

    // ── 7. OEBPS/content.opf (package document) ────────────────────────
    archive.append(contentOpf(sorted, { bookId, title, author, lang, isEs }), { name: "OEBPS/content.opf" });

    archive.finalize();
  });
}

// ─── XML Templates ──────────────────────────────────────────────────────────

function containerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function contentOpf(chapters, { bookId, title, author, lang, isEs }) {
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const manifestItems = [
    `    <item id="style" href="style.css" media-type="text/css"/>`,
    `    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`,
    `    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
  ];

  const spineItems = [
    `    <itemref idref="cover"/>`,
  ];

  for (const ch of chapters) {
    const num = String(ch.chapter_number).padStart(2, "0");
    const id = "ch-" + num;
    manifestItems.push(`    <item id="${id}" href="chapter-${num}.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`    <itemref idref="${id}"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">${escXml(bookId)}</dc:identifier>
    <dc:title>${escXml(title)}</dc:title>
    <dc:creator>${escXml(author)}</dc:creator>
    <dc:language>${lang}</dc:language>
    <dc:publisher>Codigos de Mujeres</dc:publisher>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
${manifestItems.join("\n")}
  </manifest>
  <spine>
${spineItems.join("\n")}
  </spine>
</package>`;
}

function tocXhtml(chapters, isEs, lang) {
  const navItems = chapters.map((ch) => {
    const num = String(ch.chapter_number).padStart(2, "0");
    const title = isEs
      ? (ch.title_es || "Capitulo " + ch.chapter_number)
      : (ch.title_en || ch.title_es || "Chapter " + ch.chapter_number);
    return `      <li><a href="chapter-${num}.xhtml">${escXml(title)}</a></li>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${isEs ? "Tabla de Contenidos" : "Table of Contents"}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>${isEs ? "Tabla de Contenidos" : "Table of Contents"}</h1>
    <ol>
${navItems.join("\n")}
    </ol>
  </nav>
</body>
</html>`;
}

function coverPage(title, author, isEs, lang) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${escXml(title)}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body class="cover-page">
  <div class="cover-container">
    <h1 class="cover-title">CODIGOS</h1>
    <p class="cover-subtitle">${isEs ? "Codigos que toda mujer necesita saber" : "Codes every woman needs to know"}</p>
    <p class="cover-author">${escXml(author)}</p>
  </div>
</body>
</html>`;
}

function chapterXhtml(chapterNumber, title, bodyHtml, watermarkEmail, lang) {
  // Build watermark lines (repeated email diagonal overlay)
  const safeEmail = escXml(watermarkEmail);
  const repeated = Array(10).fill(safeEmail).join("  &middot;  ");
  const watermarkLines = [];
  for (let i = 0; i < 8; i++) {
    watermarkLines.push(
      `<div class="wm-line" style="top:${i * 12.5}%">${repeated}</div>`
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${escXml(title)}</title>
  <link rel="stylesheet" href="style.css"/>
</head>
<body>
  <div class="chapter">
    <h2 class="chapter-number">${escXml(String(chapterNumber))}</h2>
    <h1 class="chapter-title">${escXml(title)}</h1>
    <div class="chapter-body">
      ${bodyHtml}
    </div>
    <div class="watermark-overlay">
${watermarkLines.join("\n")}
    </div>
  </div>
</body>
</html>`;
}

function stylesheet(watermarkEmail) {
  return `/* CODIGOS EPUB Stylesheet */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');

body {
  background-color: #FBF7F1;
  color: #3D2B1F;
  font-family: "Nunito", "Segoe UI", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.8;
  margin: 0;
  padding: 1.5em;
}

h1, h2, h3 {
  font-family: "Playfair Display", Georgia, serif;
  color: #C2506A;
  letter-spacing: 0.04em;
}

/* Cover page */
.cover-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 90vh;
  text-align: center;
}

.cover-container {
  padding: 2em;
}

.cover-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 3em;
  color: #C2506A;
  letter-spacing: 0.15em;
  margin: 0 0 0.3em;
  text-transform: uppercase;
}

.cover-subtitle {
  font-family: "Nunito", Arial, sans-serif;
  font-size: 1.1em;
  color: #7A6652;
  font-style: italic;
  margin: 0 0 2em;
}

.cover-author {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 1.3em;
  color: #B8936A;
  letter-spacing: 0.08em;
}

/* Chapter layout */
.chapter {
  position: relative;
  page-break-before: always;
}

.chapter-number {
  font-size: 0.85em;
  color: #B8936A;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin: 0 0 0.2em;
}

.chapter-title {
  font-size: 1.8em;
  margin: 0 0 1em;
  border-bottom: 2px solid #F3EBE0;
  padding-bottom: 0.5em;
}

.chapter-body {
  position: relative;
  z-index: 2;
}

.chapter-body p {
  margin: 0 0 1em;
  text-indent: 1.5em;
  text-align: justify;
}

.chapter-body p:first-child {
  text-indent: 0;
}

.chapter-body blockquote {
  border-left: 3px solid #C2506A;
  margin: 1.5em 0;
  padding: 0.5em 1em;
  color: #7A6652;
  font-style: italic;
}

/* Watermark overlay */
.watermark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.wm-line {
  position: absolute;
  left: -10%;
  width: 140%;
  white-space: nowrap;
  color: rgba(0, 0, 0, 0.03);
  font-size: 9px;
  font-family: monospace;
  transform: rotate(-30deg);
  transform-origin: center center;
  pointer-events: none;
  line-height: 1;
}

/* Navigation */
nav h1 {
  font-size: 1.5em;
  margin: 0 0 1em;
}

nav ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

nav ol li {
  margin: 0.5em 0;
}

nav ol li a {
  color: #C2506A;
  text-decoration: none;
  font-size: 1.05em;
}

nav ol li a:hover {
  text-decoration: underline;
}
`;
}

/**
 * Escape XML special characters.
 */
function escXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = { generateEpub };
