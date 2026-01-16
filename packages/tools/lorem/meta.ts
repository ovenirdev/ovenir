import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'lorem',
  nameKey: 'tools.lorem.name',
  descriptionKey: 'tools.lorem.description',
  category: 'text',
  tags: ['lorem', 'ipsum', 'placeholder', 'text', 'generator', 'dummy'],
  related: ['markdown', 'password'],
  icon: 'AlignLeft',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Lorem Ipsum Generator',
  description: 'Generate placeholder text for designs and layouts',
  modes: [
    { id: 'paragraphs', label: 'Paragraphs' },
    { id: 'sentences', label: 'Sentences' },
    { id: 'words', label: 'Words' },
  ],
  placeholder: 'Configure options and generate...',
};

export const inputSchema = z.object({
  mode: z.enum(['paragraphs', 'sentences', 'words']).default('paragraphs'),
  count: z.number().min(1).max(100).default(3),
  startWithLorem: z.boolean().default(true),
});

export const outputSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  stats: z.object({
    paragraphs: z.number(),
    sentences: z.number(),
    words: z.number(),
    characters: z.number(),
  }).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type LoremInput = z.infer<typeof inputSchema>;
export type LoremOutput = z.infer<typeof outputSchema>;
