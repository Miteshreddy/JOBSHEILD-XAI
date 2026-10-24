export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type Verdict = 'legitimate' | 'suspicious' | 'fraudulent';
export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Critical';
export type InputType = 'text' | 'url' | 'pdf' | 'image';
export type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
export type Confidence = 'high' | 'medium' | 'low';

export interface VerificationCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface CompanyInfo {
  name: string | null;
  website: string | null;
  verified: boolean;
  wellKnown: boolean;
  logo: string | null;
  lookupSource: 'registry' | 'wikidata' | 'web_search' | null;
  description?: string | null;
}

export interface SourceInfo {
  inputType: InputType;
  url: string | null;
  domain: string | null;
  platform: string | null;
  platformType: 'official' | 'job_board' | 'ats' | 'anonymous' | 'messaging' | 'web' | 'none';
  companyPage: string | null;
  applyUrl: string | null;
  posted: string | null;
}

/** One weighed piece of evidence. `impact` > 0 pushes toward scam, < 0 toward legitimate. */
export interface DecisionFactor {
  label: string;
  impact: number;
  detail: string;
}

export interface Highlight {
  term: string;
  weight: number;
}

/** Word-level attribution of the language score (SHAP; LIME as fallback). */
export interface LanguageExplanation {
  method: 'shap' | 'lime';
  baseValue: number | null;
  outputValue: number | null;
  words: Highlight[];
}

export interface EngineSignals {
  language: { available: boolean; score: number | null };
  reasoning: { available: boolean; verdict: Verdict | null; confidence: number | null };
  verification: { checksPassed: number; checksFailed: number; checksTotal: number };
}

export interface Analysis {
  _id: string;
  userId: string | null;
  inputType: InputType;
  sourceReference: string;
  extractedText: string;
  verdict: Verdict;
  legitimacyScore: number;
  fraudProbability: number;
  riskCategory: RiskCategory;
  confidence: Confidence;
  summary: string;
  reasoning: string[];
  redFlags: string[];
  greenFlags: string[];
  advice: string[];
  company: CompanyInfo;
  source: SourceInfo;
  checks: VerificationCheck[];
  factors: DecisionFactor[];
  highlights: Highlight[];
  explanation?: LanguageExplanation | null;
  signals: EngineSignals;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedHistory {
  analyses: Analysis[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ApiErrorPayload {
  status: number;
  error: string;
  details?: { field: string; message: string }[];
}
