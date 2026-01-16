import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

const inputSchema = z.object({
  mode: z.enum(['encode', 'decode']),
  input: z.string(),
});

const outputSchema = z.object({
  output: z.string(),
  stats: z.object({
    inputLength: z.number(),
    outputLength: z.number(),
    entitiesConverted: z.number(),
  }).optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// HTML entities mapping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
  '/': '&#47;',
};

const DECODE_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#96;': '`',
  '&#47;': '/',
  '&nbsp;': '\u00A0',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&trade;': '\u2122',
  '&euro;': '\u20AC',
  '&pound;': '\u00A3',
  '&yen;': '\u00A5',
  '&cent;': '\u00A2',
  '&deg;': '\u00B0',
  '&plusmn;': '\u00B1',
  '&times;': '\u00D7',
  '&divide;': '\u00F7',
  '&para;': '\u00B6',
  '&sect;': '\u00A7',
  '&bull;': '\u2022',
  '&hellip;': '\u2026',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&laquo;': '\u00AB',
  '&raquo;': '\u00BB',
};

function encodeHtml(text: string): { output: string; count: number } {
  let count = 0;
  const output = text.replace(/[&<>"'`/]/g, (char) => {
    count++;
    return HTML_ENTITIES[char] || char;
  });
  return { output, count };
}

function decodeHtml(text: string): { output: string; count: number } {
  let count = 0;

  // First decode named entities
  let output = text.replace(/&[a-zA-Z]+;/g, (entity) => {
    const decoded = DECODE_ENTITIES[entity];
    if (decoded) {
      count++;
      return decoded;
    }
    return entity;
  });

  // Then decode numeric entities (&#123; or &#x1F4A9;)
  output = output.replace(/&#(\d+);/g, (match, code) => {
    count++;
    return String.fromCodePoint(parseInt(code, 10));
  });

  output = output.replace(/&#x([0-9a-fA-F]+);/g, (match, code) => {
    count++;
    return String.fromCodePoint(parseInt(code, 16));
  });

  return { output, count };
}

function run(input: Input): Output {
  const { mode, input: text } = input;

  if (mode === 'encode') {
    const { output, count } = encodeHtml(text);
    return {
      output,
      stats: {
        inputLength: text.length,
        outputLength: output.length,
        entitiesConverted: count,
      },
    };
  } else {
    const { output, count } = decodeHtml(text);
    return {
      output,
      stats: {
        inputLength: text.length,
        outputLength: output.length,
        entitiesConverted: count,
      },
    };
  }
}

export const htmlTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config };
export default htmlTool;
