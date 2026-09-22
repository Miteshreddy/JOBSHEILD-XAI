/**
 * PDF text extractor using pdf-parse@1.1.1 (pure JS, no system deps).
 */
const pdfParse = require("pdf-parse");

/**
 * Extract text content from a PDF buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || "").trim();
    if (!text) {
      throw new Error("Could not extract text from this PDF. It may be a scanned image-only PDF — try the Image Upload tab instead.");
    }
    return text;
  } catch (err) {
    if (err.message && err.message.includes("Could not extract")) throw err;
    throw new Error(`Failed to parse PDF: ${err.message}`);
  }
}

module.exports = { extractTextFromPdf };
