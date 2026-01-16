import { meta, config, inputSchema, outputSchema, type SqlInput, type SqlOutput } from './meta';

const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN',
  'ON', 'AS', 'DISTINCT', 'ALL', 'TOP', 'LIMIT', 'OFFSET',
  'ORDER BY', 'GROUP BY', 'HAVING', 'ASC', 'DESC', 'NULLS FIRST', 'NULLS LAST',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'CREATE INDEX', 'DROP INDEX', 'CREATE VIEW', 'DROP VIEW',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'UNIQUE', 'NOT NULL', 'DEFAULT',
  'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF',
  'IS NULL', 'IS NOT NULL', 'EXISTS', 'ANY', 'SOME',
  'WITH', 'RECURSIVE', 'RETURNING',
];

const NEWLINE_BEFORE = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
  'LIMIT', 'OFFSET', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
  'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT', 'SET', 'VALUES',
  'WHEN', 'ELSE', 'END',
];

const INCREASE_INDENT = ['SELECT', 'SET', 'VALUES', 'CASE'];
const DECREASE_INDENT = ['FROM', 'WHERE', 'END'];

function formatSQL(sql: string, indentSize: number, uppercase: boolean): string {
  // Normalize whitespace
  let normalized = sql
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Protect strings and identifiers
  const strings: string[] = [];
  normalized = normalized.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, (match) => {
    strings.push(match);
    return `__STRING_${strings.length - 1}__`;
  });

  // Uppercase keywords
  if (uppercase) {
    for (const kw of KEYWORDS.sort((a, b) => b.length - a.length)) {
      const regex = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
      normalized = normalized.replace(regex, kw);
    }
  }

  // Add newlines before keywords
  for (const kw of NEWLINE_BEFORE) {
    const regex = new RegExp(`\\s+${kw}\\b`, 'gi');
    normalized = normalized.replace(regex, `\n${uppercase ? kw : kw.toLowerCase()}`);
  }

  // Format
  const lines = normalized.split('\n');
  const result: string[] = [];
  let indentLevel = 0;
  const indent = ' '.repeat(indentSize);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for indent decrease
    for (const kw of DECREASE_INDENT) {
      if (trimmed.toUpperCase().startsWith(kw)) {
        indentLevel = Math.max(0, indentLevel - 1);
        break;
      }
    }

    result.push(indent.repeat(indentLevel) + trimmed);

    // Check for indent increase
    for (const kw of INCREASE_INDENT) {
      if (trimmed.toUpperCase().startsWith(kw)) {
        indentLevel++;
        break;
      }
    }
  }

  let output = result.join('\n');

  // Restore strings
  strings.forEach((str, i) => {
    output = output.replace(`__STRING_${i}__`, str);
  });

  // Format commas in SELECT
  output = output.replace(/,\s*/g, ',\n' + indent.repeat(2));

  // Clean up multiple newlines
  output = output.replace(/\n{3,}/g, '\n\n');

  return output;
}

function minifySQL(sql: string): string {
  // Protect strings
  const strings: string[] = [];
  let normalized = sql.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, (match) => {
    strings.push(match);
    return `__STRING_${strings.length - 1}__`;
  });

  // Remove comments
  normalized = normalized
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  // Collapse whitespace
  normalized = normalized
    .replace(/\s+/g, ' ')
    .trim();

  // Restore strings
  strings.forEach((str, i) => {
    normalized = normalized.replace(`__STRING_${i}__`, str);
  });

  return normalized;
}

function run(input: SqlInput): SqlOutput {
  try {
    const { mode, sql, indent, uppercase } = input;

    if (!sql.trim()) {
      return {
        success: false,
        error: { message: 'Please enter a SQL query' },
      };
    }

    const output = mode === 'minify'
      ? minifySQL(sql)
      : formatSQL(sql, indent, uppercase);

    return {
      success: true,
      output,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Formatting failed' },
    };
  }
}

export const sqlTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { SqlInput, SqlOutput };
