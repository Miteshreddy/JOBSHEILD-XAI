import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ThemeControls } from '@/components/layout/ThemePicker';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useThemeStore } from '@/store/themeStore';

describe('ScoreRing', () => {
  it('exposes the score to assistive technology', () => {
    render(<ScoreRing score={97} verdict="legitimate" />);
    expect(screen.getByRole('img', { name: 'Legitimacy score 97 out of 100' })).toBeInTheDocument();
  });
});

describe('ThemeControls', () => {
  it('switches mode and accent and applies them to the document', () => {
    render(<ThemeControls />);
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Emerald' }));
    expect(useThemeStore.getState().mode).toBe('light');
    expect(useThemeStore.getState().accent).toBe('emerald');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.documentElement.dataset.accent).toBe('emerald');
  });
});

describe('NotFoundPage', () => {
  it('links back home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });
});
