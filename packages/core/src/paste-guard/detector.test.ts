import { describe, it, expect } from 'vitest';
import { scanForSecrets } from './detector';

describe('scanForSecrets', () => {
  it('detects AWS access key', () => {
    const result = scanForSecrets('My key is AKIAIOSFODNN7EXAMPLE');
    expect(result.secrets.length).toBeGreaterThan(0);
    expect(result.secrets[0]?.type).toBe('AWS Access Key');
  });

  it('detects GitHub PAT', () => {
    const result = scanForSecrets('token: ghp_1234567890abcdefghijklmnopqrstuvwxyz');
    expect(result.secrets.length).toBeGreaterThan(0);
    expect(result.secrets[0]?.type).toBe('GitHub PAT');
  });

  it('detects JWT', () => {
    const result = scanForSecrets('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U');
    expect(result.secrets.length).toBeGreaterThan(0);
    expect(result.secrets[0]?.type).toBe('JWT');
  });

  it('detects private key', () => {
    const result = scanForSecrets('-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----');
    expect(result.secrets.length).toBeGreaterThan(0);
    expect(result.secrets[0]?.type).toBe('RSA Private Key');
  });

  it('detects multiple secrets', () => {
    const result = scanForSecrets('AKIAIOSFODNN7EXAMPLE and ghp_1234567890abcdefghijklmnopqrstuvwxyz');
    expect(result.secrets.length).toBe(2);
  });

  it('returns empty for clean text', () => {
    const result = scanForSecrets('Hello world, this is safe text');
    expect(result.secrets.length).toBe(0);
    expect(result.hasCritical).toBe(false);
  });

  it('respects minSeverity option', () => {
    const result = scanForSecrets('email@example.com', { minSeverity: 'high' });
    expect(result.secrets.length).toBe(0);
  });

  it('respects ignorePatterns option', () => {
    const result = scanForSecrets('AKIAIOSFODNN7EXAMPLE', { ignorePatterns: ['aws-access-key'] });
    expect(result.secrets.length).toBe(0);
  });
});
