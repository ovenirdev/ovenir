import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ToolPageClient } from './client';
import { getToolById, getToolConfig, getAllToolIds } from '@ovenir/tools';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ input?: string; mode?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getToolConfig(slug);
  const tool = getToolById(slug);

  if (!config || !tool) return { title: 'Tool Not Found' };

  const fullDescription = `${config.description}. Free online tool, 100% local, no data sent to servers. Part of OVENIR developer toolbox.`;
  const keywords = tool.meta.tags || [];

  return {
    title: config.name,
    description: fullDescription,
    keywords: [...keywords, 'developer tool', 'free', 'online', 'privacy'],
    openGraph: {
      title: `${config.name} - OVENIR`,
      description: config.description,
      type: 'website',
      url: `/tools/${slug}`,
    },
    twitter: {
      card: 'summary',
      title: `${config.name} - OVENIR`,
      description: config.description,
    },
    alternates: {
      canonical: `/tools/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return getAllToolIds().map(slug => ({ slug }));
}

export default async function ToolPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { input, mode } = await searchParams;
  const tool = getToolById(slug);
  const config = getToolConfig(slug);

  if (!tool || !config) {
    notFound();
  }

  // Decode input if present
  const initialInput = input ? decodeURIComponent(input) : undefined;
  const initialMode = mode;

  return (
    <Suspense fallback={null}>
      <ToolPageClient
        slug={slug}
        config={config}
        initialInput={initialInput}
        initialMode={initialMode}
      />
    </Suspense>
  );
}
