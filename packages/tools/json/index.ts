import { z } from 'zod';
import type { Tool } from '@ovenir/core';
import { meta, config } from './meta';

// Types
export interface JsonNode {
  key: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value: unknown;
  children?: JsonNode[];
  size: number; // bytes
  depth: number;
}

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFix?: string;
}

export interface JsonStats {
  totalKeys: number;
  maxDepth: number;
  totalSize: number;
  arrayCount: number;
  objectCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
}

// Zod schemas
const inputSchema = z.object({
  mode: z.enum(['format', 'minify', 'validate', 'tree', 'typescript', 'query']),
  input: z.string(),
  indent: z.number().optional(),
  query: z.string().optional(),
});

const outputSchema = z.object({
  success: z.boolean(),
  result: z.string().optional(),
  error: z.object({
    message: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
    suggestion: z.string().optional(),
    autoFix: z.string().optional(),
  }).optional(),
  tree: z.any().optional(),
  stats: z.any().optional(),
  typescript: z.string().optional(),
  queryResult: z.any().optional(),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

// Smart error fixing patterns
const ERROR_FIXES: Array<{
  pattern: RegExp;
  fix: (match: string, input: string) => string;
  message: string;
}> = [
  {
    // Trailing commas in objects/arrays
    pattern: /,(\s*[}\]])/g,
    fix: (_, input) => input.replace(/,(\s*[}\]])/g, '$1'),
    message: 'Removed trailing commas',
  },
  {
    // Single quotes to double quotes
    pattern: /'([^']*)'(\s*:)/g,
    fix: (_, input) => input.replace(/'([^']*)'(\s*:)/g, '"$1"$2'),
    message: 'Converted single quotes to double quotes for keys',
  },
  {
    // Single quotes for string values
    pattern: /:\s*'([^']*)'/g,
    fix: (_, input) => input.replace(/:\s*'([^']*)'/g, ': "$1"'),
    message: 'Converted single quotes to double quotes for values',
  },
  {
    // Unquoted keys
    pattern: /{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
    fix: (_, input) => input.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g, '$1"$2"$3'),
    message: 'Added quotes to unquoted keys',
  },
  {
    // Missing commas between elements
    pattern: /}(\s*){/g,
    fix: (_, input) => input.replace(/}(\s*){/g, '},$1{'),
    message: 'Added missing commas between objects',
  },
  {
    // Comments (single line)
    pattern: /\/\/[^\n]*/g,
    fix: (_, input) => input.replace(/\/\/[^\n]*/g, ''),
    message: 'Removed single-line comments',
  },
  {
    // Comments (multi line)
    pattern: /\/\*[\s\S]*?\*\//g,
    fix: (_, input) => input.replace(/\/\*[\s\S]*?\*\//g, ''),
    message: 'Removed multi-line comments',
  },
];

// Try to auto-fix JSON
function tryAutoFix(input: string): { fixed: string; fixes: string[] } {
  let result = input;
  const fixes: string[] = [];

  for (const { pattern, fix, message } of ERROR_FIXES) {
    if (pattern.test(result)) {
      result = fix(result, result);
      fixes.push(message);
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
    }
  }

  return { fixed: result, fixes };
}

// Parse JSON with detailed error info
function parseWithError(input: string): { data?: unknown; error?: JsonError } {
  try {
    const data = JSON.parse(input);
    return { data };
  } catch (e) {
    const error = e as SyntaxError;
    const match = error.message.match(/at position (\d+)/);
    let line = 1;
    let column = 1;

    if (match) {
      const position = parseInt(match[1]);
      const lines = input.substring(0, position).split('\n');
      line = lines.length;
      column = lines[lines.length - 1].length + 1;
    }

    // Try auto-fix
    const { fixed, fixes } = tryAutoFix(input);
    let autoFix: string | undefined;
    let suggestion: string | undefined;

    if (fixes.length > 0) {
      try {
        JSON.parse(fixed);
        autoFix = fixed;
        suggestion = `Auto-fix available: ${fixes.join(', ')}`;
      } catch {
        // Auto-fix didn't work
      }
    }

    return {
      error: {
        message: error.message,
        line,
        column,
        suggestion,
        autoFix,
      },
    };
  }
}

// Build tree structure from JSON
function buildTree(data: unknown, key: string = 'root', path: string = '$', depth: number = 0): JsonNode {
  const type = getType(data);
  const size = JSON.stringify(data).length;

  const node: JsonNode = {
    key,
    path,
    type,
    value: data,
    size,
    depth,
  };

  if (type === 'object' && data !== null) {
    node.children = Object.entries(data as Record<string, unknown>).map(([k, v]) =>
      buildTree(v, k, `${path}.${k}`, depth + 1)
    );
  } else if (type === 'array') {
    node.children = (data as unknown[]).map((item, index) =>
      buildTree(item, `[${index}]`, `${path}[${index}]`, depth + 1)
    );
  }

  return node;
}

// Get type of value
function getType(value: unknown): JsonNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonNode['type'];
}

// Calculate stats
function calculateStats(node: JsonNode): JsonStats {
  const stats: JsonStats = {
    totalKeys: 0,
    maxDepth: 0,
    totalSize: node.size,
    arrayCount: 0,
    objectCount: 0,
    stringCount: 0,
    numberCount: 0,
    booleanCount: 0,
    nullCount: 0,
  };

  function traverse(n: JsonNode) {
    stats.maxDepth = Math.max(stats.maxDepth, n.depth);

    switch (n.type) {
      case 'object':
        stats.objectCount++;
        stats.totalKeys += n.children?.length || 0;
        break;
      case 'array':
        stats.arrayCount++;
        break;
      case 'string':
        stats.stringCount++;
        break;
      case 'number':
        stats.numberCount++;
        break;
      case 'boolean':
        stats.booleanCount++;
        break;
      case 'null':
        stats.nullCount++;
        break;
    }

    n.children?.forEach(traverse);
  }

  traverse(node);
  return stats;
}

// Generate TypeScript interface from JSON
function generateTypeScript(data: unknown, name: string = 'Root'): string {
  const interfaces: string[] = [];
  const generated = new Set<string>();

  function toTypeName(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }

  function inferType(value: unknown, key: string, depth: number = 0): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'unknown[]';
      const itemTypes = [...new Set(value.map((item, i) => inferType(item, `${key}Item`, depth + 1)))];
      if (itemTypes.length === 1) return `${itemTypes[0]}[]`;
      return `(${itemTypes.join(' | ')})[]`;
    }

    switch (typeof value) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': {
        const typeName = toTypeName(key);
        if (!generated.has(typeName)) {
          generated.add(typeName);
          const obj = value as Record<string, unknown>;
          const props = Object.entries(obj)
            .map(([k, v]) => {
              const propType = inferType(v, k, depth + 1);
              const safeName = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : `'${k}'`;
              return `  ${safeName}: ${propType};`;
            })
            .join('\n');
          interfaces.push(`interface ${typeName} {\n${props}\n}`);
        }
        return typeName;
      }
      default: return 'unknown';
    }
  }

  const rootType = inferType(data, name);

  // Put Root interface first, then others
  const rootInterface = interfaces.find(i => i.startsWith(`interface ${toTypeName(name)}`));
  const otherInterfaces = interfaces.filter(i => !i.startsWith(`interface ${toTypeName(name)}`));

  const result = [rootInterface, ...otherInterfaces].filter(Boolean).join('\n\n');

  if (!result.includes(`interface ${toTypeName(name)}`)) {
    return `type ${toTypeName(name)} = ${rootType};`;
  }

  return result;
}

// Simple JSONPath query implementation
function queryJsonPath(data: unknown, path: string): unknown {
  if (!path.startsWith('$')) {
    throw new Error('JSONPath must start with $');
  }

  const segments = path
    .slice(1)
    .split(/\.|\[/)
    .filter(Boolean)
    .map(s => s.replace(/\]$/, ''));

  let current: unknown = data;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    if (segment === '*') {
      // Wildcard - return all values
      if (Array.isArray(current)) {
        return current;
      }
      if (typeof current === 'object') {
        return Object.values(current as Record<string, unknown>);
      }
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = parseInt(segment);
      if (isNaN(index)) {
        // Map over array
        return current.map(item => {
          if (typeof item === 'object' && item !== null) {
            return (item as Record<string, unknown>)[segment];
          }
          return undefined;
        }).filter(v => v !== undefined);
      }
      current = current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

// Process mode
function processMode(
  mode: Input['mode'],
  data: unknown,
  indent: number,
  query?: string,
  fixMessage?: string
): Output {
  const tree = buildTree(data);
  const stats = calculateStats(tree);

  switch (mode) {
    case 'format':
      return {
        success: true,
        result: JSON.stringify(data, null, indent),
        tree,
        stats,
        ...(fixMessage && { error: { message: fixMessage } }),
      };

    case 'minify':
      return {
        success: true,
        result: JSON.stringify(data),
        tree,
        stats,
      };

    case 'validate':
      return {
        success: true,
        result: 'Valid JSON',
        tree,
        stats,
      };

    case 'tree':
      return {
        success: true,
        tree,
        stats,
      };

    case 'typescript':
      return {
        success: true,
        typescript: generateTypeScript(data),
        tree,
        stats,
      };

    case 'query':
      if (!query) {
        return { success: false, error: { message: 'Query is required for query mode' } };
      }
      try {
        const queryResult = queryJsonPath(data, query);
        return {
          success: true,
          result: JSON.stringify(queryResult, null, indent),
          queryResult,
          tree,
          stats,
        };
      } catch (e) {
        return { success: false, error: { message: (e as Error).message } };
      }

    default:
      return { success: false, error: { message: `Unknown mode: ${mode}` } };
  }
}

// Main tool function
function run(inputData: Input): Output {
  const { mode, input: jsonInput, indent, query } = inputData;
  const indentValue = indent ?? 2;

  if (!jsonInput.trim()) {
    return { success: false, error: { message: 'Input is empty' } };
  }

  // First, try to parse
  const { data, error } = parseWithError(jsonInput);

  if (error && mode !== 'validate') {
    // If auto-fix is available and we're not just validating, try it
    if (error.autoFix) {
      const { data: fixedData } = parseWithError(error.autoFix);
      if (fixedData !== undefined) {
        // Use the fixed data
        return processMode(mode, fixedData, indentValue, query, error.suggestion);
      }
    }
    return { success: false, error };
  }

  if (error) {
    return { success: false, error };
  }

  return processMode(mode, data, indentValue, query);
}

export const jsonTool: Tool<Input, Output> = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export default jsonTool;
export { meta, config };
