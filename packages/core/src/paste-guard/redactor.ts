import type { DetectedSecret } from './detector';

/**
 * Redaction style
 */
export type RedactStyle = 'full' | 'partial' | 'hash';

/**
 * Redact a single secret
 */
function redactValue(value: string, style: RedactStyle): string {
  switch (style) {
    case 'full':
      return '[REDACTED]';
    
    case 'partial':
      // Show first 4 and last 4 characters
      if (value.length <= 12) {
        return '[REDACTED]';
      }
      return `${value.slice(0, 4)}${'*'.repeat(value.length - 8)}${value.slice(-4)}`;
    
    case 'hash':
      // Show type and length hint
      return `[REDACTED:${value.length}chars]`;
    
    default:
      return '[REDACTED]';
  }
}

/**
 * Redact all detected secrets in text
 */
export function redactSecrets(
  text: string,
  secrets: DetectedSecret[],
  style: RedactStyle = 'partial'
): string {
  if (secrets.length === 0) return text;
  
  // Sort by start index descending to replace from end to start
  // This preserves indices during replacement
  const sorted = [...secrets].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = text;
  for (const secret of sorted) {
    const redacted = redactValue(secret.match, style);
    result = result.slice(0, secret.startIndex) + redacted + result.slice(secret.endIndex);
  }
  
  return result;
}

/**
 * Create a summary of what was redacted
 */
export function createRedactionSummary(secrets: DetectedSecret[]): string {
  if (secrets.length === 0) return 'No secrets detected.';
  
  const byType = new Map<string, number>();
  for (const secret of secrets) {
    const count = byType.get(secret.pattern.name) || 0;
    byType.set(secret.pattern.name, count + 1);
  }
  
  const lines = ['Detected secrets:'];
  for (const [name, count] of byType) {
    lines.push(`  - ${name}: ${count}`);
  }
  
  return lines.join('\n');
}
