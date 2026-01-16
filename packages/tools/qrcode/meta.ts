import { z } from 'zod';
import type { ToolMeta } from '@ovenir/core';

export const meta: ToolMeta = {
  id: 'qrcode',
  nameKey: 'tools.qrcode.name',
  descriptionKey: 'tools.qrcode.description',
  category: 'data',
  tags: ['qr', 'qrcode', 'barcode', 'generator', 'image', 'scan'],
  related: ['base64', 'url'],
  icon: 'QrCode',
  status: 'stable',
  requiresNetwork: false,
};

export const config = {
  name: 'QR Code Generator',
  description: 'Generate QR codes from text or URLs',
  modes: [
    { id: 'text', label: 'Text' },
    { id: 'url', label: 'URL' },
    { id: 'wifi', label: 'WiFi' },
  ],
  placeholder: 'Enter text or URL...',
};

export const inputSchema = z.object({
  mode: z.enum(['text', 'url', 'wifi']).default('text'),
  content: z.string(),
  size: z.number().min(100).max(500).default(200),
  // WiFi specific
  ssid: z.string().optional(),
  password: z.string().optional(),
  encryption: z.enum(['WPA', 'WEP', 'nopass']).optional(),
});

export const outputSchema = z.object({
  success: z.boolean(),
  data: z.string().optional(), // SVG string
  error: z.object({
    message: z.string(),
  }).optional(),
});

export type QrCodeInput = z.infer<typeof inputSchema>;
export type QrCodeOutput = z.infer<typeof outputSchema>;
