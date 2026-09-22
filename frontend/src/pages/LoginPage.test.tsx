import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import * as authApi from '@/api/auth';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/api/auth');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, accessToken: null, isInitializing: false });
  });

  it('logs in and stores the session on success', async () => {
    const fakeUser = {
      _id: '1',
      name: 'Jane',
      email: 'jane@example.com',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
    };
    vi.mocked(authApi.login).mockResolvedValue({ user: fakeUser, accessToken: 'token-123' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(useAuthStore.getState().user).toEqual(fakeUser));
    expect(useAuthStore.getState().accessToken).toBe('token-123');
  });

  it('shows an error message on invalid credentials', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Invalid email or password.' } },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });
});
