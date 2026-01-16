import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'password',
  nameKey: 'tools.password.name',
  descriptionKey: 'tools.password.description',
  category: 'security',
  tags: ['password', 'generator', 'security', 'random', 'passphrase'],
  related: ['hash', 'uuid'],
  icon: 'KeyRound',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Password Generator',
  description: 'Generate secure passwords and passphrases',
  modes: [
    { id: 'password', label: 'Password' },
    { id: 'passphrase', label: 'Passphrase' },
    { id: 'pin', label: 'PIN' },
  ],
  placeholder: 'Configure options and generate...',
};

export const inputSchema = z.object({
  mode: z.enum(['password', 'passphrase', 'pin']).default('password'),
  length: z.number().min(4).max(128).default(16),
  uppercase: z.boolean().default(true),
  lowercase: z.boolean().default(true),
  numbers: z.boolean().default(true),
  symbols: z.boolean().default(true),
  wordCount: z.number().min(2).max(12).default(4),
  separator: z.string().default('-'),
  count: z.number().min(1).max(10).default(1),
});

export const outputSchema = z.object({
  success: z.boolean(),
  passwords: z.array(z.object({
    value: z.string(),
    strength: z.enum(['weak', 'fair', 'good', 'strong', 'very-strong']),
    entropy: z.number(),
  })).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type PasswordInput = z.infer<typeof inputSchema>;
export type PasswordOutput = z.infer<typeof outputSchema>;
