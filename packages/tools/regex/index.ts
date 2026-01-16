import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Match interface
interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
  index: number;
  endIndex: number;
  line: number;
  column: number;
}

// Test result
interface TestResult {
  isValid: boolean;
  matches: RegexMatch[];
  matchCount: number;
  executionTime: number;
}

// Replace result
interface ReplaceResult {
  original: string;
  replaced: string;
  replacements: number;
  executionTime: number;
}

// Schema
const inputSchema = z.union([
  z.object({
    mode: z.literal('test'),
    pattern: z.string(),
    text: z.string(),
    flags: z.string(),
  }),
  z.object({
    mode: z.literal('replace'),
    pattern: z.string(),
    text: z.string(),
    replacement: z.string(),
    flags: z.string(),
  }),
  z.object({
    mode: z.literal('validate'),
    pattern: z.string(),
  }),
]);

const outputSchema = z.object({
  success: z.boolean(),
  test: z.any().optional(),
  replace: z.any().optional(),
  isValidPattern: z.boolean().optional(),
  patternError: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Get line and column from index
function getLineColumn(text: string, index: number): { line: number; column: number } {
  const lines = text.slice(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

// Test regex
function testRegex(pattern: string, text: string, flags: string): TestResult {
  const startTime = performance.now();

  // Create regex
  const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');

  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const { line, column } = getLineColumn(text, match.index);

    matches.push({
      fullMatch: match[0],
      groups: match.slice(1),
      namedGroups: match.groups || {},
      index: match.index,
      endIndex: match.index + match[0].length,
      line,
      column,
    });

    // Prevent infinite loop for zero-length matches
    if (match[0].length === 0) {
      regex.lastIndex++;
    }

    // Safety limit
    if (matches.length >= 10000) break;
  }

  const executionTime = performance.now() - startTime;

  return {
    isValid: true,
    matches,
    matchCount: matches.length,
    executionTime,
  };
}

// Replace with regex
function replaceRegex(
  pattern: string,
  text: string,
  replacement: string,
  flags: string
): ReplaceResult {
  const startTime = performance.now();

  const regex = new RegExp(pattern, flags);
  let replacements = 0;

  const replaced = text.replace(regex, (...args) => {
    replacements++;
    // Handle named groups if present
    const namedGroups = typeof args[args.length - 1] === 'object' ? args[args.length - 1] : {};

    // Process replacement string
    let result = replacement;

    // Handle $& (full match)
    result = result.replace(/\$&/g, args[0]);

    // Handle $` (before match)
    result = result.replace(/\$`/g, text.slice(0, args[args.length - 2]));

    // Handle $' (after match)
    result = result.replace(/\$'/g, text.slice(args[args.length - 2] + args[0].length));

    // Handle $n (numbered groups)
    result = result.replace(/\$(\d+)/g, (_, n) => args[parseInt(n)] || '');

    // Handle $<name> (named groups)
    result = result.replace(/\$<(\w+)>/g, (_, name) => namedGroups[name] || '');

    return result;
  });

  const executionTime = performance.now() - startTime;

  return {
    original: text,
    replaced,
    replacements,
    executionTime,
  };
}

// Validate pattern
function validatePattern(pattern: string): { isValid: boolean; error?: string } {
  try {
    new RegExp(pattern);
    return { isValid: true };
  } catch (err) {
    return {
      isValid: false,
      error: err instanceof Error ? err.message : 'Invalid pattern',
    };
  }
}

// Run function
function run(input: Input): Output {
  try {
    // Validate pattern first
    if (input.mode === 'validate') {
      const validation = validatePattern(input.pattern);
      return {
        success: true,
        isValidPattern: validation.isValid,
        patternError: validation.error,
      };
    }

    // Check pattern validity
    const validation = validatePattern(input.pattern);
    if (!validation.isValid) {
      return {
        success: false,
        isValidPattern: false,
        patternError: validation.error,
        error: {
          code: 'INVALID_PATTERN',
          message: validation.error || 'Invalid regex pattern',
        },
      };
    }

    if (input.mode === 'test') {
      const result = testRegex(input.pattern, input.text, input.flags);
      return {
        success: true,
        isValidPattern: true,
        test: result,
      };
    }

    if (input.mode === 'replace') {
      const result = replaceRegex(input.pattern, input.text, input.replacement, input.flags);
      return {
        success: true,
        isValidPattern: true,
        replace: result,
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
        code: 'REGEX_ERROR',
        message: err instanceof Error ? err.message : 'Failed to process regex',
      },
    };
  }
}

export const regexTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { config };
export default regexTool;
