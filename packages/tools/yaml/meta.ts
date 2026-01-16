import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'yaml',
  nameKey: 'tools.yaml.name',
  descriptionKey: 'tools.yaml.description',
  category: 'data',
  tags: ['yaml', 'json', 'converter', 'config', 'data', 'format'],
  related: ['json', 'base64'],
  icon: 'FileCode',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'YAML ↔ JSON',
  description: 'Convert between YAML and JSON formats',
  modes: [
    { id: 'yaml-to-json', label: 'YAML → JSON' },
    { id: 'json-to-yaml', label: 'JSON → YAML' },
  ],
  placeholder: 'Paste YAML or JSON...',
};

export const inputSchema = z.object({
  mode: z.enum(['yaml-to-json', 'json-to-yaml']).default('yaml-to-json'),
  input: z.string(),
  indent: z.number().min(1).max(8).default(2),
});

export const outputSchema = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type YamlInput = z.infer<typeof inputSchema>;
export type YamlOutput = z.infer<typeof outputSchema>;
