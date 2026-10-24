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

/** Session refresh runs once per page load for every signed-in visitor, so it
 * must not share the tight credential-guessing budget above — doing so logged
 * users out after ~20 page loads. It only accepts a valid httpOnly cookie, so
 * a generous limit is safe. */
const refreshLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "Too many requests. Please try again later." },
});

/** Analyses are expensive (scraping, OCR, model inference). */
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  skip: () => env.nodeEnv === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 429, error: "You're checking jobs very quickly — please wait a minute and try again." },
});

module.exports = { generalLimiter, authLimiter, refreshLimiter, analysisLimiter };
