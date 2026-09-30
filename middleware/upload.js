const path = require("path");
const multer = require("multer");
const fs = require("fs");

const uploadFolder = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const imageAndVideoFilter = (req, file, cb) => {
  const allowedImageTypes = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
  const allowedVideoTypes = [".mp4", ".mov", ".webm", ".ogg"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "avatar" || file.fieldname === "image") {
    if (!allowedImageTypes.includes(ext)) {
      return cb(new Error("Only image files are allowed for this upload"), false);
    }
  }

  if (file.fieldname === "video") {
    if (!allowedVideoTypes.includes(ext)) {
      return cb(new Error("Only video files are allowed for reels"), false);
    }
  }

  cb(null, true);
};

const uploadAvatar = multer({
  storage,
  fileFilter: imageAndVideoFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadPostFields = multer({
  storage,
  fileFilter: imageAndVideoFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = {
  uploadAvatar,
  uploadPostFields
};
