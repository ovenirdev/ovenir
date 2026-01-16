import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'base64',
  nameKey: 'tools.base64.name',
  descriptionKey: 'tools.base64.description',
  category: 'encoding',
  tags: ['base64', 'encode', 'decode', 'binary', 'text', 'data uri'],
  related: ['url', 'jwt', 'hash'],
  icon: 'Binary',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'Base64',
  description: 'Encode and decode Base64 strings instantly',
  modes: [
    { id: 'encode', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
  ],
  placeholder: 'Paste text to encode, or Base64 to decode...',
};
