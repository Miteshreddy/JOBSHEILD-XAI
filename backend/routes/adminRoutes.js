const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     summary: Aggregate platform statistics (admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Total users/analyses and risk/label breakdowns. }
 *       403: { description: Not an admin. }
 */
router.get("/stats", adminController.getStats);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Paginated user list (admin only)
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Paginated users. }
 *       403: { description: Not an admin. }
 */
router.get("/users", adminController.listUsers);

module.exports = router;
