const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const requiredInProduction = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGODB_URI"];

function readEnv() {
  const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "5001", 10),
    mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/fake_job_detection",
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    aiServiceBaseUrl: process.env.AI_SERVICE_BASE_URL || "http://localhost:8000",
    aiServiceTimeoutMs: parseInt(process.env.AI_SERVICE_TIMEOUT_MS || "30000", 10),
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || "http://localhost:5173")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
    maxPdfUploadBytes: parseInt(process.env.MAX_PDF_UPLOAD_BYTES || "10485760", 10),
    maxImageUploadBytes: parseInt(process.env.MAX_IMAGE_UPLOAD_BYTES || "5242880", 10),
    // Number of reverse-proxy hops to trust for X-Forwarded-For (Express's
    // `trust proxy` setting). 0 (default) = trust nothing, correct for
    // `npm run dev` where nothing sits in front of the backend. Set to 1 in
    // the Docker Compose deployment, where nginx is exactly one hop away —
    // trusting X-Forwarded-For with nothing actually proxying is what lets a
    // client spoof its own IP and bypass rate limiting.
    trustProxy: parseInt(process.env.TRUST_PROXY || "0", 10),
  };

  if (env.nodeEnv === "production") {
    const missing = requiredInProduction.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables in production: ${missing.join(", ")}`);
    }
  } else {
    // Non-production convenience defaults ONLY — never used when NODE_ENV=production.
    env.jwtAccessSecret = env.jwtAccessSecret || "dev_only_access_secret_change_me_32_chars_min";
    env.jwtRefreshSecret = env.jwtRefreshSecret || "dev_only_refresh_secret_change_me_32_chars_min";
  }

  return env;
}

module.exports = readEnv();
