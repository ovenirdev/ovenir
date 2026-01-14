import { describe, it, expect } from 'vitest';
import { base64Tool } from './index';
import { runTool } from '@ovenir/core';

describe('base64', () => {
  describe('encode', () => {
    it('encodes simple ASCII', async () => {
      const result = await runTool(base64Tool, {
        mode: 'encode',
        input: 'Hello, World!',
      });
      expect(result).toEqual({
        success: true,
        data: { output: 'SGVsbG8sIFdvcmxkIQ==' },
      });
    });

    it('encodes Unicode (French)', async () => {
      const result = await runTool(base64Tool, {
        mode: 'encode',
        input: 'Café résumé',
      });
      expect(result).toEqual({
        success: true,
        data: { output: 'Q2Fmw6kgcsOpc3Vtw6k=' },
      });
    });

    it('encodes Unicode (Japanese)', async () => {
      const result = await runTool(base64Tool, {
        mode: 'encode',
        input: 'こんにちは',
      });
      expect(result).toEqual({
        success: true,
        data: { output: '44GT44KT44Gr44Gh44Gv' },
      });
    });
  });

  describe('decode', () => {
    it('decodes simple ASCII', async () => {
      const result = await runTool(base64Tool, {
        mode: 'decode',
        input: 'SGVsbG8sIFdvcmxkIQ==',
      });
      expect(result).toEqual({
        success: true,
        data: { output: 'Hello, World!' },
      });
    });

    it('decodes Unicode', async () => {
      const result = await runTool(base64Tool, {
        mode: 'decode',
        input: '44GT44KT44Gr44Gh44Gv',
      });
      expect(result).toEqual({
        success: true,
        data: { output: 'こんにちは' },
      });
    });
  });

  describe('validation', () => {
    it('rejects invalid mode', async () => {
      const result = await runTool(base64Tool, {
        mode: 'invalid',
        input: 'test',
      });
      expect(result.success).toBe(false);
    });
  });
});
