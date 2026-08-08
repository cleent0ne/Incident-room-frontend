'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import { IconGithub, IconGoogle } from '@/components/ui/icons';

interface OAuthProvidersResponse {
  providers: string[];
}

/**
 * "Continue with Google/GitHub" — plain links, not buttons with onClick handlers. This has to
 * be a real top-level navigation (`<a href>`), not a fetch/XHR: the backend's OAuth2 login flow
 * is a multi-step browser redirect dance (frontend → backend → provider → backend → frontend),
 * and only a real navigation lets the browser follow that chain and pick up the session cookie
 * the backend sets partway through. See next.config.js for why these specific paths
 * (/oauth2/authorization/{provider}) are proxied through to the backend rather than pointing at
 * the backend's origin directly.
 *
 * Dynamically fetches enabled providers from `GET /api/v1/auth/oauth-providers` so only
 * working provider buttons (and the "or" divider) are shown.
 */
export function OAuthButtons() {
  const [providers, setProviders] = useState<string[] | null>(null);

  useEffect(() => {
    let mounted = true;
    get<OAuthProvidersResponse>('/api/v1/auth/oauth-providers')
      .then((res) => {
        if (mounted) {
          setProviders(res?.providers ?? []);
        }
      })
      .catch(() => {
        if (mounted) {
          setProviders([]);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!providers || providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="auth-divider">or</div>
      <div className="oauth-buttons">
        {providers.includes('google') && (
          <a className="button outline oauth-button" href="/oauth2/authorization/google">
            <IconGoogle />
            <span>Continue with Google</span>
          </a>
        )}
        {providers.includes('github') && (
          <a className="button outline oauth-button" href="/oauth2/authorization/github">
            <IconGithub />
            <span>Continue with GitHub</span>
          </a>
        )}
      </div>
    </>
  );
}

