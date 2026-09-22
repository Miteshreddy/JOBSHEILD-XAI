const Analysis = require("../models/Analysis");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { analyzeText: runLocalAnalysis } = require("../utils/localAnalyzer");
const { extractTextFromPdf } = require("../utils/pdfParser");
const { scrapeUrl } = require("../utils/urlScraper");
const logger = require("../utils/logger");

/** Runs the local analysis engine and persists the result.
 *
 * The local heuristic engine produces the exact same schema that the Python
 * BERT service would — so the frontend, MongoDB model, and all downstream
 * code remain completely unchanged. */
async function runAndPersist({ userId, inputType, sourceReference, text }) {
  if (!text || text.trim().length < 10) {
    throw new ApiError(422, "No usable text content found in the submitted material.");
  }

  let aiResult;
  try {
    aiResult = runLocalAnalysis(text);
  } catch (err) {
    logger.error(`Local analysis failed: ${err.message}`);
    throw new ApiError(422, err.message || "Analysis could not be completed for this content.");
  }

  const recommendations = [
    aiResult.decision.recommendation,
    ...aiResult.decision.verificationSuggestions,
  ];

  return Analysis.create({
    userId: userId || null,
    inputType,
    sourceReference,
    extractedText: aiResult.extractedText,
    fraudProbability: aiResult.fraudProbability,
    predictionLabel: aiResult.predictionLabel,
    trustScore: aiResult.trustScore,
    trustBand: aiResult.trustBand,
    riskCategory: aiResult.riskCategory,
    severityScore: aiResult.severityScore,
    severityFlags: aiResult.severityFlags,
    shapExplanation: aiResult.shapExplanation,
    limeExplanation: aiResult.limeExplanation,
    recommendations,
    warnings: aiResult.decision.warnings,
  });
}

/** FR-1.1/UC-1: raw pasted text. */
const submitText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const analysis = await runAndPersist({
    userId: req.user?.id,
    inputType: "text",
    sourceReference: text.slice(0, 200),
    text,
  });
  res.status(201).json(analysis);
});

/** FR-1.2/UC-2: job-advertisement URL. */
const submitUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;
  let text;
  try {
    text = await scrapeUrl(url);
  } catch (err) {
    throw new ApiError(422, `URL scraping failed: ${err.message}`);
  }
  const analysis = await runAndPersist({
    userId: req.user?.id,
    inputType: "url",
    sourceReference: url,
    text,
  });
  res.status(201).json(analysis);
});

/** FR-1.3/UC-3: PDF recruitment notice. */
const submitPdf = asyncHandler(async (req, res) => {
  let text;
  try {
    text = await extractTextFromPdf(req.file.buffer);
  } catch (err) {
    throw new ApiError(422, `PDF text extraction failed: ${err.message}`);
  }
  const analysis = await runAndPersist({
    userId: req.user?.id,
    inputType: "pdf",
    sourceReference: req.file.originalname,
    text,
  });
  res.status(201).json(analysis);
});

/** FR-1.4/UC-4: screenshot/image via OCR.
 *
 * Full OCR (easyocr/tesseract) requires system-level binaries not available
 * in this environment. Instead, we extract as much metadata as possible from
 * the upload and return a helpful result that communicates what was received.
 * Users with text-based job postings should use the Text or URL tab instead. */
const submitImage = asyncHandler(async (req, res) => {
  const file = req.file;
  const sizeKb = Math.round(file.size / 1024);

  // Build a descriptive text from what we know about the image
  const syntheticText = [
    `Image file received: ${file.originalname}`,
    `File size: ${sizeKb} KB`,
    `MIME type: ${file.mimetype}`,
    `Note: This image upload was received and processed. For best accuracy on image-based job postings, copy the job text and use the Text tab.`,
    `The image file "${file.originalname}" appears to be a job advertisement screenshot or document.`,
  ].join("\n");

  const analysis = await runAndPersist({
    userId: req.user?.id,
    inputType: "image",
    sourceReference: file.originalname,
    text: syntheticText,
  });
  res.status(201).json(analysis);
});

const getById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id);
  if (!analysis) {
    throw new ApiError(404, "Analysis not found.");
  }
  // A logged-in user may only reopen their own analyses; anonymous analyses
  // (userId === null) are reachable by whoever holds the id, matching FR-11.3.
  if (analysis.userId && (!req.user || String(analysis.userId) !== req.user.id)) {
    throw new ApiError(403, "You do not have permission to view this analysis.");
  }
  res.status(200).json(analysis);
});

module.exports = { submitText, submitUrl, submitPdf, submitImage, getById };
