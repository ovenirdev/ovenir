import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Types
export interface JwtHeader {
  alg: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  // Standard claims
  iss?: string;      // Issuer
  sub?: string;      // Subject
  aud?: string | string[];  // Audience
  exp?: number;      // Expiration
  nbf?: number;      // Not Before
  iat?: number;      // Issued At
  jti?: string;      // JWT ID
  [key: string]: unknown;
}

export interface JwtClaim {
  key: string;
  value: unknown;
  type: 'standard' | 'registered' | 'custom';
  label: string;
  description: string;
  formattedValue?: string;
}

export interface JwtSecurityIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
}

export interface JwtTimeline {
  issuedAt?: { timestamp: number; label: string; relative: string };
  notBefore?: { timestamp: number; label: string; relative: string };
  expiresAt?: { timestamp: number; label: string; relative: string };
  currentTime: { timestamp: number; label: string };
  status: 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry';
  remainingTime?: string;
  totalLifetime?: string;
  percentElapsed?: number;
}

export interface JwtAnalysis {
  raw: string;
  parts: {
    header: string;
    payload: string;
    signature: string;
  };
  header: JwtHeader;
  payload: JwtPayload;
  claims: JwtClaim[];
  securityIssues: JwtSecurityIssue[];
  timeline: JwtTimeline;
  size: {
    total: number;
    header: number;
    payload: number;
    signature: number;
  };
}

// Zod schemas
const inputSchema = z.object({
  mode: z.enum(['decode', 'inspect', 'timeline']),
  input: z.string(),
});

const outputSchema = z.object({
  success: z.boolean(),
  error: z.object({
    message: z.string(),
    suggestion: z.string().optional(),
  }).optional(),
  analysis: z.any().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Standard JWT claims info
const STANDARD_CLAIMS: Record<string, { label: string; description: string }> = {
  iss: { label: 'Issuer', description: 'Who issued this token' },
  sub: { label: 'Subject', description: 'Who this token is about' },
  aud: { label: 'Audience', description: 'Who this token is intended for' },
  exp: { label: 'Expiration', description: 'When this token expires' },
  nbf: { label: 'Not Before', description: 'Token not valid before this time' },
  iat: { label: 'Issued At', description: 'When this token was issued' },
  jti: { label: 'JWT ID', description: 'Unique identifier for this token' },
};

// Algorithm security info
const ALGORITHM_SECURITY: Record<string, { secure: boolean; message: string }> = {
  none: { secure: false, message: 'No signature - anyone can forge this token!' },
  HS256: { secure: true, message: 'HMAC SHA-256 - symmetric key' },
  HS384: { secure: true, message: 'HMAC SHA-384 - symmetric key' },
  HS512: { secure: true, message: 'HMAC SHA-512 - symmetric key' },
  RS256: { secure: true, message: 'RSA SHA-256 - asymmetric key' },
  RS384: { secure: true, message: 'RSA SHA-384 - asymmetric key' },
  RS512: { secure: true, message: 'RSA SHA-512 - asymmetric key' },
  ES256: { secure: true, message: 'ECDSA P-256 - asymmetric key' },
  ES384: { secure: true, message: 'ECDSA P-384 - asymmetric key' },
  ES512: { secure: true, message: 'ECDSA P-521 - asymmetric key' },
  PS256: { secure: true, message: 'RSA-PSS SHA-256 - asymmetric key' },
  PS384: { secure: true, message: 'RSA-PSS SHA-384 - asymmetric key' },
  PS512: { secure: true, message: 'RSA-PSS SHA-512 - asymmetric key' },
};

// Base64URL decode
function base64UrlDecode(str: string): string {
  // Add padding
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Invalid Base64URL encoding');
  }
}

// Format timestamp
function formatTimestamp(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

// Get relative time
function getRelativeTime(ts: number): string {
  const now = Date.now();
  const target = ts * 1000;
  const diffMs = target - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
  return rtf.format(diffDay, 'day');
}

// Format duration
function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Analyze JWT
function analyzeJwt(token: string): JwtAnalysis {
  const parts = token.trim().split('.');

  if (parts.length !== 3) {
    throw new Error(`Invalid JWT structure: expected 3 parts, got ${parts.length}`);
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Decode header
  let header: JwtHeader;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch {
    throw new Error('Invalid JWT header: not valid JSON');
  }

  // Decode payload
  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error('Invalid JWT payload: not valid JSON');
  }

  // Build claims list
  const claims: JwtClaim[] = Object.entries(payload).map(([key, value]) => {
    const standardInfo = STANDARD_CLAIMS[key];
    const isStandard = !!standardInfo;

    let formattedValue: string | undefined;
    if ((key === 'exp' || key === 'nbf' || key === 'iat') && typeof value === 'number') {
      formattedValue = formatTimestamp(value);
    } else if (Array.isArray(value)) {
      formattedValue = value.join(', ');
    }

    return {
      key,
      value,
      type: isStandard ? 'standard' : 'custom',
      label: standardInfo?.label || key,
      description: standardInfo?.description || 'Custom claim',
      formattedValue,
    };
  });

  // Security analysis
  const securityIssues: JwtSecurityIssue[] = [];

  // Check algorithm
  const alg = header.alg || 'unknown';
  const algInfo = ALGORITHM_SECURITY[alg];

  if (alg === 'none') {
    securityIssues.push({
      severity: 'critical',
      code: 'ALG_NONE',
      title: 'No Signature Algorithm',
      description: 'This token has no signature and can be forged by anyone.',
    });
  } else if (!algInfo) {
    securityIssues.push({
      severity: 'warning',
      code: 'ALG_UNKNOWN',
      title: 'Unknown Algorithm',
      description: `The algorithm "${alg}" is not recognized.`,
    });
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp) {
    if (payload.exp < now) {
      securityIssues.push({
        severity: 'critical',
        code: 'TOKEN_EXPIRED',
        title: 'Token Expired',
        description: `This token expired ${getRelativeTime(payload.exp)}.`,
      });
    } else if (payload.exp - now < 300) {
      securityIssues.push({
        severity: 'warning',
        code: 'TOKEN_EXPIRING_SOON',
        title: 'Expiring Soon',
        description: `This token expires ${getRelativeTime(payload.exp)}.`,
      });
    }
  } else {
    securityIssues.push({
      severity: 'info',
      code: 'NO_EXPIRY',
      title: 'No Expiration',
      description: 'This token has no expiration claim (exp).',
    });
  }

  // Check nbf
  if (payload.nbf && payload.nbf > now) {
    securityIssues.push({
      severity: 'warning',
      code: 'NOT_YET_VALID',
      title: 'Not Yet Valid',
      description: `This token becomes valid ${getRelativeTime(payload.nbf)}.`,
    });
  }

  // Build timeline
  const timeline: JwtTimeline = {
    currentTime: {
      timestamp: now,
      label: formatTimestamp(now),
    },
    status: 'valid',
  };

  if (payload.iat) {
    timeline.issuedAt = {
      timestamp: payload.iat,
      label: formatTimestamp(payload.iat),
      relative: getRelativeTime(payload.iat),
    };
  }

  if (payload.nbf) {
    timeline.notBefore = {
      timestamp: payload.nbf,
      label: formatTimestamp(payload.nbf),
      relative: getRelativeTime(payload.nbf),
    };
  }

  if (payload.exp) {
    timeline.expiresAt = {
      timestamp: payload.exp,
      label: formatTimestamp(payload.exp),
      relative: getRelativeTime(payload.exp),
    };

    const remainingMs = (payload.exp * 1000) - Date.now();
    timeline.remainingTime = formatDuration(remainingMs);

    if (payload.exp < now) {
      timeline.status = 'expired';
    } else if (payload.nbf && payload.nbf > now) {
      timeline.status = 'not-yet-valid';
    }

    // Calculate lifetime and progress
    if (payload.iat) {
      const totalLifetimeMs = (payload.exp - payload.iat) * 1000;
      const elapsedMs = Date.now() - (payload.iat * 1000);
      timeline.totalLifetime = formatDuration(totalLifetimeMs);
      timeline.percentElapsed = Math.min(100, Math.max(0, (elapsedMs / totalLifetimeMs) * 100));
    }
  } else {
    timeline.status = 'no-expiry';
  }

  return {
    raw: token,
    parts: {
      header: headerB64,
      payload: payloadB64,
      signature: signatureB64,
    },
    header,
    payload,
    claims,
    securityIssues,
    timeline,
    size: {
      total: token.length,
      header: headerB64.length,
      payload: payloadB64.length,
      signature: signatureB64.length,
    },
  };
}

// Main run function
function run(input: Input): Output {
  const { input: token } = input;

  if (!token.trim()) {
    return { success: false, error: { message: 'Input is empty' } };
  }

  // Clean up input (remove Bearer prefix, whitespace)
  let cleanToken = token.trim();
  if (cleanToken.toLowerCase().startsWith('bearer ')) {
    cleanToken = cleanToken.slice(7).trim();
  }

  try {
    const analysis = analyzeJwt(cleanToken);
    return { success: true, analysis };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid JWT';

    // Provide helpful suggestions
    let suggestion: string | undefined;
    if (message.includes('3 parts')) {
      suggestion = 'A valid JWT has three parts separated by dots: header.payload.signature';
    } else if (message.includes('Base64')) {
      suggestion = 'The token contains invalid Base64URL characters';
    } else if (message.includes('JSON')) {
      suggestion = 'The decoded content is not valid JSON';
    }

    return { success: false, error: { message, suggestion } };
  }
}

export const jwtTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export default jwtTool;
export { meta, config };
