import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'regex',
  nameKey: 'tools.regex.name',
  descriptionKey: 'tools.regex.description',
  category: 'text',
  tags: ['regex', 'regexp', 'pattern', 'match', 'replace', 'test', 'validate', 'search'],
  related: ['json', 'base64', 'url'],
  icon: 'Regex',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Regex Tester',
  description: 'Test and debug regular expressions with live matching',
  modes: [
    { id: 'test', label: 'Test' },
    { id: 'replace', label: 'Replace' },
  ],
  placeholder: 'Enter regex pattern...',
};
