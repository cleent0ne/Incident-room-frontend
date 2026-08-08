import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet, resolveOgImageUrl } from '@/lib/server-api';
import { ScenarioDetailView } from '@/components/scenario/detail-view';
import type { ScenarioDetailDto } from '@/lib/types';

// The daily incident changes once a day, so a long cache would show yesterday's
// scenario as "today's" past midnight. 15 minutes keeps this reasonably fresh for
// crawlers/social shares without hitting the backend on every request the way
// `force-dynamic` would.
async function getDaily(): Promise<ScenarioDetailDto | null> {
  return serverGet<ScenarioDetailDto>('/api/v1/scenarios/daily', { revalidate: 900 });
}

export async function generateMetadata(): Promise<Metadata> {
  const scenario = await getDaily();
  if (!scenario) {
    return { title: "Today's incident" };
  }

  const { metaTitle, metaDescription, ogImagePath } = scenario.seo;
  const ogImage = resolveOgImageUrl(ogImagePath);
  const title = `Today's incident: ${metaTitle}`;

  return {
    title,
    description: metaDescription,
    openGraph: {
      title,
      description: metaDescription,
      type: 'article',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

export default async function DailyPage() {
  const scenario = await getDaily();

  if (!scenario) {
    notFound();
  }

  return <ScenarioDetailView scenario={scenario} daily />;
}
