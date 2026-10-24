/**
 * Basic-mode analyzer: keyword heuristics used ONLY when the analysis service
 * is unreachable, so the site can still answer. It has no language model, no
 * employer verification and no reasoning, and its report says so (signals
 * marked unavailable, confidence capped at "low"). Output matches the
 * analysis service's report schema.
 */

// ─── Fraud signal patterns ────────────────────────────────────────────────────

const FRAUD_SIGNALS = [
  // Money up front / fee-charging
  { name: "fee_required", pattern: /\b(registration fee|training fee|processing fee|deposit required|pay.*to (start|join|work)|send.*money|wire transfer|western union|buy.*kit|starter kit cost)\b/i, weight: 0.18, flag: "Fee-charging employer" },
  // Unrealistic salary
  { name: "unrealistic_salary", pattern: /\b(\$[5-9]\d{3,}|₹\s*[5-9]\d{4,}|earn\s*(upto|up to)?\s*\$?\d{3,}k?\s*(per|a)\s*(week|day)|make\s*(upto|up to)?\s*\$?\d{4,}\s*per\s*(day|week)|unlimited earnings|earn lakhs)\b/i, weight: 0.12, flag: "Unrealistic salary claims" },
  // Urgency language
  { name: "urgency", pattern: /\b(urgent(ly)?|immediate(ly)?|apply now|don'?t miss|limited seats|closing soon|today only|last chance|hurry|asap)\b/i, weight: 0.06, flag: "Urgency pressure tactics" },
  // Work from home (MLM style)
  { name: "wfh_mlm", pattern: /\b(work from home|work at home|home-?based|data entry|typing (job|work)|copy paste|form fill(ing)?|envelope stuff(ing)?|mlm|multi.?level|downline|network marketing)\b/i, weight: 0.09, flag: "Work-from-home scheme indicators" },
  // No experience required
  { name: "no_experience", pattern: /\b(no experience (needed|required|necessary)|anyone can (do|apply)|no qualifications|freshers (can|may) apply|no skill(s)? required)\b/i, weight: 0.07, flag: "No-experience-required (suspicious)" },
  // Vague employer
  { name: "vague_employer", pattern: /\b(a leading company|top mnc|reputed company|well.?known firm|confidential employer|undisclosed company)\b/i, weight: 0.05, flag: "Vague/anonymous employer" },
  // Personal information harvesting
  { name: "personal_info", pattern: /\b(send (your )?(resume|cv|photo|passport|id proof|bank (details|account))|whatsapp (your|the) (resume|cv)|email your photo)\b/i, weight: 0.08, flag: "Suspicious personal info requests" },
  // Suspicious contact channels
  { name: "suspicious_contact", pattern: /\b(whatsapp (only|number|us at)|telegram|contact on (gmail|yahoo|hotmail)|call between \d+)\b/i, weight: 0.07, flag: "Suspicious contact channels" },
  // Guarantee of job
  { name: "guaranteed_job", pattern: /\b(guaranteed (job|income|salary|selection)|100% (placement|job)|sure (job|income)|instant hiring|selected immediately)\b/i, weight: 0.10, flag: "Fraudulent job guarantees" },
  // Part time high pay
  { name: "part_time_high_pay", pattern: /\b(part.?time.*earn(ing)?\s*\$?\d{3,}|(2-3|few|1-2) hours.*earn(ing)?|work \d+ hours.*earn)\b/i, weight: 0.10, flag: "Unrealistic part-time pay" },
  // Government impersonation
  { name: "govt_impersonation", pattern: /\b(government (job|scheme|project)|pm (scheme|project|initiative)|ministry of|government approved|government certified)\b/i, weight: 0.06, flag: "Government impersonation" },
  // Spelling / grammar issues (simplified heuristic)
  { name: "grammar_issues", pattern: /\b(kindly revert|do the needful|send your's|their is|revert back|seek your|plz|pls reply)\b/i, weight: 0.04, flag: "Poor grammar / unprofessional language" },
  // Age discrimination (often scam)
  { name: "age_focus", pattern: /\b(any age|18 to 60|housewife(s)?|students? can|retired persons? can|senior citizens?)\b/i, weight: 0.05, flag: "Unusual age/demographic targeting" },
  // Positive legitimacy signals (reduce fraud score)
  { name: "company_website", pattern: /https?:\/\/[a-zA-Z0-9-]+\.(com|org|net|io|co)\b/i, weight: -0.06, flag: null },
  { name: "established_company", pattern: /\b(founded in \d{4}|est\.\s*\d{4}|nasdaq|nyse|bse|nse listed|fortune 500)\b/i, weight: -0.07, flag: null },
  { name: "professional_email", pattern: /\b[a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|ymail)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, weight: -0.04, flag: null },
  { name: "ats_software", pattern: /\b(workday|greenhouse|lever|taleo|icims|bamboohr|via (indeed|linkedin|glassdoor))\b/i, weight: -0.06, flag: null },
  { name: "equal_opportunity", pattern: /\b(equal opportunity employer|eeo|affirmative action|diversity and inclusion)\b/i, weight: -0.05, flag: null },
  { name: "structured_hiring", pattern: /\b(background check|drug test|technical (interview|assessment)|coding (challenge|test)|take.?home assignment)\b/i, weight: -0.04, flag: null },
];

// Trust-building signals
const TRUST_SIGNALS = [
  { pattern: /\b(registered|incorporated|pvt ltd|limited|llc|inc\.|corp\.)\b/i, weight: 8 },
  { pattern: /\b(glassdoor|linkedin|indeed|careerspage)\b/i, weight: 6 },
  { pattern: /\b(ISO \d{4,5}|certified|accredited)\b/i, weight: 5 },
  { pattern: /https?:\/\/[a-zA-Z0-9-]+\.(com|org|net|io|co)\b/i, weight: 7 },
  { pattern: /\b(benefits|health insurance|401k|pf|gratuity|paid leave|pto)\b/i, weight: 4 },
  { pattern: /\b(interview process|hiring manager|recruitment team)\b/i, weight: 4 },
];

// ─── Core analysis engine ─────────────────────────────────────────────────────

function analyzeText(text, { inputType = "text", url = null } = {}) {
  if (!text || text.trim().length < 20) {
    throw new Error("Text is too short to analyze.");
  }

  const wordCount = text.split(/\s+/).length;

  // Calculate fraud probability
  let fraudScore = 0.20; // baseline for any unverified job posting
  const triggeredSignals = [];
  const featureWeights = [];

  for (const signal of FRAUD_SIGNALS) {
    if (signal.pattern.test(text)) {
      fraudScore += signal.weight;
      if (signal.flag) {
        triggeredSignals.push(signal.flag);
      }
      featureWeights.push({
        feature: signal.name.replace(/_/g, " "),
        weight: signal.weight,
        mean_impact: Math.abs(signal.weight),
        mean_abs_impact: Math.abs(signal.weight),
        occurrences: (text.match(signal.pattern) || []).length,
      });
    } else {
      // Include non-triggered signals with zero weight for the chart
      featureWeights.push({
        feature: signal.name.replace(/_/g, " "),
        weight: 0,
        mean_impact: 0,
        mean_abs_impact: 0,
        occurrences: 0,
      });
    }
  }

  // Clamp to [0.02, 0.97]
  fraudScore = Math.max(0.02, Math.min(0.97, fraudScore));
  // Same rule as the full engine: asking candidates for money is decisive.
  if (FRAUD_SIGNALS[0].pattern.test(text)) fraudScore = Math.max(fraudScore, 0.88);

  // Calculate trust score (0-100)
  let trustScore = 50;
  for (const ts of TRUST_SIGNALS) {
    if (ts.pattern.test(text)) {
      trustScore += ts.weight;
    }
  }
  // Deduct for each fraud flag
  trustScore -= triggeredSignals.length * 7;
  // Bonus for longer/more detailed postings
  if (wordCount > 300) trustScore += 5;
  if (wordCount > 600) trustScore += 5;
  trustScore = Math.max(5, Math.min(95, trustScore));

  // Risk category (combines fraud probability + trust)
  let riskCategory;
  const riskScore = fraudScore * 0.7 + (1 - trustScore / 100) * 0.3;
  if (riskScore < 0.25) riskCategory = "Low";
  else if (riskScore < 0.50) riskCategory = "Medium";
  else if (riskScore < 0.72) riskCategory = "High";
  else riskCategory = "Critical";

  // Severity score
  const severityScore = Math.round(
    Math.max(5, Math.min(95, fraudScore * 85 + triggeredSignals.length * 2.5))
  );

  let domain = null;
  if (url) {
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = null;
    }
  }
  const verdict = fraudScore >= 0.6 ? "fraudulent" : fraudScore >= 0.3 ? "suspicious" : "legitimate";
  const reds = triggeredSignals;
  const greens = FRAUD_SIGNALS.filter((s) => s.weight < 0 && s.pattern.test(text)).map((s) => s.name.replace(/_/g, " "));
  const factors = featureWeights
    .filter((f) => f.weight !== 0 && f.occurrences > 0)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 6)
    .map((f) => ({ label: f.feature, impact: Math.round(f.weight * 100) / 10, detail: "Keyword pattern match (basic mode)." }));

  const advice =
    verdict === "fraudulent"
      ? ["Don’t pay anything or share ID or bank details.", "Stop replying through the contacts in this posting.", "Report the posting to the platform where you found it."]
      : ["Find the same role on the employer’s official careers page.", "Confirm the recruiter through the company’s official channels.", "Never pay fees or share ID before an offer is confirmed."];

  return {
    extractedText: text.slice(0, 20000),
    verdict,
    legitimacyScore: Math.round((1 - fraudScore) * 100),
    fraudProbability: parseFloat(fraudScore.toFixed(4)),
    riskCategory,
    confidence: "low",
    summary:
      verdict === "fraudulent"
        ? `Basic check: this posting matches several scam patterns (${reds.slice(0, 2).join(", ").toLowerCase()}).`
        : "Basic check only: the full analysis service is offline, so the employer and source could not be verified.",
    reasoning: [
      "The full analysis service was unavailable, so only keyword checks were run.",
      reds.length ? `Matched scam patterns: ${reds.join("; ")}.` : "No common scam keywords were found.",
      "Employer, source and links were not verified — treat this result as preliminary.",
    ],
    redFlags: reds,
    greenFlags: greens,
    advice,
    company: { name: null, website: null, verified: false, wellKnown: false, logo: null, lookupSource: null },
    source: { inputType, url, domain, platform: null, platformType: url ? "web" : "none", companyPage: null, applyUrl: null, posted: null },
    checks: [
      { id: "basic", label: "Limited analysis", status: "warn", detail: "The analysis service is offline; employer and source verification were skipped." },
      reds.length
        ? { id: "patterns", label: "Scam patterns", status: "fail", detail: `Found: ${reds.join("; ")}.` }
        : { id: "patterns", label: "Scam patterns", status: "pass", detail: "No common scam keywords found." },
    ],
    factors,
    highlights: [],
    signals: {
      language: { available: false, score: null },
      reasoning: { available: false, verdict: null, confidence: null },
      verification: { checksPassed: reds.length ? 0 : 1, checksFailed: reds.length ? 1 : 0, checksTotal: 2 },
    },
    engine: { mode: "basic", trustScore, severityScore },
  };
}

module.exports = { analyzeText };
