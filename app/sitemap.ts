import type { MetadataRoute } from 'next';
import { serverGet } from '@/lib/server-api';
import type { SitemapEntryDto } from '@/lib/types';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

// Regenerate at most every hour — scenario publish/unpublish (M8 admin) isn't
// frequent enough to need this fresher, and it keeps sitemap.xml from re-hitting the
// backend on every crawl.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // GET /sitemap-data has no 404 case (it's a plain array, always 200) — but
  // serverGet's 404-to-null handling is harmless here either way, so reuse it rather
  // than a bespoke fetch.
  const entries = (await serverGet<SitemapEntryDto[]>('/api/v1/sitemap-data')) ?? [];

  const scenarioUrls: MetadataRoute.Sitemap = entries.map((entry) => ({
    url: `${SITE_URL}/scenarios/${entry.slug}`,
    lastModified: entry.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/scenarios`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/daily`, changeFrequency: 'daily', priority: 0.7 },
  ];

  return [...staticUrls, ...scenarioUrls];
}
