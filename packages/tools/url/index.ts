import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Types
export interface UrlPart {
  key: string;
  label: string;
  value: string;
  encoded?: string;
  description: string;
}

export interface QueryParam {
  key: string;
  value: string;
  keyDecoded: string;
  valueDecoded: string;
  index: number;
}

export interface UrlAnalysis {
  original: string;
  normalized: string;
  valid: boolean;
  parts: UrlPart[];
  queryParams: QueryParam[];
  isSecure: boolean;
  hasAuth: boolean;
  hasPort: boolean;
  hasFragment: boolean;
}

// Zod schemas
const inputSchema = z.object({
  mode: z.enum(['parse', 'encode', 'decode', 'build']),
  input: z.string(),
});

const outputSchema = z.object({
  success: z.boolean(),
  error: z.object({
    message: z.string(),
    suggestion: z.string().optional(),
  }).optional(),
  result: z.string().optional(),
  analysis: z.any().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Safe URL decode
function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

// Analyze URL
function analyzeUrl(urlString: string): UrlAnalysis {
  let url: URL;

  try {
    // Try to parse as-is
    url = new URL(urlString);
  } catch {
    // Try adding protocol
    if (!urlString.includes('://')) {
      try {
        url = new URL('https://' + urlString);
      } catch {
        throw new Error('Invalid URL format');
      }
    } else {
      throw new Error('Invalid URL format');
    }
  }

  const parts: UrlPart[] = [];

  // Protocol
  parts.push({
    key: 'protocol',
    label: 'Protocol',
    value: url.protocol.replace(':', ''),
    description: 'The URL scheme (http, https, ftp, etc.)',
  });

  // Username (if present)
  if (url.username) {
    parts.push({
      key: 'username',
      label: 'Username',
      value: url.username,
      description: 'Authentication username',
    });
  }

  // Password (if present)
  if (url.password) {
    parts.push({
      key: 'password',
      label: 'Password',
      value: url.password,
      description: 'Authentication password (sensitive)',
    });
  }

  // Hostname
  parts.push({
    key: 'hostname',
    label: 'Hostname',
    value: url.hostname,
    description: 'The domain name or IP address',
  });

  // Port (if present)
  if (url.port) {
    parts.push({
      key: 'port',
      label: 'Port',
      value: url.port,
      description: 'The port number',
    });
  }

  // Pathname
  parts.push({
    key: 'pathname',
    label: 'Path',
    value: url.pathname,
    encoded: encodeURIComponent(safeDecode(url.pathname)),
    description: 'The path after the domain',
  });

  // Search (query string)
  if (url.search) {
    parts.push({
      key: 'search',
      label: 'Query String',
      value: url.search,
      description: 'The query parameters including ?',
    });
  }

  // Hash (fragment)
  if (url.hash) {
    parts.push({
      key: 'hash',
      label: 'Fragment',
      value: url.hash,
      encoded: encodeURIComponent(safeDecode(url.hash.slice(1))),
      description: 'The fragment identifier after #',
    });
  }

  // Origin
  parts.push({
    key: 'origin',
    label: 'Origin',
    value: url.origin,
    description: 'Protocol + hostname + port',
  });

  // Parse query parameters
  const queryParams: QueryParam[] = [];
  let index = 0;
  url.searchParams.forEach((value, key) => {
    queryParams.push({
      key,
      value,
      keyDecoded: safeDecode(key),
      valueDecoded: safeDecode(value),
      index: index++,
    });
  });

  return {
    original: urlString,
    normalized: url.href,
    valid: true,
    parts,
    queryParams,
    isSecure: url.protocol === 'https:',
    hasAuth: Boolean(url.username || url.password),
    hasPort: Boolean(url.port),
    hasFragment: Boolean(url.hash),
  };
}

// Encode URL component
function encodeUrl(input: string): string {
  // Check if it looks like a full URL
  if (input.includes('://') || input.startsWith('//')) {
    try {
      const url = new URL(input);
      // Re-encode each part properly
      return url.href;
    } catch {
      // Not a valid URL, encode as component
      return encodeURIComponent(input);
    }
  }

  // Encode as component
  return encodeURIComponent(input);
}

// Decode URL
function decodeUrl(input: string): string {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '));
  } catch {
    // Try partial decoding
    return input.replace(/%([0-9A-F]{2})/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return `%${hex}`;
      }
    });
  }
}

// Main run function
function run(input: Input): Output {
  const { mode, input: urlInput } = input;

  if (!urlInput.trim()) {
    return { success: false, error: { message: 'Input is empty' } };
  }

  try {
    switch (mode) {
      case 'parse': {
        const analysis = analyzeUrl(urlInput);
        return { success: true, analysis };
      }

      case 'encode': {
        const encoded = encodeUrl(urlInput);
        return { success: true, result: encoded };
      }

      case 'decode': {
        const decoded = decodeUrl(urlInput);
        return { success: true, result: decoded };
      }

      case 'build': {
        // Build mode uses parse result
        const analysis = analyzeUrl(urlInput);
        return { success: true, result: analysis.normalized, analysis };
      }

      default:
        return { success: false, error: { message: `Unknown mode: ${mode}` } };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid input';
    return {
      success: false,
      error: {
        message,
        suggestion: 'Make sure the URL includes a protocol (http:// or https://)',
      },
    };
  }
}

export const urlTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export default urlTool;
export { meta, config };
