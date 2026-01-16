import { describe, it, expect } from 'vitest';
import { timestampTool } from './index';
import { runTool } from '@ovenir/core';

describe('timestamp', () => {
  describe('toDate mode', () => {
    it('converts Unix seconds to date', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '1704067200', // 2024-01-01 00:00:00 UTC
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iso).toBe('2024-01-01T00:00:00.000Z');
        expect(result.data.inputType).toBe('Unix (seconds)');
      }
    });

    it('converts Unix milliseconds to date', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '1704067200000', // 2024-01-01 00:00:00 UTC
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iso).toBe('2024-01-01T00:00:00.000Z');
        expect(result.data.inputType).toBe('Unix (milliseconds)');
      }
    });

    it('converts ISO date string to date', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '2024-06-15T14:30:00Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iso).toBe('2024-06-15T14:30:00.000Z');
        expect(result.data.inputType).toBe('Date string');
      }
    });

    it('returns relative time', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '1704067200',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relative).toBeDefined();
        expect(typeof result.data.relative).toBe('string');
      }
    });

    it('rejects invalid input', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: 'not-a-timestamp',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('toTimestamp mode', () => {
    it('converts ISO date to Unix timestamps', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toTimestamp',
        input: '2024-01-01T00:00:00Z',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seconds).toBe(1704067200);
        expect(result.data.milliseconds).toBe(1704067200000);
      }
    });

    it('converts human-readable date to timestamp', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toTimestamp',
        input: 'January 1, 2024 00:00:00 UTC',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seconds).toBe(1704067200);
      }
    });

    it('handles existing timestamp input', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toTimestamp',
        input: '1704067200',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.seconds).toBe(1704067200);
        expect(result.data.milliseconds).toBe(1704067200000);
      }
    });
  });

  describe('edge cases', () => {
    it('handles epoch (0)', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '0',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iso).toBe('1970-01-01T00:00:00.000Z');
      }
    });

    it('handles negative timestamps (before epoch)', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '-86400', // 1 day before epoch
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.iso).toBe('1969-12-31T00:00:00.000Z');
      }
    });

    it('rejects empty input', async () => {
      const result = await runTool(timestampTool, {
        mode: 'toDate',
        input: '',
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid mode', async () => {
      const result = await runTool(timestampTool, {
        mode: 'invalid' as any,
        input: '1704067200',
      });

      expect(result.success).toBe(false);
    });
  });
});
