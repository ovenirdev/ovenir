import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'base64',
  nameKey: 'tools.base64.name',
  descriptionKey: 'tools.base64.description',
  category: 'encoding',
  tags: ['base64', 'encode', 'decode', 'binary', 'text'],
  related: ['url-encode', 'jwt-decode'],
  icon: 'Binary',
  status: 'stable',
  requiresNetwork: false,
};
