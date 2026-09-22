import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RiskBadge } from './RiskBadge';

describe('RiskBadge', () => {
  it.each([
    ['Low', 'text-risk-low'],
    ['Medium', 'text-risk-medium'],
    ['High', 'text-risk-high'],
    ['Critical', 'text-risk-critical'],
  ] as const)('renders %s risk with the correct color class', (category, colorClass) => {
    render(<RiskBadge category={category} />);
    const badge = screen.getByText(`${category} Risk`);
    expect(badge).toHaveClass(colorClass);
  });
});
