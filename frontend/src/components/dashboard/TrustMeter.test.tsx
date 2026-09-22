import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrustMeter } from './TrustMeter';

describe('TrustMeter', () => {
  it('shows the numeric score and band label', () => {
    render(<TrustMeter score={94} band="Highly Trustworthy" />);
    expect(screen.getByText('94/100')).toBeInTheDocument();
    expect(screen.getByText('Highly Trustworthy')).toBeInTheDocument();
  });

  it('renders the meter bar width proportional to the score', () => {
    const { container } = render(<TrustMeter score={30} band="Suspicious" />);
    const bar = container.querySelector('[style*="width"]') as HTMLElement;
    expect(bar.style.width).toBe('30%');
  });
});
