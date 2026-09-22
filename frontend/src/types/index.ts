export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Critical';
export type TrustBand = 'Highly Trustworthy' | 'Moderately Trustworthy' | 'Suspicious' | 'Very Low Trust';
export type InputType = 'text' | 'url' | 'pdf' | 'image';
export type PredictionLabel = 'fraudulent' | 'legitimate';

export interface ExplanationFeature {
  feature: string;
  weight?: number;
  mean_impact?: number;
  mean_abs_impact?: number;
  occurrences?: number;
}

export interface ShapExplanation {
  type: string;
  target_class: string;
  features: ExplanationFeature[];
  sample_size?: number;
}

export interface LimeExplanation {
  type: string;
  target_class: string;
  features: ExplanationFeature[];
}

export interface Analysis {
  _id: string;
  userId: string | null;
  inputType: InputType;
  sourceReference: string;
  extractedText: string;
  fraudProbability: number;
  predictionLabel: PredictionLabel;
  trustScore: number;
  trustBand: TrustBand;
  riskCategory: RiskCategory;
  severityScore: number;
  severityFlags: string[];
  shapExplanation: ShapExplanation;
  limeExplanation: LimeExplanation;
  recommendations: string[];
  warnings: string[];
  createdAt: string;
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
