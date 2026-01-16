import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'html',
  nameKey: 'tools.html.name',
  descriptionKey: 'tools.html.description',
  category: 'encoding',
  tags: ['html', 'encode', 'decode', 'entities', 'escape', 'unescape', 'xss'],
  related: ['base64', 'url'],
  icon: 'Code',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'HTML Encode/Decode',
  description: 'Encode and decode HTML entities for safe display',
  modes: [
    { id: 'encode', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
  ],
  placeholder: 'Paste text with HTML entities or special characters...',
};
