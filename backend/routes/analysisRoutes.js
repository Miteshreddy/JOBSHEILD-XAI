const express = require("express");
const { body, param } = require("express-validator");
const validate = require("../middleware/validate");
const { pdfUploadMiddleware, imageUploadMiddleware } = require("../middleware/upload");
const analysisController = require("../controllers/analysisController");

const router = express.Router();

/**
 * @openapi
 * /analyze/text:
 *   post:
 *     summary: Analyze raw pasted job advertisement text (FR-1.1, UC-1)
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string }
 *     responses:
 *       201: { description: Completed analysis, persisted and returned. }
 *       422: { description: Empty or missing text. }
 */
router.post(
  "/text",
  [body("text").trim().notEmpty().withMessage("Job advertisement text must not be empty.")],
  validate,
  analysisController.submitText
);

/**
 * @openapi
 * /analyze/url:
 *   post:
 *     summary: Analyze a job advertisement URL (FR-1.2, UC-2)
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url: { type: string, format: uri }
 *     responses:
 *       201: { description: Completed analysis, persisted and returned. }
 *       422: { description: Malformed URL. }
 */
router.post(
  "/url",
  [
    body("url")
      .trim()
      .isURL({ protocols: ["http", "https"], require_protocol: true })
      .withMessage("A valid http(s) URL is required."),
  ],
  validate,
  analysisController.submitUrl
);

/**
 * @openapi
 * /analyze/pdf:
 *   post:
 *     summary: Analyze an uploaded PDF recruitment notice (FR-1.3, UC-3)
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Completed analysis, persisted and returned. }
 *       400: { description: Missing file or content does not match declared type. }
 *       413: { description: File exceeds the maximum allowed size. }
 */
router.post("/pdf", pdfUploadMiddleware, analysisController.submitPdf);

/**
 * @openapi
 * /analyze/image:
 *   post:
 *     summary: Analyze an uploaded screenshot/image via OCR (FR-1.4, UC-4)
 *     tags: [Analysis]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       201: { description: Completed analysis, persisted and returned. }
 *       400: { description: Missing file or content does not match declared type. }
 *       413: { description: File exceeds the maximum allowed size. }
 */
router.post("/image", imageUploadMiddleware, analysisController.submitImage);

/**
 * @openapi
 * /analyze/{id}:
 *   get:
 *     summary: Reopen a specific past analysis (UC-5)
 *     tags: [Analysis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: The stored analysis. }
 *       403: { description: Not permitted to view another account's analysis. }
 *       404: { description: No analysis with that id. }
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid analysis id.")],
  validate,
  analysisController.getById
);

module.exports = router;
