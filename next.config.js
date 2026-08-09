/** @type {import('next').NextConfig} */

// CRITICAL: the backend's CookieService scopes `ir_refresh` to `Path=/api/v1/auth`
// specifically (not `/`, unlike ir_access and ir_csrf). The browser only attaches a
// cookie to a request whose path has the cookie's Path as a *prefix*. That means the
// rewrite MUST preserve `/api/v1/...` verbatim on the frontend's own origin — no extra
// prefix segment like `/api/proxy/...` in front of it, or the refresh cookie will never
// be sent and refresh/logout will silently fail (refresh -> 401, logout -> revokes nothing).
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

if (!BACKEND_BASE_URL) {
  // Fail loudly at build/dev time rather than shipping a proxy that silently 404s.
  console.warn(
    '[next.config.js] BACKEND_BASE_URL is not set. Copy .env.example to .env.local and set it.'
  );
}

/** @type {import('next').NextConfig['headers']} */
async function securityHeaders() {
  // NOTE: Content-Security-Policy is intentionally NOT set here. Next.js App
  // Router injects inline bootstrap/streaming <script> tags at runtime that
  // need a fresh nonce on every request — a static header from next.config.js
  // can't do that. CSP now lives in middleware.ts, which generates a
  // per-request nonce and applies it there instead.
  return [
    {
      // Apply these headers to all routes.
      source: '/(.*)',
      headers: [
        {
          // Prevent clickjacking — the backend also sets this via Spring Security.
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          // Prevent MIME-type sniffing which can enable code injection attacks.
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          // Only send the origin in the Referer header for same-origin, strip path for cross-origin.
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          // Disallow access to powerful browser features not used by this app.
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=()',
        },
        {
          // HSTS: force HTTPS for 1 year including subdomains once deployed.
          // Only effective over HTTPS (ignored in HTTP dev environment).
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ];
}

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return securityHeaders();
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_BASE_URL ?? 'http://localhost:8080'}/api/v1/:path*`,
      },
      // OAuth2 login: the initial "/oauth2/authorization/{provider}" redirect and the
      // provider's callback to "/login/oauth2/code/{provider}" both need to stay on this
      // frontend's own origin from the browser's perspective — the backend's registered
      // OAuth redirect URI is this frontend's origin specifically (see
      // OAuth2ClientRegistrationConfig's javadoc on the backend), not the backend's own
      // Railway domain, exactly so the session cookies set during the callback bind here.
      {
        source: '/oauth2/:path*',
        destination: `${BACKEND_BASE_URL ?? 'http://localhost:8080'}/oauth2/:path*`,
      },
      {
        source: '/login/oauth2/:path*',
        destination: `${BACKEND_BASE_URL ?? 'http://localhost:8080'}/login/oauth2/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;