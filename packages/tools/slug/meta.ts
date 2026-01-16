import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'slug',
  nameKey: 'tools.slug.name',
  descriptionKey: 'tools.slug.description',
  category: 'text',
  tags: ['slug', 'url', 'text', 'seo', 'permalink', 'sanitize', 'slugify'],
  related: ['url', 'case'],
  icon: 'Link2',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'Slug Generator',
  description: 'Generate URL-friendly slugs from any text',
  modes: [
    { id: 'generate', label: 'Generate' },
  ],
  placeholder: 'Enter text to slugify...',
};
