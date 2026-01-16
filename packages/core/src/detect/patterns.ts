export interface FormatPattern {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'encoding' | 'data' | 'crypto' | 'web' | 'time' | 'id' | 'text';
  detect: (input: string) => number;
  suggestedTools: string[];
}

export const FORMAT_PATTERNS: FormatPattern[] = [
  {
    id: 'jwt',
    name: 'JWT Token',
    description: 'JSON Web Token',
    icon: '🔐',
    category: 'crypto',
    detect: (input) => {
      const trimmed = input.trim();
      const parts = trimmed.split('.');
      if (parts.length !== 3) return 0;
      try {
        const header = JSON.parse(atob(parts[0]));
        if (header.alg && header.typ === 'JWT') return 95;
        if (header.alg) return 85;
        return 0;
      } catch (e) {
        return 0;
      }
    },
    suggestedTools: ['jwt-decode', 'jwt-validate'],
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation',
    icon: '📋',
    category: 'data',
    detect: (input) => {
      const trimmed = input.trim();
      const startsValid = trimmed.startsWith('{') || trimmed.startsWith('[');
      const endsValid = trimmed.endsWith('}') || trimmed.endsWith(']');
      if (!startsValid || !endsValid) return 0;
      try {
        JSON.parse(trimmed);
        return 95;
      } catch (e) {
        return 0;
      }
    },
    suggestedTools: ['json-format', 'json-minify'],
  },
  {
    id: 'base64',
    name: 'Base64',
    description: 'Base64 encoded data',
    icon: '🔤',
    category: 'encoding',
    detect: (input) => {
      const trimmed = input.trim();
      if (trimmed.length < 4) return 0;
      const isValidChars = /^[A-Za-z0-9+/]+=*$/.test(trimmed);
      if (!isValidChars) return 0;
      if (trimmed.length % 4 !== 0) return 30;
      try {
        atob(trimmed);
        return trimmed.length > 20 ? 80 : 60;
      } catch (e) {
        return 0;
      }
    },
    suggestedTools: ['base64-decode', 'base64-encode'],
  },
  {
    id: 'url',
    name: 'URL',
    description: 'Web URL',
    icon: '🔗',
    category: 'web',
    detect: (input) => {
      const trimmed = input.trim();
      if (/^https?:\/\/.+/.test(trimmed)) return 95;
      if (/%[0-9A-Fa-f]{2}/.test(trimmed)) return 75;
      return 0;
    },
    suggestedTools: ['url-decode', 'url-encode'],
  },
  {
    id: 'uuid',
    name: 'UUID',
    description: 'Universally Unique Identifier',
    icon: '🆔',
    category: 'id',
    detect: (input) => {
      const trimmed = input.trim().toLowerCase();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      if (uuidRegex.test(trimmed)) return 99;
      return 0;
    },
    suggestedTools: ['uuid-validate', 'uuid-generate'],
  },
  {
    id: 'timestamp',
    name: 'Unix Timestamp',
    description: 'Unix epoch timestamp',
    icon: '⏰',
    category: 'time',
    detect: (input) => {
      const trimmed = input.trim();
      if (/^\d{10}$/.test(trimmed)) return 90;
      if (/^\d{13}$/.test(trimmed)) return 90;
      return 0;
    },
    suggestedTools: ['timestamp-convert'],
  },
  {
    id: 'color-hex',
    name: 'Color (Hex)',
    description: 'Hexadecimal color',
    icon: '🎨',
    category: 'web',
    detect: (input) => {
      const trimmed = input.trim().toLowerCase();
      if (/^#?([0-9a-f]{6}|[0-9a-f]{3})$/.test(trimmed)) return 95;
      return 0;
    },
    suggestedTools: ['color-convert'],
  },
];
