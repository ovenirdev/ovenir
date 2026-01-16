import { meta, config, inputSchema, outputSchema, type YamlInput, type YamlOutput } from './meta';

// Simple YAML parser (handles common cases)
function parseYaml(yaml: string): unknown {
  const lines = yaml.split('\n');
  const result: Record<string, unknown> = {};
  const stack: { indent: number; obj: Record<string, unknown>; key?: string }[] = [{ indent: -1, obj: result }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Calculate indent level
    const indent = line.search(/\S/);

    // Check for key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      // Array item
      if (trimmed.startsWith('- ')) {
        const value = parseYamlValue(trimmed.slice(2));
        // Find the right parent
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop();
        }
        const parent = stack[stack.length - 1];
        if (parent.key) {
          const arr = parent.obj[parent.key];
          if (Array.isArray(arr)) {
            arr.push(value);
          }
        }
        continue;
      }
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const valueStr = trimmed.slice(colonIndex + 1).trim();

    // Pop stack to find correct parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (!valueStr) {
      // Check if next line is array or nested object
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim().startsWith('- ')) {
        parent[key] = [];
        stack.push({ indent, obj: parent, key });
      } else {
        parent[key] = {};
        stack.push({ indent, obj: parent[key] as Record<string, unknown> });
      }
    } else {
      parent[key] = parseYamlValue(valueStr);
    }
  }

  return result;
}

function parseYamlValue(value: string): unknown {
  const trimmed = value.trim();

  // Null
  if (trimmed === 'null' || trimmed === '~' || trimmed === '') return null;

  // Boolean
  if (trimmed === 'true' || trimmed === 'yes' || trimmed === 'on') return true;
  if (trimmed === 'false' || trimmed === 'no' || trimmed === 'off') return false;

  // Number
  if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  if (/^-?\d*\.\d+$/.test(trimmed)) return parseFloat(trimmed);

  // Quoted string
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  // Inline array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    if (!inner.trim()) return [];
    return inner.split(',').map(v => parseYamlValue(v.trim()));
  }

  // Inline object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inner = trimmed.slice(1, -1);
    if (!inner.trim()) return {};
    const obj: Record<string, unknown> = {};
    inner.split(',').forEach(pair => {
      const [k, v] = pair.split(':').map(s => s.trim());
      if (k) obj[k] = parseYamlValue(v || '');
    });
    return obj;
  }

  return trimmed;
}

// Convert JSON to YAML
function jsonToYaml(obj: unknown, indent: number, level = 0): string {
  const prefix = ' '.repeat(indent * level);

  if (obj === null) return 'null';
  if (obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // Check if string needs quoting
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') ||
        obj.startsWith(' ') || obj.endsWith(' ') ||
        /^(true|false|yes|no|on|off|null|~|\d)/.test(obj)) {
      return `"${obj.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return obj || '""';
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      const val = jsonToYaml(item, indent, level + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = val.split('\n');
        return `${prefix}- ${lines[0]}\n${lines.slice(1).map(l => prefix + '  ' + l).join('\n')}`.trim();
      }
      return `${prefix}- ${val}`;
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries.map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        const val = jsonToYaml(value, indent, level + 1);
        return `${prefix}${key}:\n${val}`;
      }
      return `${prefix}${key}: ${jsonToYaml(value, indent, level)}`;
    }).join('\n');
  }

  return String(obj);
}

function run(input: YamlInput): YamlOutput {
  try {
    const { mode, input: text, indent } = input;

    if (!text.trim()) {
      return {
        success: false,
        error: { message: 'Please enter some content to convert' },
      };
    }

    if (mode === 'yaml-to-json') {
      const parsed = parseYaml(text);
      return {
        success: true,
        output: JSON.stringify(parsed, null, indent),
      };
    } else {
      const parsed = JSON.parse(text);
      return {
        success: true,
        output: jsonToYaml(parsed, indent),
      };
    }
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Conversion failed' },
    };
  }
}

export const yamlTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { YamlInput, YamlOutput };
