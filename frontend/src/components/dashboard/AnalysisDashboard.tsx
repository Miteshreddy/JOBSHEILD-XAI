import { ShieldCheck, ShieldX } from 'lucide-react';
import type { Analysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { RiskBadge } from '@/components/dashboard/RiskBadge';
import { TrustMeter } from '@/components/dashboard/TrustMeter';
import { SeverityMeter } from '@/components/dashboard/SeverityMeter';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { ExplainabilityPanels } from '@/components/dashboard/ExplainabilityPanels';

/** SRS Module 8 — the Explainability Dashboard (FR-9.1-9.7, IR-2). Every
 * output converges here regardless of which input channel produced it. */
export function AnalysisDashboard({ analysis }: { analysis: Analysis }) {
  const isFraudulent = analysis.predictionLabel === 'fraudulent';
  const PredictionIcon = isFraudulent ? ShieldX : ShieldCheck;

  return (
    <div className="animate-fade-in-up space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isFraudulent ? 'bg-risk-critical-bg' : 'bg-risk-low-bg'
              }`}
            >
              <PredictionIcon
                className={`h-6 w-6 ${isFraudulent ? 'text-risk-critical' : 'text-risk-low'}`}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Prediction</p>
              <p className={`text-2xl font-bold ${isFraudulent ? 'text-risk-critical' : 'text-risk-low'}`}>
                {isFraudulent ? 'Likely Fraudulent' : 'Likely Legitimate'}
              </p>
              <p className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
                Fraud probability: {(analysis.fraudProbability * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <RiskBadge category={analysis.riskCategory} size="lg" />
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <TrustMeter score={analysis.trustScore} band={analysis.trustBand} />
        </Card>
        <Card>
          <SeverityMeter score={analysis.severityScore} flags={analysis.severityFlags} />
        </Card>
      </div>

      <RecommendationCard
        riskCategory={analysis.riskCategory}
        recommendations={analysis.recommendations}
        warnings={analysis.warnings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Explainability</CardTitle>
        </CardHeader>
        <CardContent>
          <ExplainabilityPanels shap={analysis.shapExplanation} lime={analysis.limeExplanation} />
        </CardContent>
      </Card>
    </div>
  );
}
