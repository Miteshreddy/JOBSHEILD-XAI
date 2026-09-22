import { apiClient } from '@/api/client';
import type { Analysis, PaginatedHistory, RiskCategory } from '@/types';

export async function submitText(text: string) {
  const res = await apiClient.post<Analysis>('/analyze/text', { text });
  return res.data;
}

export async function submitUrl(url: string) {
  const res = await apiClient.post<Analysis>('/analyze/url', { url });
  return res.data;
}

export async function submitFile(kind: 'pdf' | 'image', file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<Analysis>(`/analyze/${kind}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getAnalysisById(id: string) {
  const res = await apiClient.get<Analysis>(`/analyze/${id}`);
  return res.data;
}

export interface HistoryParams {
  riskCategory?: RiskCategory;
  sortBy?: 'createdAt' | 'riskCategory';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export async function listHistory(params: HistoryParams = {}) {
  const res = await apiClient.get<PaginatedHistory>('/history', { params });
  return res.data;
}
