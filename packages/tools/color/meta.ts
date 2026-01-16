import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'color',
  nameKey: 'tools.color.name',
  descriptionKey: 'tools.color.description',
  category: 'dev',
  tags: ['color', 'hex', 'rgb', 'hsl', 'hsv', 'converter', 'palette', 'contrast', 'wcag'],
  related: ['hash', 'base64'],
  icon: 'Palette',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'Color Converter',
  description: 'Convert colors between HEX, RGB, HSL and check contrast',
  modes: [
    { id: 'convert', label: 'Convert' },
    { id: 'palette', label: 'Palette' },
    { id: 'contrast', label: 'Contrast' },
  ],
  placeholder: 'Enter color (e.g., #FF5733, rgb(255,87,51))...',
};
