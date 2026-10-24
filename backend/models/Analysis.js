const mongoose = require("mongoose");

const { Mixed } = mongoose.Schema.Types;

/** One document per completed analysis — the AI service's report plus who
 * asked for it and what they submitted. */
const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inputType: { type: String, enum: ["text", "url", "pdf", "image"], required: true },
    sourceReference: { type: String, required: true },
    extractedText: { type: String, required: true },

    verdict: { type: String, enum: ["legitimate", "suspicious", "fraudulent"], required: true },
    legitimacyScore: { type: Number, required: true, min: 0, max: 100 },
    fraudProbability: { type: Number, required: true, min: 0, max: 1 },
    riskCategory: { type: String, enum: ["Low", "Medium", "High", "Critical"], required: true },
    confidence: { type: String, enum: ["high", "medium", "low"], required: true },

    summary: { type: String, default: "" },
    reasoning: { type: [String], default: [] },
    redFlags: { type: [String], default: [] },
    greenFlags: { type: [String], default: [] },
    advice: { type: [String], default: [] },

    company: { type: Mixed, default: {} },
    source: { type: Mixed, default: {} },
    checks: { type: [Mixed], default: [] },
    factors: { type: [Mixed], default: [] },
    highlights: { type: [Mixed], default: [] },
    explanation: { type: Mixed, default: null },
    signals: { type: Mixed, default: {} },
    // Internal diagnostics (rule applied, model ids) — never sent to clients.
    engine: { type: Mixed, default: {}, select: false },
  },
  { timestamps: true }
);

analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ userId: 1, verdict: 1, createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);
