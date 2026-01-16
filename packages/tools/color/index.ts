import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Color interfaces
interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface CMYK { c: number; m: number; y: number; k: number }

interface ColorFormats {
  hex: string;
  hexAlpha: string;
  rgb: RGB;
  rgbString: string;
  hsl: HSL;
  hslString: string;
  hsv: HSV;
  cmyk: CMYK;
  cmykString: string;
}

interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  normalText: boolean;
  largeText: boolean;
  uiComponents: boolean;
}

// Schema
const inputSchema = z.union([
  z.object({
    mode: z.literal('convert'),
    color: z.string(),
  }),
  z.object({
    mode: z.literal('palette'),
    color: z.string(),
    type: z.enum(['complementary', 'analogous', 'triadic', 'tetradic', 'monochromatic']),
  }),
  z.object({
    mode: z.literal('contrast'),
    foreground: z.string(),
    background: z.string(),
  }),
]);

const outputSchema = z.object({
  success: z.boolean(),
  formats: z.any().optional(),
  palette: z.array(z.string()).optional(),
  contrast: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Named CSS colors
const CSS_COLORS: Record<string, string> = {
  black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000',
  blue: '#0000ff', yellow: '#ffff00', cyan: '#00ffff', magenta: '#ff00ff',
  orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', brown: '#a52a2a',
  gray: '#808080', grey: '#808080', silver: '#c0c0c0', gold: '#ffd700',
  navy: '#000080', teal: '#008080', olive: '#808000', maroon: '#800000',
  lime: '#00ff00', aqua: '#00ffff', fuchsia: '#ff00ff', coral: '#ff7f50',
  salmon: '#fa8072', tomato: '#ff6347', crimson: '#dc143c', indigo: '#4b0082',
  violet: '#ee82ee', plum: '#dda0dd', orchid: '#da70d6', turquoise: '#40e0d0',
};

// Parse color to RGB
function parseColor(input: string): RGB | null {
  const trimmed = input.trim().toLowerCase();

  // Check named colors
  if (CSS_COLORS[trimmed]) {
    return hexToRgb(CSS_COLORS[trimmed]);
  }

  // HEX format
  const hexMatch = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    return hexToRgb(hexMatch[1]);
  }

  // RGB format
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (rgbMatch) {
    return {
      r: Math.min(255, parseInt(rgbMatch[1])),
      g: Math.min(255, parseInt(rgbMatch[2])),
      b: Math.min(255, parseInt(rgbMatch[3])),
    };
  }

  // HSL format
  const hslMatch = trimmed.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?(?:\s*,\s*[\d.]+)?\s*\)$/);
  if (hslMatch) {
    return hslToRgb({
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3]),
    });
  }

  return null;
}

// HEX to RGB
function hexToRgb(hex: string): RGB {
  let normalized = hex.replace('#', '');

  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }

  if (normalized.length === 8) {
    normalized = normalized.slice(0, 6); // Remove alpha
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

// RGB to HEX
function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(v => Math.round(v).toString(16).padStart(2, '0'))
    .join('');
}

// RGB to HSL
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// HSL to RGB
function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

// RGB to HSV
function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// RGB to CMYK
function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);

  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

// Convert color to all formats
function convertColor(input: string): ColorFormats | null {
  const rgb = parseColor(input);
  if (!rgb) return null;

  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const hsv = rgbToHsv(rgb);
  const cmyk = rgbToCmyk(rgb);

  return {
    hex: hex.toUpperCase(),
    hexAlpha: hex.toUpperCase() + 'FF',
    rgb,
    rgbString: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hsv,
    cmyk,
    cmykString: `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
  };
}

// Generate palette
function generatePalette(input: string, type: string): string[] | null {
  const rgb = parseColor(input);
  if (!rgb) return null;

  const hsl = rgbToHsl(rgb);
  const colors: string[] = [];

  switch (type) {
    case 'complementary':
      colors.push(rgbToHex(rgb));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })));
      break;

    case 'analogous':
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h - 30 + 360) % 360 })));
      colors.push(rgbToHex(rgb));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 30) % 360 })));
      break;

    case 'triadic':
      colors.push(rgbToHex(rgb));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 120) % 360 })));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 240) % 360 })));
      break;

    case 'tetradic':
      colors.push(rgbToHex(rgb));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 90) % 360 })));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 180) % 360 })));
      colors.push(rgbToHex(hslToRgb({ ...hsl, h: (hsl.h + 270) % 360 })));
      break;

    case 'monochromatic':
      for (let i = 0; i < 5; i++) {
        const newL = Math.max(10, Math.min(90, 20 + i * 17.5));
        colors.push(rgbToHex(hslToRgb({ ...hsl, l: newL })));
      }
      break;
  }

  return colors.map(c => c.toUpperCase());
}

// Calculate relative luminance
function getLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Calculate contrast ratio
function calculateContrast(fg: string, bg: string): ContrastResult | null {
  const fgRgb = parseColor(fg);
  const bgRgb = parseColor(bg);

  if (!fgRgb || !bgRgb) return null;

  const l1 = getLuminance(fgRgb);
  const l2 = getLuminance(bgRgb);

  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  const roundedRatio = Math.round(ratio * 100) / 100;

  let level: ContrastResult['level'] = 'Fail';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'AA Large';

  return {
    ratio: roundedRatio,
    level,
    normalText: ratio >= 4.5,
    largeText: ratio >= 3,
    uiComponents: ratio >= 3,
  };
}

// Run function
function run(input: Input): Output {
  try {
    if (input.mode === 'convert') {
      if (!input.color.trim()) {
        return {
          success: false,
          error: {
            code: 'EMPTY_INPUT',
            message: 'Please enter a color to convert',
          },
        };
      }

      const formats = convertColor(input.color);
      if (!formats) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR',
            message: 'Unable to parse color. Try HEX (#FF5733), RGB (rgb(255,87,51)), or HSL (hsl(11,100%,60%))',
          },
        };
      }

      return {
        success: true,
        formats,
      };
    }

    if (input.mode === 'palette') {
      if (!input.color.trim()) {
        return {
          success: false,
          error: {
            code: 'EMPTY_INPUT',
            message: 'Please enter a base color',
          },
        };
      }

      const palette = generatePalette(input.color, input.type);
      if (!palette) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR',
            message: 'Unable to parse color',
          },
        };
      }

      return {
        success: true,
        palette,
      };
    }

    if (input.mode === 'contrast') {
      if (!input.foreground.trim() || !input.background.trim()) {
        return {
          success: false,
          error: {
            code: 'EMPTY_INPUT',
            message: 'Please enter both foreground and background colors',
          },
        };
      }

      const contrast = calculateContrast(input.foreground, input.background);
      if (!contrast) {
        return {
          success: false,
          error: {
            code: 'INVALID_COLOR',
            message: 'Unable to parse one or both colors',
          },
        };
      }

      return {
        success: true,
        contrast,
      };
    }

    return {
      success: false,
      error: {
        code: 'INVALID_MODE',
        message: 'Invalid mode specified',
      },
    };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'COLOR_ERROR',
        message: err instanceof Error ? err.message : 'Failed to process color',
      },
    };
  }
}

export const colorTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { config };
export default colorTool;
