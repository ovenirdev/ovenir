import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'uuid',
  nameKey: 'tools.uuid.name',
  descriptionKey: 'tools.uuid.description',
  category: 'crypto',
  tags: ['uuid', 'guid', 'unique', 'identifier', 'generator', 'v4', 'v7', 'random'],
  related: ['hash', 'base64', 'timestamp'],
  icon: 'Fingerprint',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'UUID Generator',
  description: 'Generate and analyze UUIDs (v1, v4, v7)',
  modes: [
    { id: 'generate', label: 'Generate' },
    { id: 'parse', label: 'Parse' },
    { id: 'bulk', label: 'Bulk' },
  ],
  placeholder: 'Enter UUID to parse...',
};
