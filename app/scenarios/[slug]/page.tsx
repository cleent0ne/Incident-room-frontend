import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { serverGet, resolveOgImageUrl } from '@/lib/server-api';
import { ScenarioDetailView } from '@/components/scenario/detail-view';
import type { ScenarioDetailDto } from '@/lib/types';

async function getScenario(slug: string): Promise<ScenarioDetailDto | null> {
  return serverGet<ScenarioDetailDto>(`/api/v1/scenarios/${slug}`);
}

type ScenarioDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ScenarioDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const scenario = await getScenario(slug);
  if (!scenario) {
    return { title: 'Incident not found' };
  }

  const { metaTitle, metaDescription, ogImagePath } = scenario.seo;
  const ogImage = resolveOgImageUrl(ogImagePath);

  return {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: 'article',
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

export default async function ScenarioDetailPage({ params }: ScenarioDetailPageProps) {
  const { slug } = await params;
  const scenario = await getScenario(slug);

  if (!scenario) {
    notFound();
  }

  return <ScenarioDetailView scenario={scenario} />;
}