import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'timestamp',
  nameKey: 'tools.timestamp.name',
  descriptionKey: 'tools.timestamp.description',
  category: 'time',
  tags: ['timestamp', 'unix', 'epoch', 'date', 'time', 'convert', 'timezone', 'utc', 'iso'],
  related: ['cron', 'json'],
  icon: 'Clock',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'Timestamp',
  description: 'Convert Unix timestamps to dates and back. Support for multiple formats and timezones.',
  modes: [
    { id: 'toDate', label: 'To Date' },
    { id: 'toTimestamp', label: 'To Timestamp' },
  ],
  placeholder: 'Enter a Unix timestamp (e.g., 1704067200) or a date...',
};
