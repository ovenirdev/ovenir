import { SECRET_PATTERNS, type SecretPattern } from './patterns';

/**
 * A detected secret in the input
 */
export interface DetectedSecret {
  /** Pattern that matched */
  pattern: SecretPattern;
  
  /** The matched value */
  match: string;
  
  /** Start index in the original string */
  startIndex: number;
  
  /** End index in the original string */
  endIndex: number;
}

/**
 * Result of scanning text for secrets
 */
export interface ScanResult {
  /** Were any secrets found? */
  hasSecrets: boolean;
  
  /** List of detected secrets */
  secrets: DetectedSecret[];
  
  /** Highest severity found */
  maxSeverity: SecretPattern['severity'] | null;
  
  /** Summary counts by severity */
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Scan text for secrets
 */
export function scanForSecrets(
  text: string,
  options: {
    /** Minimum severity to report */
    minSeverity?: SecretPattern['severity'];
    /** Pattern IDs to ignore */
    ignorePatterns?: string[];
  } = {}
): ScanResult {
  const { minSeverity = 'low', ignorePatterns = [] } = options;
  
  const severityOrder: Record<SecretPattern['severity'], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  
  const minSeverityLevel = severityOrder[minSeverity];
  const secrets: DetectedSecret[] = [];
  
  for (const pattern of SECRET_PATTERNS) {
    // Skip ignored patterns
    if (ignorePatterns.includes(pattern.id)) continue;
    
    // Skip if below minimum severity
    if (severityOrder[pattern.severity] < minSeverityLevel) continue;
    
    // Reset regex state
    pattern.pattern.lastIndex = 0;
    
    let match: RegExpExecArray | null;
    while ((match = pattern.pattern.exec(text)) !== null) {
      secrets.push({
        pattern,
        match: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  
  // Calculate counts
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  let maxSeverity: SecretPattern['severity'] | null = null;
  
  for (const secret of secrets) {
    counts[secret.pattern.severity]++;
    if (!maxSeverity || severityOrder[secret.pattern.severity] > severityOrder[maxSeverity]) {
      maxSeverity = secret.pattern.severity;
    }
  }
  
  return {
    hasSecrets: secrets.length > 0,
    secrets,
    maxSeverity,
    counts,
  };
}
