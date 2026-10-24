/** A complete analysis-service report, overridable per test. */
function makeReport(overrides = {}) {
  return {
    extractedText: "urgent hiring pay a fee",
    verdict: "fraudulent",
    legitimacyScore: 4,
    fraudProbability: 0.96,
    riskCategory: "Critical",
    confidence: "high",
    summary: "This job shows strong signs of a scam.",
    reasoning: ["Asks for a registration fee."],
    redFlags: ["Asks for a fee or deposit"],
    greenFlags: [],
    advice: ["Don't pay anything."],
    company: { name: null, website: null, verified: false },
    source: { inputType: "text", url: null, platform: null },
    checks: [{ id: "patterns", label: "Scam patterns", status: "fail", detail: "Found: fee." }],
    factors: [{ label: "Asks for a fee or deposit", impact: 3, detail: "..." }],
    highlights: [{ term: "fee", weight: 0.2 }],
    signals: { language: { available: true, score: 0.9 } },
    engine: { rule: "fraud_floor" },
    ...overrides,
  };
}

module.exports = { makeReport };
