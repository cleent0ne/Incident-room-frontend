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
  const isDev = process.env.NODE_ENV === 'development';

  // Next.js dev mode (React Refresh / HMR) injects inline <script> tags and relies
  // on eval() for hot-module replacement. Both are blocked by a strict script-src.
  // In production neither mechanism exists, so we keep the tightest possible policy.
  // If you later add a nonce-based CSP middleware you can drop these dev allowances.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'";

  const cspDirectives = [
    "default-src 'self'",
    // Next.js requires 'unsafe-inline' for styles injected at runtime; nonces are the
    // alternative but require server-side rendering of each page — revisit if moving to full SSR.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    scriptSrc,
    // Disallow all inline images from untrusted origins.
    "img-src 'self' data: blob:",
    // Allow backend API connections (same origin via Next.js rewrites; no explicit backend URL needed).
    // In dev mode also allow webpack HMR websocket connections on localhost.
    isDev ? "connect-src 'self' ws://localhost:* wss://localhost:*" : "connect-src 'self'",
    // Disallow plugins (Flash, Java, etc.)
    "object-src 'none'",
    // Disallow embedding in iframes from any origin.
    "frame-ancestors 'none'",
    // Disallow web workers from untrusted sources.
    "worker-src 'self'",
    // Disallow manifest from untrusted origins.
    "manifest-src 'self'",
    // Block mixed content automatically (no-op in HTTP dev, effective in production HTTPS).
    "upgrade-insecure-requests",
  ].join('; ');

  return [
    {
      // Apply these headers to all routes.
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: cspDirectives,
        },
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

