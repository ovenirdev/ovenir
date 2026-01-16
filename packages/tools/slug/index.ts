import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

const inputSchema = z.object({
  input: z.string(),
  separator: z.enum(['-', '_', '.']),
  lowercase: z.boolean(),
  strict: z.boolean(),
  maxLength: z.number().optional(),
});

const outputSchema = z.object({
  slug: z.string(),
  original: z.string(),
  changes: z.object({
    lowercased: z.boolean(),
    spacesReplaced: z.number(),
    specialCharsRemoved: z.number(),
    accentsMapped: z.number(),
    trimmed: z.boolean(),
  }),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Common accent mappings for transliteration
const ACCENT_MAP: Record<string, string> = {
  // French
  'à': 'a', 'â': 'a', 'ä': 'a', 'æ': 'ae',
  'ç': 'c',
  'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
  'î': 'i', 'ï': 'i',
  'ô': 'o', 'ö': 'o', 'œ': 'oe',
  'ù': 'u', 'û': 'u', 'ü': 'u',
  'ÿ': 'y',
  // German
  'ß': 'ss',
  // Spanish
  'ñ': 'n',
  // Polish
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
  // Nordic
  'å': 'a', 'ø': 'o',
  // Uppercase versions
  'À': 'a', 'Â': 'a', 'Ä': 'a', 'Æ': 'ae',
  'Ç': 'c',
  'É': 'e', 'È': 'e', 'Ê': 'e', 'Ë': 'e',
  'Î': 'i', 'Ï': 'i',
  'Ô': 'o', 'Ö': 'o', 'Œ': 'oe',
  'Ù': 'u', 'Û': 'u', 'Ü': 'u',
  'Ÿ': 'y',
  'Ñ': 'n',
  'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l', 'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z',
  'Å': 'a', 'Ø': 'o',
};

function run(input: Input): Output {
  const { input: text, separator, lowercase, strict, maxLength } = input;

  let result = text;
  let accentsMapped = 0;
  let spacesReplaced = 0;
  let specialCharsRemoved = 0;
  const originalLength = text.length;

  // Step 1: Map accented characters
  result = result.replace(/[àâäæçéèêëîïôöœùûüÿßñąćęłńóśźżåøÀÂÄÆÇÉÈÊËÎÏÔÖŒÙÛÜŸÑĄĆĘŁŃÓŚŹŻÅØ]/g, (char) => {
    if (ACCENT_MAP[char]) {
      accentsMapped++;
      return ACCENT_MAP[char];
    }
    return char;
  });

  // Step 2: Lowercase if requested
  const wasLowercased = lowercase && result !== result.toLowerCase();
  if (lowercase) {
    result = result.toLowerCase();
  }

  // Step 3: Replace spaces and common separators with the chosen separator
  const spacesPattern = /[\s\-_\.]+/g;
  const matches = result.match(spacesPattern);
  spacesReplaced = matches ? matches.length : 0;
  result = result.replace(spacesPattern, separator);

  // Step 4: Remove special characters
  let cleanPattern: RegExp;
  if (strict) {
    // Only allow alphanumeric and separator
    cleanPattern = new RegExp(`[^a-z0-9${separator === '-' ? '\\-' : separator}]`, 'g');
  } else {
    // Allow alphanumeric, separator, and some common chars
    cleanPattern = new RegExp(`[^a-z0-9${separator === '-' ? '\\-' : separator}]`, 'g');
  }

  const beforeClean = result;
  result = result.replace(cleanPattern, '');
  specialCharsRemoved = beforeClean.length - result.length;

  // Step 5: Clean up multiple consecutive separators
  const multiSepPattern = new RegExp(`${separator === '-' ? '\\-' : separator}+`, 'g');
  result = result.replace(multiSepPattern, separator);

  // Step 6: Trim separators from start and end
  const trimPattern = new RegExp(`^${separator === '-' ? '\\-' : separator}|${separator === '-' ? '\\-' : separator}$`, 'g');
  const trimmed = result !== result.replace(trimPattern, '');
  result = result.replace(trimPattern, '');

  // Step 7: Apply max length if specified
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
    // Remove trailing separator if it was cut
    result = result.replace(new RegExp(`${separator === '-' ? '\\-' : separator}$`), '');
  }

  return {
    slug: result,
    original: text,
    changes: {
      lowercased: wasLowercased,
      spacesReplaced,
      specialCharsRemoved,
      accentsMapped,
      trimmed,
    },
  };
}

export const slugTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config };
export default slugTool;
