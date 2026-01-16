import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'json',
  nameKey: 'tools.json.name',
  descriptionKey: 'tools.json.description',
  category: 'json',
  tags: ['json', 'format', 'beautify', 'minify', 'validate', 'parse', 'tree', 'typescript', 'jsonpath', 'query'],
  related: ['yaml', 'xml', 'csv'],
  icon: 'Braces',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'JSON Studio',
  description: 'Format, validate, explore and transform JSON',
  modes: [
    { id: 'format', label: 'Format' },
    { id: 'minify', label: 'Minify' },
    { id: 'validate', label: 'Validate' },
    { id: 'tree', label: 'Tree View' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'query', label: 'Query' },
  ],
  placeholder: '{\n  "name": "OVENIR",\n  "version": "1.0"\n}',
};
