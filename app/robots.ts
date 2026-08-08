import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

// Everything disallowed here is either cookie-gated (play, profile, admin — see the
// M1/M9 notes in README.md: those stay client-fetched and have nothing crawlable
// behind the auth wall anyway) or has no standalone SEO value of its own (auth forms,
// the raw API proxy path).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/play', '/result', '/profile', '/admin', '/login', '/register', '/verify-email', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
