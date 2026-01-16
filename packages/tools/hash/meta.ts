import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'hash',
  nameKey: 'tools.hash.name',
  descriptionKey: 'tools.hash.description',
  category: 'crypto',
  tags: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'checksum', 'digest', 'crypto'],
  related: ['base64', 'jwt', 'password'],
  icon: 'Hash',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Hash Generator',
  description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes',
  modes: [
    { id: 'generate', label: 'Generate' },
    { id: 'compare', label: 'Compare' },
  ],
  placeholder: 'Enter text to hash...',
};
