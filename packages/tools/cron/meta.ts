import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'cron',
  nameKey: 'tools.cron.name',
  descriptionKey: 'tools.cron.description',
  category: 'dev',
  tags: ['cron', 'schedule', 'time', 'task', 'job', 'expression'],
  related: ['timestamp', 'regex'],
  icon: 'Clock',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Cron Parser',
  description: 'Parse and explain cron expressions',
  modes: [
    { id: 'parse', label: 'Parse' },
    { id: 'build', label: 'Build' },
  ],
  placeholder: '* * * * *',
};

export const inputSchema = z.object({
  mode: z.enum(['parse', 'build']).default('parse'),
  expression: z.string(),
});

export const outputSchema = z.object({
  success: z.boolean(),
  description: z.string().optional(),
  parts: z.array(z.object({
    field: z.string(),
    value: z.string(),
    meaning: z.string(),
  })).optional(),
  nextRuns: z.array(z.string()).optional(),
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type CronInput = z.infer<typeof inputSchema>;
export type CronOutput = z.infer<typeof outputSchema>;
