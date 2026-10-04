const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");

// Images are held in memory (never written to the server disk) and then sent to
// Cloudinary. Vercel's filesystem is read-only/ephemeral, so local-disk uploads
// can't work there. When Cloudinary isn't configured (local dev only), we fall
// back to saving into ./uploads exactly like before.
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 6 }, // Vercel caps request bodies at ~4.5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "houserent", resource_type: "image", transformation: [{ width: 1600, crop: "limit", quality: "auto" }] },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

async function saveToDisk(file) {
  const dir = path.join(__dirname, "..", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const name = Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  return `/uploads/${name}`;
}

// Turns req.files (memory buffers) into an array of image URLs/paths.
async function persistImages(files = []) {
  if (!files.length) return [];
  if (cloudinaryConfigured) return Promise.all(files.map((f) => uploadToCloudinary(f.buffer)));
  if (process.env.NODE_ENV === "production") {
    throw new Error("Image storage is not configured (set CLOUDINARY_* variables)");
  }
  return Promise.all(files.map(saveToDisk));
}

module.exports = { upload, persistImages };
