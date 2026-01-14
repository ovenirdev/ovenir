import { describe, it, expect } from 'vitest';
import { scanForSecrets } from './detector';

describe('scanForSecrets', () => {
  it('detects AWS access key', () => {
    const result = scanForSecrets('My key is AKIAIOSFODNN7EXAMPLE');
    expect(result.hasSecrets).toBe(true);
    expect(result.secrets[0].pattern.id).toBe('aws-access-key');
  });

  it('detects GitHub PAT', () => {
    const result = scanForSecrets('token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    expect(result.hasSecrets).toBe(true);
    expect(result.secrets[0].pattern.id).toBe('github-pat');
  });

  it('detects JWT', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const result = scanForSecrets(jwt);
    expect(result.hasSecrets).toBe(true);
    expect(result.secrets[0].pattern.id).toBe('jwt');
  });

  it('detects private key header', () => {
    const result = scanForSecrets('-----BEGIN RSA PRIVATE KEY-----\nMIIE...');
    expect(result.hasSecrets).toBe(true);
    expect(result.secrets[0].pattern.id).toBe('private-key-rsa');
  });

  it('detects multiple secrets', () => {
    const text = `
      AWS_KEY=AKIAIOSFODNN7EXAMPLE
      GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    `;
    const result = scanForSecrets(text);
    expect(result.secrets.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty for clean text', () => {
    const result = scanForSecrets('Hello, this is just normal text.');
    expect(result.hasSecrets).toBe(false);
    expect(result.secrets).toHaveLength(0);
  });

  it('respects minSeverity filter', () => {
    const result = scanForSecrets('email@example.com', { minSeverity: 'high' });
    expect(result.hasSecrets).toBe(false); // email is 'low' severity
  });

  it('respects ignorePatterns', () => {
    const result = scanForSecrets('AKIAIOSFODNN7EXAMPLE', {
      ignorePatterns: ['aws-access-key'],
    });
    expect(result.secrets.filter(s => s.pattern.id === 'aws-access-key')).toHaveLength(0);
  });
});
