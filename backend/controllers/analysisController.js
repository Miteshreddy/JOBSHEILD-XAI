const Analysis = require("../models/Analysis");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const aiService = require("../utils/aiServiceClient");
const { analyzeText: runBasicAnalysis } = require("../utils/localAnalyzer");
const { extractTextFromPdf } = require("../utils/pdfParser");
const { scrapeUrl } = require("../utils/urlScraper");
const logger = require("../utils/logger");

const REPORT_FIELDS = [
  "extractedText", "verdict", "legitimacyScore", "fraudProbability", "riskCategory", "confidence",
  "summary", "reasoning", "redFlags", "greenFlags", "advice", "company", "source", "checks",
  "factors", "highlights", "explanation", "signals", "engine",
];

/** The analysis service being down (not merely rejecting the input). */
function isServiceUnavailable(err) {
  return err instanceof ApiError && (err.statusCode === 503 || err.statusCode === 504);
}

/** Basic mode: keyword heuristics only, used when the analysis service can't
 * be reached so the site still answers — the report says it's limited. */
async function basicReport(inputType, payload) {
  let text = payload.text;
  if (inputType === "url") text = await scrapeUrl(payload.url);
  if (inputType === "pdf") text = await extractTextFromPdf(payload.buffer);
  if (inputType === "image") {
    throw new ApiError(503, "Screenshot analysis needs the analysis service, which isn't running. Paste the text instead, or start JobShield with launch.py.");
  }
  if (!text || text.trim().length < 20) {
    throw new ApiError(422, "No usable text content found in the submitted material.");
  }
  return runBasicAnalysis(text, { inputType, url: payload.url });
}

async function analyzeAndPersist(req, inputType, sourceReference, payload) {
  let report;
  try {
    if (inputType === "text") report = await aiService.analyzeText(payload.text);
    else if (inputType === "url") report = await aiService.analyzeUrl(payload.url);
    else if (inputType === "pdf") report = await aiService.analyzePdf(payload.buffer, payload.filename);
    else report = await aiService.analyzeImage(payload.buffer, payload.filename, payload.mimetype);
  } catch (err) {
    if (!isServiceUnavailable(err)) throw err;
    logger.warn(`Analysis service unavailable (${err.message}); answering in basic mode.`);
    try {
      report = await basicReport(inputType, payload);
    } catch (fallbackErr) {
      if (fallbackErr instanceof ApiError) throw fallbackErr;
      throw new ApiError(422, `Could not read this ${inputType}: ${fallbackErr.message}`);
    }
  }

  const doc = { userId: req.user?.id || null, inputType, sourceReference };
  for (const field of REPORT_FIELDS) {
    if (report[field] !== undefined) doc[field] = report[field];
  }
  const saved = await Analysis.create(doc);
  const body = saved.toObject();
  delete body.engine;
  return body;
}

const submitText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  res.status(201).json(await analyzeAndPersist(req, "text", text.slice(0, 200), { text }));
});

const submitUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;
  res.status(201).json(await analyzeAndPersist(req, "url", url, { url }));
});

const submitPdf = asyncHandler(async (req, res) => {
  const { buffer, originalname } = req.file;
  res.status(201).json(await analyzeAndPersist(req, "pdf", originalname, { buffer, filename: originalname }));
});

const submitImage = asyncHandler(async (req, res) => {
  const { buffer, originalname, mimetype } = req.file;
  res.status(201).json(await analyzeAndPersist(req, "image", originalname, { buffer, filename: originalname, mimetype }));
});

const getById = asyncHandler(async (req, res) => {
  const analysis = await Analysis.findById(req.params.id);
  if (!analysis) {
    throw new ApiError(404, "Analysis not found.");
  }
  // Signed-in users may only open their own analyses; anonymous analyses
  // (userId === null) are reachable by whoever holds the unguessable id.
  if (analysis.userId && (!req.user || String(analysis.userId) !== req.user.id)) {
    throw new ApiError(403, "You do not have permission to view this analysis.");
  }
  res.status(200).json(analysis);
});

module.exports = { submitText, submitUrl, submitPdf, submitImage, getById };
