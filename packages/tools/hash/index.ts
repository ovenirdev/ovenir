import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Types
export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export interface HashResult {
  algorithm: HashAlgorithm;
  hash: string;
  hashUpperCase: string;
  length: number;
  bits: number;
}

export interface CompareResult {
  match: boolean;
  algorithm?: HashAlgorithm;
  computed: string;
  expected: string;
}

// Zod schemas
const inputSchema = z.object({
  mode: z.enum(['generate', 'compare']),
  input: z.string(),
  algorithm: z.enum(['MD5', 'SHA-1', 'SHA-256', 'SHA-512']).optional(),
  compareHash: z.string().optional(),
});

const outputSchema = z.object({
  success: z.boolean(),
  error: z.object({
    message: z.string(),
  }).optional(),
  hashes: z.array(z.any()).optional(),
  compare: z.any().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Algorithm info
const ALGORITHM_INFO: Record<HashAlgorithm, { bits: number; webCryptoName?: string }> = {
  'MD5': { bits: 128 },
  'SHA-1': { bits: 160, webCryptoName: 'SHA-1' },
  'SHA-256': { bits: 256, webCryptoName: 'SHA-256' },
  'SHA-512': { bits: 512, webCryptoName: 'SHA-512' },
};

// Simple MD5 implementation (Web Crypto doesn't support MD5)
function md5(input: string): string {
  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  function addUnsigned(x: number, y: number): number {
    const x4 = x & 0x80000000;
    const y4 = y & 0x80000000;
    const x8 = x & 0x40000000;
    const y8 = y & 0x40000000;
    const result = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
    if (x8 & y8) return result ^ 0x80000000 ^ x4 ^ y4;
    if (x8 | y8) {
      if (result & 0x40000000) return result ^ 0xC0000000 ^ x4 ^ y4;
      return result ^ 0x40000000 ^ x4 ^ y4;
    }
    return result ^ x4 ^ y4;
  }

  function F(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function I(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  // UTF-8 encode
  const utf8Encode = (str: string): string => {
    return unescape(encodeURIComponent(str));
  };

  const string = utf8Encode(input);
  const x: number[] = [];
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  let k, AA, BB, CC, DD, a, b, c, d;
  const len = string.length;

  for (k = 0; k < ((len + 8) >> 6) + 1; k++) {
    x[k * 16] = 0; x[k * 16 + 1] = 0; x[k * 16 + 2] = 0; x[k * 16 + 3] = 0;
    x[k * 16 + 4] = 0; x[k * 16 + 5] = 0; x[k * 16 + 6] = 0; x[k * 16 + 7] = 0;
    x[k * 16 + 8] = 0; x[k * 16 + 9] = 0; x[k * 16 + 10] = 0; x[k * 16 + 11] = 0;
    x[k * 16 + 12] = 0; x[k * 16 + 13] = 0; x[k * 16 + 14] = 0; x[k * 16 + 15] = 0;
  }

  let i = 0;
  for (k = 0; k < len; k++) {
    i = (k >> 2);
    x[i] |= string.charCodeAt(k) << ((k % 4) * 8);
  }

  i = (k >> 2);
  x[i] |= 0x80 << ((k % 4) * 8);
  x[(((len + 8) >> 6) << 4) + 14] = len * 8;

  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

  for (k = 0; k < x.length; k += 16) {
    AA = a; BB = b; CC = c; DD = d;
    a = FF(a, b, c, d, x[k], S11, 0xD76AA478);
    d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = GG(b, c, d, a, x[k], S24, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = HH(d, a, b, c, x[k], S32, 0xEAA127FA);
    c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = II(a, b, c, d, x[k], S41, 0xF4292244);
    d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
}

// Hash using Web Crypto API
async function hashWithCrypto(input: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate all hashes
async function generateHashes(input: string): Promise<HashResult[]> {
  const results: HashResult[] = [];

  // MD5
  const md5Hash = md5(input);
  results.push({
    algorithm: 'MD5',
    hash: md5Hash,
    hashUpperCase: md5Hash.toUpperCase(),
    length: md5Hash.length,
    bits: 128,
  });

  // SHA-1
  const sha1Hash = await hashWithCrypto(input, 'SHA-1');
  results.push({
    algorithm: 'SHA-1',
    hash: sha1Hash,
    hashUpperCase: sha1Hash.toUpperCase(),
    length: sha1Hash.length,
    bits: 160,
  });

  // SHA-256
  const sha256Hash = await hashWithCrypto(input, 'SHA-256');
  results.push({
    algorithm: 'SHA-256',
    hash: sha256Hash,
    hashUpperCase: sha256Hash.toUpperCase(),
    length: sha256Hash.length,
    bits: 256,
  });

  // SHA-512
  const sha512Hash = await hashWithCrypto(input, 'SHA-512');
  results.push({
    algorithm: 'SHA-512',
    hash: sha512Hash,
    hashUpperCase: sha512Hash.toUpperCase(),
    length: sha512Hash.length,
    bits: 512,
  });

  return results;
}

// Compare hash
async function compareHash(input: string, expectedHash: string): Promise<CompareResult> {
  const cleanExpected = expectedHash.toLowerCase().trim();
  const hashes = await generateHashes(input);

  for (const result of hashes) {
    if (result.hash === cleanExpected) {
      return {
        match: true,
        algorithm: result.algorithm,
        computed: result.hash,
        expected: cleanExpected,
      };
    }
  }

  // Return with SHA-256 as default
  const sha256 = hashes.find(h => h.algorithm === 'SHA-256');
  return {
    match: false,
    computed: sha256?.hash || '',
    expected: cleanExpected,
  };
}

// Main run function
async function run(input: Input): Promise<Output> {
  const { mode, input: textInput, compareHash: expectedHash } = input;

  if (!textInput.trim()) {
    return { success: false, error: { message: 'Input is empty' } };
  }

  try {
    if (mode === 'generate') {
      const hashes = await generateHashes(textInput);
      return { success: true, hashes };
    } else if (mode === 'compare') {
      if (!expectedHash?.trim()) {
        return { success: false, error: { message: 'Expected hash is required for comparison' } };
      }
      const compare = await compareHash(textInput, expectedHash);
      return { success: true, compare };
    }

    return { success: false, error: { message: 'Invalid mode' } };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Hash generation failed' },
    };
  }
}

export const hashTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export default hashTool;
export { meta, config };
