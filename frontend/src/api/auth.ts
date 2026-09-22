import { apiClient } from '@/api/client';
import type { User } from '@/types';

export async function register(name: string, email: string, password: string) {
  const res = await apiClient.post<{ user: User; accessToken: string }>('/auth/register', {
    name,
    email,
    password,
  });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await apiClient.post<{ user: User; accessToken: string }>('/auth/login', {
    email,
    password,
  });
  return res.data;
}

export async function refresh() {
  const res = await apiClient.post<{ accessToken: string }>('/auth/refresh');
  return res.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function logoutAll() {
  await apiClient.post('/auth/logout-all');
}

export async function me() {
  const res = await apiClient.get<{ user: User }>('/auth/me');
  return res.data.user;
}
