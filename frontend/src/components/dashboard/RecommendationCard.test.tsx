import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecommendationCard } from './RecommendationCard';

describe('RecommendationCard', () => {
  it('renders recommendations and warnings', () => {
    render(
      <RecommendationCard
        riskCategory="Critical"
        recommendations={['Do NOT apply.', 'Verify the company website.']}
        warnings={['Critical warning: registration fee requested.']}
      />
    );
    expect(screen.getByText('Do NOT apply.')).toBeInTheDocument();
    expect(screen.getByText('Verify the company website.')).toBeInTheDocument();
    expect(screen.getByText('Critical warning: registration fee requested.')).toBeInTheDocument();
  });

  it('does not render a Warnings heading when there are none (FR-7.4)', () => {
    render(<RecommendationCard riskCategory="Low" recommendations={['Looks good.']} warnings={[]} />);
    expect(screen.queryByText('Warnings')).not.toBeInTheDocument();
  });
});
