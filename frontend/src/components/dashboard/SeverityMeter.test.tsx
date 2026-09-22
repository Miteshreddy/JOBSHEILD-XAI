import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeverityMeter } from './SeverityMeter';

describe('SeverityMeter', () => {
  it('shows human-readable labels for severity flags, not raw keys', () => {
    render(<SeverityMeter score={75} flags={['registration_fee_requested', 'whatsapp_only_contact']} />);
    expect(screen.getByText('Registration fee requested')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp-only contact')).toBeInTheDocument();
    expect(screen.queryByText('registration_fee_requested')).not.toBeInTheDocument();
  });

  it('renders no flag list when there are no flags', () => {
    render(<SeverityMeter score={0} flags={[]} />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it.each([
    [10, 'Low severity'],
    [30, 'Medium severity'],
    [50, 'High severity'],
    [90, 'Critical severity'],
  ])('bands a score of %i as %s', (score, expectedLabel) => {
    render(<SeverityMeter score={score} flags={[]} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });
});
