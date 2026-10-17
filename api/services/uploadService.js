"use strict";

const multer = require("multer");
const crypto = require("crypto");
const path   = require("path");
const fs     = require("fs");

// ── Configuration ────────────────────────────────────────────────────────────
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOADS_DIR   = path.resolve(__dirname, "../../uploads");
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);
const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/png":  ".png",
  "image/gif":  ".gif",
  "image/webp": ".webp",
};

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Multer storage (memory) ──────────────────────────────────────────────────
const storage = multer.memoryStorage();

/**
 * File filter — rejects anything that isn't an allowed image type.
 */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type "${file.mimetype}". Allowed: jpg, png, gif, webp.`));
  }
}

/**
 * Pre-configured multer instance.
 * Usage in a route:
 *   const { upload } = require("../services/uploadService");
 *   app.post("/api/upload", upload.single("image"), handler);
 */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Saves a multer file buffer to disk and returns the public URL path.
 *
 * @param {object} file - The multer file object (from req.file)
 * @returns {{ filename: string, path: string, url: string, size: number }}
 */
function saveFile(file) {
  if (!file || !file.buffer) {
    throw new Error("No file provided");
  }

  const ext      = MIME_TO_EXT[file.mimetype] || path.extname(file.originalname).toLowerCase();
  const uuid     = crypto.randomUUID();
  const filename = `${uuid}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  fs.writeFileSync(filePath, file.buffer);

  return {
    filename,
    path: filePath,
    url: `/uploads/${filename}`,
    size: file.size,
  };
}

/**
 * Deletes a previously uploaded file by filename.
 *
 * @param {string} filename - The filename (UUID-based) to remove
 * @returns {boolean} true if deleted, false if file didn't exist
 */
function deleteFile(filename) {
  const filePath = path.join(UPLOADS_DIR, path.basename(filename));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Express error-handling middleware for multer errors.
 * Mount AFTER routes that use `upload`:
 *   app.use(uploadErrorHandler);
 */
function uploadErrorHandler(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.startsWith("Invalid file type")) {
    return res.status(415).json({ error: err.message });
  }
  next(err);
}

module.exports = {
  upload,
  saveFile,
  deleteFile,
  uploadErrorHandler,
  UPLOADS_DIR,
  MAX_FILE_SIZE,
};
