import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Input schema
const inputSchema = z.object({
  mode: z.enum(['toDate', 'toTimestamp']),
  input: z.string(),
});

// Output schema
const outputSchema = z.object({
  // For toDate mode
  iso: z.string().optional(),
  rfc: z.string().optional(),
  locale: z.string().optional(),
  relative: z.string().optional(),
  utc: z.string().optional(),
  // For toTimestamp mode
  seconds: z.number().optional(),
  milliseconds: z.number().optional(),
  // Common
  inputType: z.string(),
  timezone: z.string(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

/**
 * Detect if input is a Unix timestamp (seconds or milliseconds)
 */
function detectTimestampType(input: string): 'seconds' | 'milliseconds' | 'date' | 'unknown' {
  const trimmed = input.trim();

  // Check if it's a pure number (including negative for dates before epoch)
  if (/^-?\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    const absNum = Math.abs(num);

    // Milliseconds: 13+ digits, typically > 1e12
    if (trimmed.replace('-', '').length >= 13 || absNum > 1e12) {
      return 'milliseconds';
    }
    // Any other number is treated as seconds
    return 'seconds';
  }

  // Try parsing as date string
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return 'date';
  }

  return 'unknown';
}

/**
 * Get relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) {
    return rtf.format(diffSec, 'second');
  } else if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, 'minute');
  } else if (Math.abs(diffHour) < 24) {
    return rtf.format(diffHour, 'hour');
  } else if (Math.abs(diffDay) < 7) {
    return rtf.format(diffDay, 'day');
  } else if (Math.abs(diffWeek) < 4) {
    return rtf.format(diffWeek, 'week');
  } else if (Math.abs(diffMonth) < 12) {
    return rtf.format(diffMonth, 'month');
  } else {
    return rtf.format(diffYear, 'year');
  }
}

/**
 * Convert timestamp to date formats
 */
function timestampToDate(input: string, timezone: string): Output {
  const inputType = detectTimestampType(input);
  let date: Date;

  if (inputType === 'seconds') {
    date = new Date(parseInt(input, 10) * 1000);
  } else if (inputType === 'milliseconds') {
    date = new Date(parseInt(input, 10));
  } else if (inputType === 'date') {
    date = new Date(input);
  } else {
    throw new Error('Invalid timestamp format. Enter a Unix timestamp or valid date string.');
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date. Could not parse the input.');
  }

  // Format options based on timezone
  const localeOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone === 'local' ? undefined : timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  };

  return {
    iso: date.toISOString(),
    rfc: date.toUTCString(),
    locale: date.toLocaleString('en-US', localeOptions),
    relative: getRelativeTime(date),
    utc: date.toISOString().replace('T', ' ').replace('Z', ' UTC'),
    inputType: inputType === 'seconds' ? 'Unix (seconds)' : inputType === 'milliseconds' ? 'Unix (milliseconds)' : 'Date string',
    timezone: timezone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone,
  };
}

/**
 * Convert date to timestamp
 */
function dateToTimestamp(input: string, timezone: string): Output {
  const inputType = detectTimestampType(input);
  let date: Date;

  if (inputType === 'seconds' || inputType === 'milliseconds') {
    // Already a timestamp, just convert
    const ms = inputType === 'seconds' ? parseInt(input, 10) * 1000 : parseInt(input, 10);
    date = new Date(ms);
  } else if (inputType === 'date') {
    date = new Date(input);
  } else {
    throw new Error('Invalid date format. Enter a valid date string or timestamp.');
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date. Could not parse the input.');
  }

  const ms = date.getTime();

  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    inputType: inputType === 'date' ? 'Date string' : inputType === 'seconds' ? 'Unix (seconds)' : 'Unix (milliseconds)',
    timezone: timezone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timezone,
  };
}

/**
 * Main run function
 */
function run(input: Input): Output {
  const { mode, input: rawInput } = input;
  const timezone = 'local'; // Default timezone, can be extended later

  if (!rawInput.trim()) {
    throw new Error('Please enter a timestamp or date.');
  }

  if (mode === 'toDate') {
    return timestampToDate(rawInput, timezone);
  } else {
    return dateToTimestamp(rawInput, timezone);
  }
}

export const timestampTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config };
export default timestampTool;
