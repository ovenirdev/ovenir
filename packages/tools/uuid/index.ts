import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// UUID info interface
interface UuidInfo {
  uuid: string;
  version: number | null;
  variant: string;
  isValid: boolean;
  isNil: boolean;
  timestamp?: Date;
  clockSeq?: number;
  node?: string;
  randomBits?: string;
}

// Schema - using union instead of discriminatedUnion for compatibility
const inputSchema = z.union([
  z.object({
    mode: z.literal('generate'),
    version: z.enum(['v1', 'v4', 'v7']),
    uppercase: z.boolean(),
    noDashes: z.boolean(),
  }),
  z.object({
    mode: z.literal('parse'),
    uuid: z.string(),
  }),
  z.object({
    mode: z.literal('bulk'),
    version: z.enum(['v1', 'v4', 'v7']),
    count: z.number().min(1).max(1000),
    uppercase: z.boolean(),
    noDashes: z.boolean(),
  }),
]);

const outputSchema = z.object({
  success: z.boolean(),
  uuid: z.string().optional(),
  uuids: z.array(z.string()).optional(),
  info: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// UUID v1 - Time-based
function generateV1(): string {
  // Get timestamp (100-nanosecond intervals since Oct 15, 1582)
  const now = Date.now();
  // Using Number for calculations since BigInt has compatibility issues
  // Gregorian offset: Oct 15, 1582 to Jan 1, 1970 in 100ns intervals
  const gregorianOffsetMs = 12219292800000; // in milliseconds
  const timestampMs = now + gregorianOffsetMs;
  const timestamp100ns = timestampMs * 10000;

  const timeLow = timestamp100ns % 0x100000000;
  const timeMid = Math.floor(timestamp100ns / 0x100000000) % 0x10000;
  const timeHi = Math.floor(timestamp100ns / 0x1000000000000) % 0x1000;
  const timeHiAndVersion = timeHi | 0x1000; // Version 1

  // Clock sequence (random for simplicity)
  const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000; // Variant bits

  // Node (random for privacy)
  const node = new Array(6).fill(0).map(() => Math.floor(Math.random() * 256));

  return [
    Math.floor(timeLow).toString(16).padStart(8, '0'),
    timeMid.toString(16).padStart(4, '0'),
    timeHiAndVersion.toString(16).padStart(4, '0'),
    clockSeq.toString(16).padStart(4, '0'),
    node.map(b => b.toString(16).padStart(2, '0')).join(''),
  ].join('-');
}

// UUID v4 - Random
function generateV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) and variant (RFC 4122)
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// UUID v7 - Unix timestamp + random (new standard)
function generateV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Get current timestamp in milliseconds
  const timestamp = Date.now();

  // First 48 bits are timestamp
  bytes[0] = Math.floor(timestamp / 0x10000000000) & 0xff;
  bytes[1] = Math.floor(timestamp / 0x100000000) & 0xff;
  bytes[2] = Math.floor(timestamp / 0x1000000) & 0xff;
  bytes[3] = Math.floor(timestamp / 0x10000) & 0xff;
  bytes[4] = Math.floor(timestamp / 0x100) & 0xff;
  bytes[5] = timestamp & 0xff;

  // Set version (7) and variant
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // Version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant

  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// Generate UUID by version
function generateUuid(version: 'v1' | 'v4' | 'v7'): string {
  switch (version) {
    case 'v1': return generateV1();
    case 'v4': return generateV4();
    case 'v7': return generateV7();
    default: return generateV4();
  }
}

// Format UUID
function formatUuid(uuid: string, uppercase: boolean, noDashes: boolean): string {
  let result = uuid;
  if (noDashes) result = result.replace(/-/g, '');
  if (uppercase) result = result.toUpperCase();
  return result;
}

// Parse and analyze UUID
function parseUuid(input: string): UuidInfo {
  // Normalize input
  const normalized = input.trim().toLowerCase().replace(/-/g, '');

  // Validate format
  if (!/^[0-9a-f]{32}$/i.test(normalized)) {
    return {
      uuid: input,
      version: null,
      variant: 'unknown',
      isValid: false,
      isNil: false,
    };
  }

  // Format with dashes
  const uuid = [
    normalized.slice(0, 8),
    normalized.slice(8, 12),
    normalized.slice(12, 16),
    normalized.slice(16, 20),
    normalized.slice(20, 32),
  ].join('-');

  // Check for nil UUID
  const isNil = normalized === '00000000000000000000000000000000';

  // Extract version
  const version = parseInt(normalized[12], 16);

  // Extract variant
  const variantBits = parseInt(normalized[16], 16);
  let variant: string;
  if ((variantBits & 0x8) === 0) {
    variant = 'NCS (reserved)';
  } else if ((variantBits & 0xc) === 0x8) {
    variant = 'RFC 4122';
  } else if ((variantBits & 0xe) === 0xc) {
    variant = 'Microsoft (reserved)';
  } else {
    variant = 'Future (reserved)';
  }

  const info: UuidInfo = {
    uuid,
    version: version >= 1 && version <= 8 ? version : null,
    variant,
    isValid: true,
    isNil,
  };

  // Extract timestamp for v1
  if (version === 1) {
    const timeLow = parseInt(normalized.slice(0, 8), 16);
    const timeMid = parseInt(normalized.slice(8, 12), 16);
    const timeHi = parseInt(normalized.slice(12, 16), 16) & 0x0fff;

    // Reconstruct timestamp (100-nanosecond intervals since Oct 15, 1582)
    const timestamp100ns = timeLow + (timeMid * 0x100000000) + (timeHi * 0x1000000000000);
    const gregorianOffsetMs = 12219292800000;
    const unixTimestamp = Math.floor(timestamp100ns / 10000) - gregorianOffsetMs;

    if (unixTimestamp > 0 && unixTimestamp < Date.now() + 86400000 * 365 * 100) {
      info.timestamp = new Date(unixTimestamp);
    }

    const clockSeq = parseInt(normalized.slice(16, 20), 16) & 0x3fff;
    info.clockSeq = clockSeq;

    info.node = [
      normalized.slice(20, 22),
      normalized.slice(22, 24),
      normalized.slice(24, 26),
      normalized.slice(26, 28),
      normalized.slice(28, 30),
      normalized.slice(30, 32),
    ].join(':');
  }

  // Extract timestamp for v7
  if (version === 7) {
    const timestampHex = normalized.slice(0, 12);
    const unixTimestamp = parseInt(timestampHex, 16);

    if (unixTimestamp > 0 && unixTimestamp < Date.now() + 86400000 * 365 * 100) {
      info.timestamp = new Date(unixTimestamp);
    }

    info.randomBits = normalized.slice(12);
  }

  // Extract random bits for v4
  if (version === 4) {
    info.randomBits = normalized.slice(0, 12) + normalized.slice(13, 16) + normalized.slice(17);
  }

  return info;
}

// Run function
function run(input: Input): Output {
  try {
    if (input.mode === 'generate') {
      const uuid = generateUuid(input.version);
      const formatted = formatUuid(uuid, input.uppercase, input.noDashes);
      const info = parseUuid(uuid);

      return {
        success: true,
        uuid: formatted,
        info,
      };
    }

    if (input.mode === 'parse') {
      if (!input.uuid.trim()) {
        return {
          success: false,
          error: {
            code: 'EMPTY_INPUT',
            message: 'Please enter a UUID to parse',
          },
        };
      }

      const info = parseUuid(input.uuid);

      return {
        success: true,
        uuid: info.uuid,
        info,
      };
    }

    if (input.mode === 'bulk') {
      const uuids = Array.from({ length: input.count }, () => {
        const uuid = generateUuid(input.version);
        return formatUuid(uuid, input.uppercase, input.noDashes);
      });

      return {
        success: true,
        uuids,
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
        code: 'GENERATION_ERROR',
        message: err instanceof Error ? err.message : 'Failed to process UUID',
      },
    };
  }
}

export const uuidTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { config };
export default uuidTool;
