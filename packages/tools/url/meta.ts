import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'url',
  nameKey: 'tools.url.name',
  descriptionKey: 'tools.url.description',
  category: 'encoding',
  tags: ['url', 'uri', 'parse', 'encode', 'decode', 'query', 'params', 'link'],
  related: ['base64', 'json', 'html'],
  icon: 'Link',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'URL Studio',
  description: 'Parse, encode, decode and build URLs',
  modes: [
    { id: 'parse', label: 'Parse' },
    { id: 'encode', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
    { id: 'build', label: 'Build' },
  ],
  placeholder: 'https://example.com/path?query=value',
};
