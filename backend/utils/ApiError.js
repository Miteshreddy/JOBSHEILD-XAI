/** Thrown by controllers for expected failure conditions; caught by
 * middleware/errorHandler.js and rendered per IR-11's consistent JSON error
 * schema (status code, error message, optional field-level detail). */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, ApiError);
  }
}

module.exports = ApiError;
