// ====================== Upload Controller (Single File) ======================
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");

// ====================== Konfigurasi ======================
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ====================== Utils ======================
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function safeJoin(root, ...segments) {
  const targetPath = path.join(root, ...segments);
  const normalizedRoot = path.resolve(root);
  const normalizedTarget = path.resolve(targetPath);
  if (!normalizedTarget.startsWith(normalizedRoot)) {
    throw new Error("Invalid path.");
  }
  return normalizedTarget;
}

function extFromMime(mime) {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "image/heic":
      return ".heic";
    case "image/heif":
      return ".heif";
    default:
      return ".bin";
  }
}

function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");
  return `${proto}://${host}`;
}

// ====================== Service Penyimpanan ======================
async function saveImageBuffer({ req, buffer, mime, segments = [], filename }) {
  if (!ALLOWED_IMAGE_MIME.has(mime)) {
    throw new Error("Tipe file tidak didukung. Gunakan jpg, jpeg, png, webp, gif, heic/heif.");
  }

  await ensureDir(UPLOADS_ROOT);

  const dirPath = safeJoin(UPLOADS_ROOT, ...segments);
  await ensureDir(dirPath);

  const filePath = safeJoin(dirPath, filename);
  await fs.writeFile(filePath, buffer);

//   const baseUrl = getBaseUrl(req);
//   const publicUrl = `${baseUrl}/uploads/${segments.join("/")}/${filename}`;
  const publicUrl = `uploads/${segments.join("/")}/${filename}`;

  return {
    filePath,
    publicUrl,
    filename,
    size: buffer?.length || 0,
    mime,
  };
}

async function saveEmployeeImageBuffer({ req, buffer, mime, companyId, employeeId }) {
  const ext = extFromMime(mime);
  const filename = `employee_id_${employeeId}${ext}`;
  return saveImageBuffer({
    req,
    buffer,
    mime,
    segments: [`company_id_${companyId}`, "employee"],
    filename,
  });
}

// ====================== Middleware Multer ======================
const storage = multer.memoryStorage();
function fileFilter(req, file, cb) {
  if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
    return cb(new Error("Tipe file tidak didukung."));
  }
  cb(null, true);
}
const uploadSingleImage = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single("picture");

// ====================== Controller ======================
const ImageUploadCtrl = {
  async uploadEmployeeImage(req, res) {
    try {
      const { companyId, employeeId } = req.body;
      if (!companyId || !employeeId) {
        return res.status(400).json({ success: false, message: "companyId dan employeeId wajib diisi" });
      }
      if (!req.file?.buffer || !req.file?.mimetype) {
        return res.status(400).json({ success: false, message: "File image wajib diunggah" });
      }

      const result = await saveEmployeeImageBuffer({
        req,
        buffer: req.file.buffer,
        mime: req.file.mimetype,
        companyId,
        employeeId,
      });

      return res.json({ success: true, message: "Upload berhasil", data: result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async uploadGenericImage(req, res) {
    try {
      if (!req.file?.buffer || !req.file?.mimetype) {
        return res.status(400).json({ success: false, message: "File image wajib diunggah" });
      }

      const { folderA = "misc", folderB = "", filename: customName } = req.body;
      const ext = extFromMime(req.file.mimetype);
      const filename = customName ? `${customName}${ext}` : `${Date.now()}${ext}`;
      const segments = folderB ? [folderA, folderB] : [folderA];

      const result = await saveImageBuffer({
        req,
        buffer: req.file.buffer,
        mime: req.file.mimetype,
        segments,
        filename,
      });

      return res.json({ success: true, message: "Upload berhasil", data: result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
}

module.exports = { ImageUploadCtrl, uploadSingleImage, saveEmployeeImageBuffer };
