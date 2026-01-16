import { meta, config, inputSchema, outputSchema, type CaseInput, type CaseOutput } from './meta';

// Split text into words, handling various cases
function splitIntoWords(text: string): string[] {
  return text
    // Insert space before uppercase letters (for camelCase/PascalCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace common separators with space
    .replace(/[-_./\\]+/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0);
}

function toCamelCase(words: string[]): string {
  return words
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

function toPascalCase(words: string[]): string {
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toSnakeCase(words: string[]): string {
  return words.join('_');
}

function toKebabCase(words: string[]): string {
  return words.join('-');
}

function toConstantCase(words: string[]): string {
  return words.join('_').toUpperCase();
}

function toTitleCase(words: string[]): string {
  // Common words that should stay lowercase (unless first)
  const lowercase = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'of', 'in'];

  return words
    .map((word, index) => {
      if (index === 0 || !lowercase.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

function toSentenceCase(words: string[]): string {
  if (words.length === 0) return '';
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

function run(input: CaseInput): CaseOutput {
  try {
    const { text } = input;

    if (!text.trim()) {
      return {
        success: false,
        error: { message: 'Please enter text to convert' },
      };
    }

    const words = splitIntoWords(text);

    if (words.length === 0) {
      return {
        success: false,
        error: { message: 'Could not parse any words from input' },
      };
    }

    const results: Record<string, string> = {
      camel: toCamelCase(words),
      pascal: toPascalCase(words),
      snake: toSnakeCase(words),
      kebab: toKebabCase(words),
      constant: toConstantCase(words),
      title: toTitleCase(words),
      sentence: toSentenceCase(words),
      lower: words.join(' '),
      upper: words.join(' ').toUpperCase(),
    };

    return {
      success: true,
      results,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Conversion failed' },
    };
  }
}

export const caseTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { CaseInput, CaseOutput };
