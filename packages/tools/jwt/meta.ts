import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'jwt',
  nameKey: 'tools.jwt.name',
  descriptionKey: 'tools.jwt.description',
  category: 'crypto',
  tags: ['jwt', 'token', 'decode', 'json web token', 'auth', 'bearer', 'oauth', 'claims'],
  related: ['base64', 'json', 'hash'],
  icon: 'KeyRound',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'JWT Studio',
  description: 'Decode, inspect and analyze JSON Web Tokens',
  modes: [
    { id: 'decode', label: 'Decode' },
    { id: 'inspect', label: 'Inspect' },
    { id: 'timeline', label: 'Timeline' },
  ],
  placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
