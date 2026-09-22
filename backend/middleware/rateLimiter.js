const rateLimit = require("express-rate-limit");
const env = require("../config/env");

/** NFR-3 groundwork + basic abuse protection. Auth endpoints get a tighter
 * limit since credential-stuffing/brute-force is the higher-value target. */
const generalLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many authentication attempts. Please try again later." },
});

module.exports = { generalLimiter, authLimiter };
