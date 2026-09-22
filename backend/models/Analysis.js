const mongoose = require("mongoose");

/** SRS Section 6.2.1 — one document per completed analysis. */
const analysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    inputType: { type: String, enum: ["text", "url", "pdf", "image"], required: true },
    sourceReference: { type: String, required: true },
    extractedText: { type: String, required: true },

    fraudProbability: { type: Number, required: true, min: 0, max: 1 },
    predictionLabel: { type: String, enum: ["fraudulent", "legitimate"], required: true },

    trustScore: { type: Number, required: true, min: 0, max: 100 },
    trustBand: {
      type: String,
      enum: ["Highly Trustworthy", "Moderately Trustworthy", "Suspicious", "Very Low Trust"],
      required: true,
    },

    riskCategory: { type: String, enum: ["Low", "Medium", "High", "Critical"], required: true },

    severityScore: { type: Number, required: true, min: 0, max: 100 },
    severityFlags: { type: [String], default: [] },

    shapExplanation: { type: mongoose.Schema.Types.Mixed, default: null },
    limeExplanation: { type: mongoose.Schema.Types.Mixed, default: null },

    recommendations: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ riskCategory: 1 });

module.exports = mongoose.model("Analysis", analysisSchema);
