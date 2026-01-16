import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'xml',
  nameKey: 'tools.xml.name',
  descriptionKey: 'tools.xml.description',
  category: 'data',
  tags: ['xml', 'format', 'beautify', 'minify', 'validate', 'markup'],
  related: ['json', 'html', 'yaml'],
  icon: 'FileCode',
  status: 'stable',
  requiresNetwork: false,
};

// UI config for the tool page
export const config = {
  name: 'XML Format',
  description: 'Format, minify and validate XML documents',
  modes: [
    { id: 'format', label: 'Format' },
    { id: 'minify', label: 'Minify' },
  ],
  placeholder: '<?xml version="1.0"?><root><item>value</item></root>',
};
