import { Microscope, Telescope } from 'lucide-react';
import type { LimeExplanation, ShapExplanation } from '@/types';
import { ExplanationBarChart } from '@/components/dashboard/ExplanationBarChart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordion';

export function ExplainabilityPanels({
  shap,
  lime,
}: {
  shap: ShapExplanation;
  lime: LimeExplanation;
}) {
  return (
    <Accordion type="multiple" defaultValue={['lime']} className="space-y-3">
      <AccordionItem value="lime">
        <AccordionTrigger>
          <div className="flex items-center gap-2.5 text-left">
            <Microscope className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Why this posting, specifically (LIME)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Words that drove this individual prediction</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ExplanationBarChart features={lime.features} valueKey="weight" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Red bars push the prediction toward <strong>fraudulent</strong>; green bars push toward{' '}
            <strong>legitimate</strong>.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="shap">
        <AccordionTrigger>
          <div className="flex items-center gap-2.5 text-left">
            <Telescope className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">What the model relies on overall (SHAP)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Global feature importance across a sample of {shap.sample_size ?? 'many'} advertisements
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <ExplanationBarChart features={shap.features} valueKey="mean_impact" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            These are the words that most influence the model's fraud predictions in general, not just for this
            advertisement.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
