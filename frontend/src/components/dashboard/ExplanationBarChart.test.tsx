import { describe, expect, it } from 'vitest';
import { colorForValue, toChartData } from './ExplanationBarChart';

describe('colorForValue', () => {
  it('colors negative values green (pushes toward legitimate)', () => {
    expect(colorForValue(-0.15)).toBe('#16a34a');
  });

  it('colors positive/zero values red (pushes toward fraudulent)', () => {
    expect(colorForValue(0.2)).toBe('#dc2626');
    expect(colorForValue(0)).toBe('#dc2626');
  });
});

describe('toChartData', () => {
  it('plots the signed mean_impact, not the always-positive mean_abs_impact', () => {
    // Regression: the SHAP panel used to plot mean_abs_impact (always >= 0)
    // while coloring by sign, so every feature rendered red ("fraudulent")
    // even when its real mean_impact was negative ("legitimate").
    const features = [
      { feature: 'hospital', mean_impact: -0.15, mean_abs_impact: 0.15, occurrences: 3 },
      { feature: 'urgent', mean_impact: 0.2, mean_abs_impact: 0.2, occurrences: 5 },
    ];
    const data = toChartData(features, 'mean_impact', 10);

    const hospital = data.find((d) => d.feature === 'hospital')!;
    const urgent = data.find((d) => d.feature === 'urgent')!;
    expect(hospital.value).toBe(-0.15);
    expect(colorForValue(hospital.value)).toBe('#16a34a');
    expect(urgent.value).toBe(0.2);
    expect(colorForValue(urgent.value)).toBe('#dc2626');
  });

  it('sorts by magnitude descending and respects maxFeatures', () => {
    const features = [
      { feature: 'a', weight: 0.01 },
      { feature: 'b', weight: -0.5 },
      { feature: 'c', weight: 0.3 },
    ];
    const data = toChartData(features, 'weight', 2);
    expect(data.map((d) => d.feature)).toEqual(['b', 'c']);
  });
});
