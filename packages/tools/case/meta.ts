import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'case',
  nameKey: 'tools.case.name',
  descriptionKey: 'tools.case.description',
  category: 'text',
  tags: ['case', 'convert', 'camel', 'snake', 'kebab', 'pascal', 'text'],
  related: ['regex', 'diff'],
  icon: 'CaseSensitive',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Case Converter',
  description: 'Convert text between camelCase, snake_case, kebab-case, and more',
  modes: [
    { id: 'camel', label: 'camelCase' },
    { id: 'pascal', label: 'PascalCase' },
    { id: 'snake', label: 'snake_case' },
    { id: 'kebab', label: 'kebab-case' },
    { id: 'constant', label: 'CONSTANT_CASE' },
    { id: 'title', label: 'Title Case' },
    { id: 'sentence', label: 'Sentence case' },
    { id: 'lower', label: 'lowercase' },
    { id: 'upper', label: 'UPPERCASE' },
  ],
  placeholder: 'Enter text to convert...',
};

export const inputSchema = z.object({
  text: z.string(),
});

export const outputSchema = z.object({
  success: z.boolean(),
  results: z.record(z.string()).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type CaseInput = z.infer<typeof inputSchema>;
export type CaseOutput = z.infer<typeof outputSchema>;
