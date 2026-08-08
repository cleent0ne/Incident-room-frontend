import type { Metadata } from 'next';
import { CatalogClient } from './catalog-client';

// M9: the catalog's filtering/pagination genuinely needs to stay client-driven (it's
// synced to the URL query string via useSearchParams/router.push, not something a
// server render can meaningfully own) — but the page itself can still carry real
// static metadata instead of falling back to the root layout's generic title, so this
// stays a server component wrapper around the actual client content.
export const metadata: Metadata = {
  title: 'Browse incidents',
  description: 'Browse the full catalog of incident response scenarios, filterable by difficulty and root cause.',
};

export default function CatalogPage() {
  return <CatalogClient />;
}
