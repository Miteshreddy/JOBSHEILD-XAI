const axios = require("axios");
const FormData = require("form-data");
const env = require("../config/env");
const ApiError = require("./ApiError");
const logger = require("./logger");

const client = axios.create({ baseURL: env.aiServiceBaseUrl, timeout: env.aiServiceTimeoutMs });

/** NFR-9: the AI service being unreachable/slow must surface as a clear,
 * actionable error — never an unhandled exception or a leaked stack trace. */
function toApiError(err, context) {
  if (err.code === "ECONNABORTED") {
    return new ApiError(504, `The analysis service timed out while ${context}. Please try again.`);
  }
  if (err.code === "ECONNREFUSED" || !err.response) {
    return new ApiError(503, `The analysis service is currently unavailable (${context}).`);
  }
  const upstreamMessage = err.response.data?.detail || err.response.data?.error || err.message;
  return new ApiError(err.response.status || 502, `Analysis service error: ${upstreamMessage}`);
}

async function analyzeText(text) {
  try {
    const { data } = await client.post("/api/v1/analyze/text", { text });
    return data;
  } catch (err) {
    logger.error(`AI service analyzeText failed: ${err.message}`);
    throw toApiError(err, "analyzing the submitted text");
  }
}

async function analyzeUrl(url) {
  try {
    const { data } = await client.post("/api/v1/analyze/url", { url });
    return data;
  } catch (err) {
    logger.error(`AI service analyzeUrl failed: ${err.message}`);
    throw toApiError(err, "scraping and analyzing the submitted URL");
  }
}

async function analyzeFile(endpoint, buffer, filename, mimetype, context) {
  try {
    const form = new FormData();
    form.append("file", buffer, { filename, contentType: mimetype });
    const { data } = await client.post(endpoint, form, { headers: form.getHeaders() });
    return data;
  } catch (err) {
    logger.error(`AI service ${endpoint} failed: ${err.message}`);
    throw toApiError(err, context);
  }
}

const analyzePdf = (buffer, filename) =>
  analyzeFile("/api/v1/analyze/pdf", buffer, filename, "application/pdf", "extracting the PDF's text");

const analyzeImage = (buffer, filename, mimetype) =>
  analyzeFile("/api/v1/analyze/image", buffer, filename, mimetype, "running OCR on the image");

module.exports = { analyzeText, analyzeUrl, analyzePdf, analyzeImage };
