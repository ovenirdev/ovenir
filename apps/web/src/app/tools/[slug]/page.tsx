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
  
  if (!config) return { title: 'Tool Not Found' };

  return {
    title: `${config.name} - OVENIR`,
    description: config.description,
    openGraph: {
      title: `${config.name} - OVENIR`,
      description: config.description,
      type: 'website',
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

  // Get related tools metadata
  const relatedIds = tool.meta.related ?? [];
  const relatedTools = relatedIds
    .map(id => {
      const t = getToolById(id);
      const c = getToolConfig(id);
      if (!t || !c) return null;
      return { id, name: c.name, description: c.description, icon: t.meta.icon };
    })
    .filter(Boolean) as { id: string; name: string; description: string; icon: string }[];

  return (
    <Suspense fallback={null}>
      <ToolPageClient
        slug={slug}
        config={config}
        relatedTools={relatedTools}
        initialInput={initialInput}
        initialMode={initialMode}
      />
    </Suspense>
  );
}
