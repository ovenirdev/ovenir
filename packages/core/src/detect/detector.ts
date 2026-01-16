import { FORMAT_PATTERNS, type FormatPattern } from './patterns';

export interface DetectedFormat {
  pattern: FormatPattern;
  confidence: number;
}

export interface DetectionResult {
  input: string;
  detected: DetectedFormat[];
  bestMatch: DetectedFormat | null;
  hasSecrets: boolean;
}

export function detectFormat(input: string): DetectionResult {
  if (!input || input.trim().length === 0) {
    return {
      input,
      detected: [],
      bestMatch: null,
      hasSecrets: false,
    };
  }

  const detected: DetectedFormat[] = [];

  for (const pattern of FORMAT_PATTERNS) {
    const confidence = pattern.detect(input);
    if (confidence > 30) {
      detected.push({ pattern, confidence });
    }
  }

  // Sort by confidence
  detected.sort((a, b) => b.confidence - a.confidence);

  // Check for secrets (reuse paste-guard logic)
  const secretPatterns = [
    /AKIA[0-9A-Z]{16}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /-----BEGIN.*PRIVATE KEY-----/,
    /sk-[a-zA-Z0-9]{48}/,
    /xox[baprs]-[0-9a-zA-Z-]{10,}/,
  ];
  const hasSecrets = secretPatterns.some(p => p.test(input));

  return {
    input,
    detected,
    bestMatch: detected.length > 0 ? detected[0] : null,
    hasSecrets,
  };
}
