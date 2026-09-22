import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalysisPage } from './AnalysisPage';
import { AnalysisDetailPage } from './AnalysisDetailPage';
import * as analysisApi from '@/api/analysis';

vi.mock('@/api/analysis');

const FAKE_ANALYSIS = {
  _id: '1',
  userId: null,
  inputType: 'text' as const,
  sourceReference: 'urgent hiring pay a fee',
  extractedText: 'urgent hiring pay a fee',
  fraudProbability: 0.92,
  predictionLabel: 'fraudulent' as const,
  trustScore: 10,
  trustBand: 'Very Low Trust' as const,
  riskCategory: 'Critical' as const,
  severityScore: 90,
  severityFlags: ['registration_fee_requested'],
  shapExplanation: { type: 'shap_global', target_class: 'fraudulent', features: [] },
  limeExplanation: { type: 'lime_local', target_class: 'fraudulent', features: [] },
  recommendations: ['Do NOT apply.'],
  warnings: ['Critical warning: registration fee requested.'],
  createdAt: new Date().toISOString(),
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/analyze']}>
        <Routes>
          <Route path="/analyze" element={<AnalysisPage />} />
          <Route path="/analyze/:id" element={<AnalysisDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('AnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to the Text tab and switches modes on click', async () => {
    renderPage();
    expect(screen.getByPlaceholderText(/paste the full job advertisement/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'URL' }));
    expect(await screen.findByPlaceholderText(/https:\/\/example.com/i)).toBeInTheDocument();
  });

  it('shows a validation error instead of submitting empty text', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }));
    expect(await screen.findByText(/please paste the job advertisement text/i)).toBeInTheDocument();
    expect(analysisApi.submitText).not.toHaveBeenCalled();
  });

  it('submits text and navigates to the result page for that analysis', async () => {
    vi.mocked(analysisApi.submitText).mockResolvedValue(FAKE_ANALYSIS);
    vi.mocked(analysisApi.getAnalysisById).mockResolvedValue(FAKE_ANALYSIS);
    renderPage();

    await userEvent.type(
      screen.getByPlaceholderText(/paste the full job advertisement/i),
      'urgent hiring pay a fee'
    );
    await userEvent.click(screen.getByRole('button', { name: /analyze/i }));

    await waitFor(() => expect(analysisApi.getAnalysisById).toHaveBeenCalledWith('1'));
    await waitFor(() => expect(screen.getByText('Critical Risk')).toBeInTheDocument());
    expect(screen.getByText('Do NOT apply.')).toBeInTheDocument();
  });
});
