import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'markdown',
  nameKey: 'tools.markdown.name',
  descriptionKey: 'tools.markdown.description',
  category: 'text',
  tags: ['markdown', 'preview', 'md', 'text', 'format', 'html'],
  related: ['json', 'diff'],
  icon: 'FileText',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Markdown Preview',
  description: 'Preview and convert Markdown to HTML',
  modes: [
    { id: 'preview', label: 'Preview' },
    { id: 'html', label: 'HTML' },
  ],
  placeholder: 'Enter Markdown text...',
};

export const inputSchema = z.object({
  mode: z.enum(['preview', 'html']).default('preview'),
  markdown: z.string(),
});

export const outputSchema = z.object({
  success: z.boolean(),
  html: z.string().optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type MarkdownInput = z.infer<typeof inputSchema>;
export type MarkdownOutput = z.infer<typeof outputSchema>;
