import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ExplanationFeature } from '@/types';

interface Props {
  features: ExplanationFeature[];
  // Always the *signed* field — 'mean_abs_impact' is only for ranking
  // (server-side) and is never plotted directly, since it's always >= 0 and
  // would make every bar render as "pushes toward fraudulent" regardless of
  // its real direction.
  valueKey: 'weight' | 'mean_impact';
  maxFeatures?: number;
}

const POSITIVE_COLOR = '#dc2626'; // pushes toward "fraudulent"
const NEGATIVE_COLOR = '#16a34a'; // pushes toward "legitimate"

export function colorForValue(value: number): string {
  return value >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR;
}

export function toChartData(features: ExplanationFeature[], valueKey: Props['valueKey'], maxFeatures: number) {
  // Sort by magnitude FIRST, then take the top N — slicing before sorting
  // would keep whatever happened to be first in `features` and could drop
  // the single most important one.
  return features
    .map((f) => ({ feature: f.feature, value: f[valueKey] ?? 0 }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, maxFeatures);
}

export function ExplanationBarChart({ features, valueKey, maxFeatures = 10 }: Props) {
  const data = toChartData(features, valueKey, maxFeatures);

  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No explanation data available.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
        <XAxis type="number" tick={{ fontSize: 12, fill: 'currentColor' }} className="text-slate-500" />
        <YAxis
          type="category"
          dataKey="feature"
          width={110}
          tick={{ fontSize: 12, fill: 'currentColor' }}
          className="text-slate-600 dark:text-slate-300"
        />
        <Tooltip
          formatter={(value) => (typeof value === 'number' ? value.toFixed(4) : String(value))}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px -2px rgb(15 23 42 / 0.1)',
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={400}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colorForValue(entry.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
