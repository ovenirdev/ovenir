import { meta, config, inputSchema, outputSchema, type BaseConverterInput, type BaseConverterOutput } from './meta';

function parseInput(value: string, base: number): bigint | null {
  try {
    const cleaned = value.trim().toLowerCase();

    // Handle prefixes
    let normalized = cleaned;
    if (base === 16 && cleaned.startsWith('0x')) {
      normalized = cleaned.slice(2);
    } else if (base === 2 && cleaned.startsWith('0b')) {
      normalized = cleaned.slice(2);
    } else if (base === 8 && cleaned.startsWith('0o')) {
      normalized = cleaned.slice(2);
    }

    // Validate characters for the base
    const validChars: Record<number, RegExp> = {
      2: /^[01]+$/,
      8: /^[0-7]+$/,
      10: /^-?[0-9]+$/,
      16: /^[0-9a-f]+$/,
    };

    if (!validChars[base].test(normalized)) {
      return null;
    }

    return BigInt(base === 10 ? normalized : `0x${parseInt(normalized, base).toString(16)}`);
  } catch {
    return null;
  }
}

function formatBinary(value: bigint): string {
  if (value < BigInt(0)) {
    return '-' + (-value).toString(2);
  }
  const binary = value.toString(2);
  // Group in 4-bit chunks
  const padded = binary.padStart(Math.ceil(binary.length / 4) * 4, '0');
  return padded.match(/.{4}/g)?.join(' ') || binary;
}

function formatOctal(value: bigint): string {
  if (value < BigInt(0)) {
    return '-' + (-value).toString(8);
  }
  return value.toString(8);
}

function formatDecimal(value: bigint): string {
  const str = value.toString(10);
  // Add thousand separators
  const parts = str.split('');
  const isNegative = parts[0] === '-';
  const digits = isNegative ? parts.slice(1) : parts;

  const formatted = digits.reverse().map((d, i) =>
    (i > 0 && i % 3 === 0) ? d + ',' : d
  ).reverse().join('');

  return isNegative ? '-' + formatted : formatted;
}

function formatHex(value: bigint): string {
  if (value < BigInt(0)) {
    return '-' + (-value).toString(16).toUpperCase();
  }
  const hex = value.toString(16).toUpperCase();
  // Group in 2-byte chunks
  const padded = hex.padStart(Math.ceil(hex.length / 2) * 2, '0');
  return padded.match(/.{2}/g)?.join(' ') || hex;
}

function run(input: BaseConverterInput): BaseConverterOutput {
  try {
    const { mode, value } = input;

    if (!value.trim()) {
      return {
        success: false,
        error: { message: 'Please enter a number to convert' },
      };
    }

    const baseMap: Record<string, number> = {
      decimal: 10,
      binary: 2,
      octal: 8,
      hex: 16,
    };

    const base = baseMap[mode];
    const parsed = parseInput(value, base);

    if (parsed === null) {
      return {
        success: false,
        error: { message: `Invalid ${mode} number` },
      };
    }

    return {
      success: true,
      conversions: {
        decimal: formatDecimal(parsed),
        binary: formatBinary(parsed),
        octal: formatOctal(parsed),
        hex: formatHex(parsed),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Conversion failed' },
    };
  }
}

export const baseConverterTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { BaseConverterInput, BaseConverterOutput };
