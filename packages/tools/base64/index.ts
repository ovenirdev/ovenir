import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta } from './meta';

const inputSchema = z.object({
  mode: z.enum(['encode', 'decode']),
  input: z.string(),
});

const outputSchema = z.object({
  output: z.string(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function run(input: Input): Output {
  if (input.mode === 'encode') {
    // Handle Unicode properly
    const bytes = new TextEncoder().encode(input.input);
    const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
    return { output: btoa(binary) };
  } else {
    const binary = atob(input.input);
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0)!);
    return { output: new TextDecoder().decode(bytes) };
  }
}

export const base64Tool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export default base64Tool;
