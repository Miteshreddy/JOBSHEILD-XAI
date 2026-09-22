const User = require("../models/User");
const Analysis = require("../models/Analysis");
const asyncHandler = require("../utils/asyncHandler");

/** Minimal System Administrator support (SRS 2.3 lists this as a future
 * role — kept intentionally small: aggregate visibility, not full user
 * management, since the SRS doesn't specify moderation actions for it). */
const getStats = asyncHandler(async (_req, res) => {
  const [totalUsers, totalAnalyses, riskCounts, labelCounts] = await Promise.all([
    User.countDocuments(),
    Analysis.countDocuments(),
    Analysis.aggregate([{ $group: { _id: "$riskCategory", count: { $sum: 1 } } }]),
    Analysis.aggregate([{ $group: { _id: "$predictionLabel", count: { $sum: 1 } } }]),
  ]);

  const riskCategoryCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  riskCounts.forEach((row) => {
    riskCategoryCounts[row._id] = row.count;
  });

  const predictionLabelCounts = { fraudulent: 0, legitimate: 0 };
  labelCounts.forEach((row) => {
    predictionLabelCounts[row._id] = row.count;
  });

  res.status(200).json({ totalUsers, totalAnalyses, riskCategoryCounts, predictionLabelCounts });
});

const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(),
  ]);

  res.status(200).json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

module.exports = { getStats, listUsers };
