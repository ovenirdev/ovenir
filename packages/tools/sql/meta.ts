import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'sql',
  nameKey: 'tools.sql.name',
  descriptionKey: 'tools.sql.description',
  category: 'dev',
  tags: ['sql', 'format', 'query', 'database', 'beautify', 'minify'],
  related: ['json', 'regex'],
  icon: 'Database',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'SQL Formatter',
  description: 'Format and beautify SQL queries',
  modes: [
    { id: 'format', label: 'Format' },
    { id: 'minify', label: 'Minify' },
  ],
  placeholder: 'SELECT * FROM users WHERE id = 1',
};

export const inputSchema = z.object({
  mode: z.enum(['format', 'minify']).default('format'),
  sql: z.string(),
  indent: z.number().min(1).max(8).default(2),
  uppercase: z.boolean().default(true),
});

export const outputSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type SqlInput = z.infer<typeof inputSchema>;
export type SqlOutput = z.infer<typeof outputSchema>;
