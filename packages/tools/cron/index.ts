import { meta, config, inputSchema, outputSchema, type CronInput, type CronOutput } from './meta';

const FIELD_NAMES = ['minute', 'hour', 'day of month', 'month', 'day of week'];
const FIELD_RANGES = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 6 },
];

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseField(value: string, fieldIndex: number): string {
  const range = FIELD_RANGES[fieldIndex];
  const fieldName = FIELD_NAMES[fieldIndex];

  // Handle wildcards
  if (value === '*') {
    return `every ${fieldName}`;
  }

  // Handle step values */n
  if (value.startsWith('*/')) {
    const step = parseInt(value.slice(2));
    return `every ${step} ${fieldName}${step > 1 ? 's' : ''}`;
  }

  // Handle ranges n-m
  if (value.includes('-') && !value.includes(',')) {
    const [start, end] = value.split('-').map(Number);
    if (fieldIndex === 3) {
      return `${MONTH_NAMES[start]} through ${MONTH_NAMES[end]}`;
    }
    if (fieldIndex === 4) {
      return `${DAY_NAMES[start]} through ${DAY_NAMES[end]}`;
    }
    return `${fieldName} ${start} through ${end}`;
  }

  // Handle lists n,m,o
  if (value.includes(',')) {
    const values = value.split(',').map(v => {
      if (fieldIndex === 3) return MONTH_NAMES[parseInt(v)] || v;
      if (fieldIndex === 4) return DAY_NAMES[parseInt(v)] || v;
      return v;
    });
    return `${fieldName} ${values.join(', ')}`;
  }

  // Single value
  const num = parseInt(value);
  if (fieldIndex === 3) {
    return `in ${MONTH_NAMES[num]}`;
  }
  if (fieldIndex === 4) {
    return `on ${DAY_NAMES[num]}`;
  }
  if (fieldIndex === 0) {
    return `at minute ${num}`;
  }
  if (fieldIndex === 1) {
    return `at ${num}:00`;
  }
  if (fieldIndex === 2) {
    return `on day ${num}`;
  }

  return `${fieldName} ${value}`;
}

function generateDescription(parts: string[]): string {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Common patterns
  if (parts.every(p => p === '*')) {
    return 'Every minute';
  }

  if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return `Every day at ${time}`;
  }

  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every hour, on the hour';
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every day at midnight';
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
    return 'At midnight on the first day of every month';
  }

  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    const h = hour === '*' ? 'every hour' : `at ${hour}:${minute.padStart(2, '0')}`;
    const d = parseInt(dayOfWeek);
    return `Every ${DAY_NAMES[d]} ${h}`;
  }

  // Build generic description
  const descriptions: string[] = [];

  if (minute === '*' && hour === '*') {
    descriptions.push('Every minute');
  } else if (minute.startsWith('*/')) {
    descriptions.push(`Every ${minute.slice(2)} minutes`);
  } else if (hour === '*') {
    descriptions.push(`At minute ${minute} of every hour`);
  } else {
    const h = parseInt(hour) || 0;
    const m = parseInt(minute) || 0;
    descriptions.push(`At ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }

  if (dayOfMonth !== '*') {
    descriptions.push(`on day ${dayOfMonth}`);
  }

  if (month !== '*') {
    const m = parseInt(month);
    descriptions.push(`in ${MONTH_NAMES[m] || month}`);
  }

  if (dayOfWeek !== '*') {
    const d = parseInt(dayOfWeek);
    descriptions.push(`on ${DAY_NAMES[d] || dayOfWeek}`);
  }

  return descriptions.join(' ');
}

function getNextRuns(parts: string[], count: number = 5): string[] {
  const runs: string[] = [];
  const now = new Date();
  let current = new Date(now);

  // Simple next run calculation for basic patterns
  for (let i = 0; i < 1000 && runs.length < count; i++) {
    current = new Date(current.getTime() + 60000); // Add 1 minute

    const matches = (
      matchField(parts[0], current.getMinutes()) &&
      matchField(parts[1], current.getHours()) &&
      matchField(parts[2], current.getDate()) &&
      matchField(parts[3], current.getMonth() + 1) &&
      matchField(parts[4], current.getDay())
    );

    if (matches) {
      runs.push(current.toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    }
  }

  return runs;
}

function matchField(pattern: string, value: number): boolean {
  if (pattern === '*') return true;

  if (pattern.startsWith('*/')) {
    const step = parseInt(pattern.slice(2));
    return value % step === 0;
  }

  if (pattern.includes(',')) {
    return pattern.split(',').map(Number).includes(value);
  }

  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(Number);
    return value >= start && value <= end;
  }

  return parseInt(pattern) === value;
}

function run(input: CronInput): CronOutput {
  try {
    const { expression } = input;

    if (!expression.trim()) {
      return {
        success: false,
        error: { message: 'Please enter a cron expression' },
      };
    }

    const parts = expression.trim().split(/\s+/);

    if (parts.length !== 5) {
      return {
        success: false,
        error: { message: `Expected 5 fields, got ${parts.length}. Format: minute hour day month weekday` },
      };
    }

    // Validate each field
    for (let i = 0; i < 5; i++) {
      const part = parts[i];
      const range = FIELD_RANGES[i];

      if (part !== '*' && !part.startsWith('*/')) {
        const values = part.replace(/-/g, ',').split(',').map(Number);
        for (const v of values) {
          if (isNaN(v) || v < range.min || v > range.max) {
            return {
              success: false,
              error: { message: `Invalid ${FIELD_NAMES[i]}: ${part}. Expected ${range.min}-${range.max}` },
            };
          }
        }
      }
    }

    const parsedParts = parts.map((p, i) => ({
      field: FIELD_NAMES[i],
      value: p,
      meaning: parseField(p, i),
    }));

    const description = generateDescription(parts);
    const nextRuns = getNextRuns(parts);

    return {
      success: true,
      description,
      parts: parsedParts,
      nextRuns,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Parsing failed' },
    };
  }
}

export const cronTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { CronInput, CronOutput };
