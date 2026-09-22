const logger = require("../utils/logger");
const ApiError = require("../utils/ApiError");

/** IR-11: consistent JSON error schema. NFR-8: never leak stack
 * traces/internal paths/DB details to the client. */
function errorHandler(err, req, res, _next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : "An unexpected error occurred.";

  if (!isApiError) {
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`, {
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    status: statusCode,
    error: message,
    ...(isApiError && err.details ? { details: err.details } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ status: 404, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
