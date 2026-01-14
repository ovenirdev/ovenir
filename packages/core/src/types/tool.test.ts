import { describe, it, expect } from 'vitest';
import { runTool } from './tool';
import { z } from 'zod';

describe('runTool', () => {
  const mockTool = {
    meta: {
      id: 'mock',
      nameKey: 'mock',
      descriptionKey: 'mock',
      category: 'encoding' as const,
      tags: [],
      icon: 'Test',
      status: 'stable' as const,
    },
    inputSchema: z.object({ value: z.string() }),
    outputSchema: z.object({ result: z.string() }),
    run: (input: { value: string }) => ({ result: input.value.toUpperCase() }),
  };

  it('executes tool successfully', async () => {
    const result = await runTool(mockTool, { value: 'hello' });
    expect(result).toEqual({ success: true, data: { result: 'HELLO' } });
  });

  it('returns error on invalid input', async () => {
    const result = await runTool(mockTool, { value: 123 });
    expect(result.success).toBe(false);
  });
});
