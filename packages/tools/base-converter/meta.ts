import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'base-converter',
  nameKey: 'tools.base-converter.name',
  descriptionKey: 'tools.base-converter.description',
  category: 'dev',
  tags: ['number', 'base', 'binary', 'hex', 'octal', 'decimal', 'converter'],
  related: ['hash', 'base64'],
  icon: 'Binary',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Number Base Converter',
  description: 'Convert numbers between binary, octal, decimal, and hex',
  modes: [
    { id: 'decimal', label: 'Decimal' },
    { id: 'binary', label: 'Binary' },
    { id: 'octal', label: 'Octal' },
    { id: 'hex', label: 'Hex' },
  ],
  placeholder: 'Enter a number...',
};

export const inputSchema = z.object({
  mode: z.enum(['decimal', 'binary', 'octal', 'hex']).default('decimal'),
  value: z.string(),
});

export const outputSchema = z.object({
  success: z.boolean(),
  conversions: z.object({
    decimal: z.string(),
    binary: z.string(),
    octal: z.string(),
    hex: z.string(),
  }).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type BaseConverterInput = z.infer<typeof inputSchema>;
export type BaseConverterOutput = z.infer<typeof outputSchema>;
