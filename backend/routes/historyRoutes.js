const express = require("express");
const { requireAuth } = require("../middleware/auth");
const historyController = require("../controllers/historyController");

const router = express.Router();

/**
 * @openapi
 * /history:
 *   get:
 *     summary: List the authenticated user's past analyses (FR-10.3, FR-10.4, UC-6)
 *     tags: [History]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: riskCategory
 *         schema: { type: string, enum: [Low, Medium, High, Critical] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [createdAt, riskCategory], default: createdAt }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated list of the user's past analyses. }
 *       401: { description: Authentication required. }
 */
router.get("/", requireAuth, historyController.listHistory);

module.exports = router;
