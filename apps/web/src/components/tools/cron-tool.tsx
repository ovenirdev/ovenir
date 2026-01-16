'use client';

import { useState, useCallback, useEffect } from 'react';
import { Clock, Copy, Check, Zap, Calendar, Info } from 'lucide-react';

interface CronPart {
  field: string;
  value: string;
  meaning: string;
}

interface CronToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

const COMMON_EXPRESSIONS = [
  { expr: '* * * * *', desc: 'Every minute' },
  { expr: '0 * * * *', desc: 'Every hour' },
  { expr: '0 0 * * *', desc: 'Every day at midnight' },
  { expr: '0 0 * * 0', desc: 'Every Sunday at midnight' },
  { expr: '0 0 1 * *', desc: 'First day of month' },
  { expr: '*/5 * * * *', desc: 'Every 5 minutes' },
  { expr: '0 9 * * 1-5', desc: 'Weekdays at 9 AM' },
  { expr: '0 0 1 1 *', desc: 'Every January 1st' },
];

export function CronTool({ slug, initialInput, initialMode }: CronToolProps) {
  const [expression, setExpression] = useState(initialInput || '');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState<CronPart[]>([]);
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const parse = useCallback(async () => {
    if (!expression.trim()) {
      setDescription('');
      setParts([]);
      setNextRuns([]);
      setError(null);
      return;
    }

    const { cronTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(cronTool.run({ mode: 'parse', expression }));

    if (res.success) {
      setDescription(res.description || '');
      setParts(res.parts || []);
      setNextRuns(res.nextRuns || []);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setDescription('');
      setParts([]);
      setNextRuns([]);
    }
  }, [expression]);

  useEffect(() => {
    const timer = setTimeout(parse, 200);
    return () => clearTimeout(timer);
  }, [parse]);

  const handleCopy = useCallback(async () => {
    if (!expression) return;
    await navigator.clipboard.writeText(expression);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [expression]);

  const usePreset = useCallback((expr: string) => {
    setExpression(expr);
  }, []);

  return (
    <div className="tool-container">
      {/* Quick presets */}
      <div className="tool-controls">
        <div className="cron-presets">
          {COMMON_EXPRESSIONS.slice(0, 4).map(({ expr, desc }) => (
            <button
              key={expr}
              className="variant-chip"
              onClick={() => usePreset(expr)}
              type="button"
              title={desc}
            >
              <span>{expr}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CRON EXPRESSION</span>
              {expression && !error && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={handleCopy}
                title="Copy"
                type="button"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <input
            type="text"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="* * * * * (minute hour day month weekday)"
            className="zone-input cron-input"
            spellCheck={false}
          />
        </div>

        {/* Results */}
      {description && !error && (
        <>
          {/* Description */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">MEANING</span>
                <span className="success-badge">
                  <Clock className="w-3 h-3" />
                  Parsed
                </span>
              </div>
            </div>
            <div className="zone-output">
              <div className="cron-description">{description}</div>
            </div>
          </div>

          {/* Parts breakdown */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">BREAKDOWN</span>
              </div>
            </div>
            <div className="zone-output">
              <div className="cron-parts">
                {parts.map((part, idx) => (
                  <div key={idx} className="cron-part">
                    <span className="cron-field">{part.field}</span>
                    <code className="cron-value">{part.value}</code>
                    <span className="cron-meaning">{part.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next runs */}
          {nextRuns.length > 0 && (
            <div className="output-zone">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">NEXT RUNS</span>
                  <span className="auto-badge">
                    <Calendar className="w-3 h-3" />
                    {nextRuns.length} upcoming
                  </span>
                </div>
              </div>
              <div className="zone-output">
                <div className="cron-runs">
                  {nextRuns.map((run, idx) => (
                    <div key={idx} className="cron-run">{run}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!description && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">MEANING</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Enter a cron expression to see what it means...
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="output-zone has-error">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">ERROR</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-error">{error}</span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}

      {/* Help */}
      <div className="cron-help">
        <Info className="w-4 h-4" />
        <span>Format: minute (0-59) hour (0-23) day (1-31) month (1-12) weekday (0-6, 0=Sun)</span>
      </div>
    </div>
  );
}

export default CronTool;
