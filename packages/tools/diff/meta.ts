import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'diff',
  nameKey: 'tools.diff.name',
  descriptionKey: 'tools.diff.description',
  category: 'text',
  tags: ['diff', 'compare', 'difference', 'text', 'merge', 'changes'],
  related: ['json', 'regex'],
  icon: 'GitCompare',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Text Diff',
  description: 'Compare two texts and highlight differences',
  modes: [
    { id: 'split', label: 'Split' },
    { id: 'inline', label: 'Inline' },
  ],
  placeholder: 'Paste original and modified text to compare...',
};

export const inputSchema = z.object({
  mode: z.enum(['inline', 'split']).default('split'),
  original: z.string(),
  modified: z.string(),
  ignoreWhitespace: z.boolean().default(false),
  ignoreCase: z.boolean().default(false),
});

export const outputSchema = z.object({
  success: z.boolean(),
  changes: z.array(z.object({
    type: z.enum(['equal', 'insert', 'delete']),
    value: z.string(),
    lineNumber: z.number().optional(),
  })).optional(),
  stats: z.object({
    additions: z.number(),
    deletions: z.number(),
    unchanged: z.number(),
  }).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type DiffInput = z.infer<typeof inputSchema>;
export type DiffOutput = z.infer<typeof outputSchema>;
