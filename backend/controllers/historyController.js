const Analysis = require("../models/Analysis");
const asyncHandler = require("../utils/asyncHandler");

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "riskCategory"]);

/** FR-10.3/FR-10.4/UC-6: list the authenticated user's past analyses,
 * most recent first by default, optionally filtered by risk category and
 * sorted by date or risk category. */
const listHistory = asyncHandler(async (req, res) => {
  const { riskCategory, sortBy = "createdAt", order = "desc", page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user.id };
  if (riskCategory) {
    filter.riskCategory = riskCategory;
  }

  const sortField = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const sortDirection = order === "asc" ? 1 : -1;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [analyses, total] = await Promise.all([
    Analysis.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Analysis.countDocuments(filter),
  ]);

  res.status(200).json({
    analyses,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

module.exports = { listHistory };
