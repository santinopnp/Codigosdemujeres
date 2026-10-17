"use strict";
const fs   = require("fs");
const path = require("path");

// Private audio directory inside the Docker container (NOT publicly accessible)
const AUDIO_BASE_DIR = process.env.AUDIO_DIR || "/app/audio";

/**
 * Create an HTTP-range-aware readable stream for an audio file.
 *
 * @param {string} filePath - Relative path within the audio directory (e.g., "chapter-01.mp3")
 * @param {string|undefined} rangeHeader - The HTTP Range header value (e.g., "bytes=1000-2000")
 * @returns {{ stream: ReadableStream, headers: Object, statusCode: number }}
 */
function createStream(filePath, rangeHeader) {
  // Prevent directory traversal attacks
  const safeName = path.basename(filePath);
  const fullPath = path.join(AUDIO_BASE_DIR, safeName);

  // Check file exists
  let stat;
  try {
    stat = fs.statSync(fullPath);
  } catch (err) {
    const notFound = new Error("Audio file not found");
    notFound.status = 404;
    throw notFound;
  }

  if (!stat.isFile()) {
    const notFound = new Error("Audio file not found");
    notFound.status = 404;
    throw notFound;
  }

  const fileSize = stat.size;
  const mimeType = getMimeType(safeName);

  // No range requested - send the full file
  if (!rangeHeader) {
    const stream = fs.createReadStream(fullPath);
    return {
      stream,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileSize,
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, no-store",
      },
      statusCode: 200,
    };
  }

  // Parse Range header
  const range = parseRange(rangeHeader, fileSize);
  if (!range) {
    const err = new Error("Range not satisfiable");
    err.status = 416;
    err.headers = { "Content-Range": `bytes */${fileSize}` };
    throw err;
  }

  const { start, end } = range;
  const chunkSize = end - start + 1;

  const stream = fs.createReadStream(fullPath, { start, end });
  return {
    stream,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": chunkSize,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, no-store",
    },
    statusCode: 206,
  };
}

/**
 * Parse an HTTP Range header.
 * Supports: "bytes=start-end", "bytes=start-", "bytes=-suffix"
 *
 * @param {string} rangeHeader
 * @param {number} fileSize
 * @returns {{ start: number, end: number } | null}
 */
function parseRange(rangeHeader, fileSize) {
  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const rawStart = match[1];
  const rawEnd   = match[2];

  let start, end;

  if (rawStart === "" && rawEnd !== "") {
    // Suffix range: "bytes=-500" means last 500 bytes
    const suffix = parseInt(rawEnd, 10);
    if (suffix <= 0 || suffix > fileSize) return null;
    start = fileSize - suffix;
    end = fileSize - 1;
  } else if (rawStart !== "" && rawEnd === "") {
    // Open-ended range: "bytes=1000-"
    start = parseInt(rawStart, 10);
    if (start >= fileSize) return null;
    end = fileSize - 1;
  } else if (rawStart !== "" && rawEnd !== "") {
    // Explicit range: "bytes=1000-2000"
    start = parseInt(rawStart, 10);
    end = parseInt(rawEnd, 10);
    if (start > end || start >= fileSize) return null;
    // Clamp end to file boundary
    if (end >= fileSize) end = fileSize - 1;
  } else {
    return null;
  }

  return { start, end };
}

/**
 * Determine MIME type from file extension.
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    ".mp3":  "audio/mpeg",
    ".m4a":  "audio/mp4",
    ".ogg":  "audio/ogg",
    ".wav":  "audio/wav",
    ".flac": "audio/flac",
    ".aac":  "audio/aac",
    ".webm": "audio/webm",
  };
  return types[ext] || "application/octet-stream";
}

module.exports = { createStream, parseRange };
