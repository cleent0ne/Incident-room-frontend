import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OAuthButtons } from './oauth-buttons';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    get: vi.fn(),
  };
});

describe('OAuthButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders configured provider links when returned from backend', async () => {
    vi.mocked(api.get).mockResolvedValue({ providers: ['google', 'github'] });

    render(<OAuthButtons />);

    const google = await screen.findByRole('link', { name: /continue with google/i });
    const github = await screen.findByRole('link', { name: /continue with github/i });

    expect(google).toHaveAttribute('href', '/oauth2/authorization/google');
    expect(github).toHaveAttribute('href', '/oauth2/authorization/github');
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('renders only google if github is not configured', async () => {
    vi.mocked(api.get).mockResolvedValue({ providers: ['google'] });

    render(<OAuthButtons />);

    const google = await screen.findByRole('link', { name: /continue with google/i });
    expect(google).toHaveAttribute('href', '/oauth2/authorization/google');
    await vi.waitFor(() => {
      expect(screen.queryByRole('link', { name: /continue with github/i })).not.toBeInTheDocument();
    });
  });

  it('renders nothing when no providers are configured', async () => {
    vi.mocked(api.get).mockResolvedValue({ providers: [] });

    const { container } = render(<OAuthButtons />);

    await vi.waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});

