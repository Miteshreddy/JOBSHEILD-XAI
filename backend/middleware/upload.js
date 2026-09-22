const multer = require("multer");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

const storage = multer.memoryStorage();

const pdfUpload = multer({
  storage,
  limits: { fileSize: env.maxPdfUploadBytes },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "application/pdf");
  },
}).single("file");

const imageUpload = multer({
  storage,
  limits: { fileSize: env.maxImageUploadBytes },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
}).single("file");

function wrapMulter(multerMiddleware, humanLabel) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(413, `${humanLabel} exceeds the maximum allowed size.`));
        }
        return next(new ApiError(400, `Upload error: ${err.message}`));
      }
      if (err) return next(err);
      if (!req.file) {
        return next(new ApiError(400, `No ${humanLabel.toLowerCase()} file was provided.`));
      }
      next();
    });
  };
}

/** NFR-6: declared Content-Type/extension is not trusted alone — verify the
 * real file signature (magic bytes) matches what the route expects. */
function verifyFileSignature(expectedMimePrefixes) {
  return async (req, _res, next) => {
    try {
      const { fileTypeFromBuffer } = await import("file-type");
      const detected = await fileTypeFromBuffer(req.file.buffer);
      const matches = detected && expectedMimePrefixes.some((p) => detected.mime.startsWith(p));
      if (!matches) {
        throw new ApiError(
          400,
          "The uploaded file's content does not match its declared type. " +
            "This can happen with corrupted files or a mismatched file extension."
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  pdfUploadMiddleware: [wrapMulter(pdfUpload, "PDF file"), verifyFileSignature(["application/pdf"])],
  imageUploadMiddleware: [wrapMulter(imageUpload, "Image file"), verifyFileSignature(["image/"])],
};
