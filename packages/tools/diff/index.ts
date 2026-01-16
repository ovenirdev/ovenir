import { meta, config, inputSchema, outputSchema, type DiffInput, type DiffOutput } from './meta';

interface Change {
  type: 'equal' | 'insert' | 'delete';
  value: string;
  lineNumber?: number;
}

// Simple diff algorithm (Myers-like)
function diffLines(original: string, modified: string, ignoreWhitespace: boolean, ignoreCase: boolean): Change[] {
  const normalize = (s: string) => {
    let result = s;
    if (ignoreWhitespace) result = result.replace(/\s+/g, ' ').trim();
    if (ignoreCase) result = result.toLowerCase();
    return result;
  };

  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  const changes: Change[] = [];

  // LCS-based diff
  const m = originalLines.length;
  const n = modifiedLines.length;

  // Build LCS matrix
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalize(originalLines[i - 1]) === normalize(modifiedLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  let i = m, j = n;
  const result: Change[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalize(originalLines[i - 1]) === normalize(modifiedLines[j - 1])) {
      result.unshift({ type: 'equal', value: modifiedLines[j - 1], lineNumber: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: modifiedLines[j - 1], lineNumber: j });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'delete', value: originalLines[i - 1], lineNumber: i });
      i--;
    }
  }

  return result;
}

// Character-level diff for inline mode
function diffChars(original: string, modified: string): Change[] {
  const changes: Change[] = [];
  const m = original.length;
  const n = modified.length;

  // Simple character diff using LCS
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (original[i - 1] === modified[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  let i = m, j = n;
  const result: Change[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && original[i - 1] === modified[j - 1]) {
      result.unshift({ type: 'equal', value: original[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: modified[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'delete', value: original[i - 1] });
      i--;
    }
  }

  // Merge consecutive changes of same type
  const merged: Change[] = [];
  for (const change of result) {
    const last = merged[merged.length - 1];
    if (last && last.type === change.type) {
      last.value += change.value;
    } else {
      merged.push({ ...change });
    }
  }

  return merged;
}

function run(input: DiffInput): DiffOutput {
  try {
    const { mode, original, modified, ignoreWhitespace, ignoreCase } = input;

    if (!original && !modified) {
      return {
        success: true,
        changes: [],
        stats: { additions: 0, deletions: 0, unchanged: 0 },
      };
    }

    const changes = mode === 'inline'
      ? diffChars(original, modified)
      : diffLines(original, modified, ignoreWhitespace, ignoreCase);

    // Calculate stats
    let additions = 0;
    let deletions = 0;
    let unchanged = 0;

    for (const change of changes) {
      if (change.type === 'insert') {
        additions += mode === 'inline' ? change.value.length : 1;
      } else if (change.type === 'delete') {
        deletions += mode === 'inline' ? change.value.length : 1;
      } else {
        unchanged += mode === 'inline' ? change.value.length : 1;
      }
    }

    return {
      success: true,
      changes,
      stats: { additions, deletions, unchanged },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Diff failed' },
    };
  }
}

export const diffTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { DiffInput, DiffOutput };
