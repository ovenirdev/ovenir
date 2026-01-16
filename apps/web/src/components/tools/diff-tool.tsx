'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import {
  GitCompare, Copy, Check, AlertTriangle, Columns, AlignLeft,
  Plus, Minus, Equal, Zap
} from 'lucide-react';

interface Change {
  type: 'equal' | 'insert' | 'delete';
  value: string;
  lineNumber?: number;
}

interface DiffResult {
  changes: Change[];
  stats: {
    additions: number;
    deletions: number;
    unchanged: number;
  };
}

interface DiffToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'split' | 'inline';

export function DiffTool({ slug, initialInput, initialMode }: DiffToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'split');
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const originalRef = useRef<HTMLTextAreaElement>(null);
  const modifiedRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(originalRef.current, 3, 12);
  }, [original]);

  useEffect(() => {
    autoResizeTextarea(modifiedRef.current, 3, 12);
  }, [modified]);

  const processDiff = useCallback(async () => {
    if (!original && !modified) {
      setResult(null);
      setError(null);
      return;
    }

    const { diffTool } = await import('@ovenir/tools');
    const rawResult = diffTool.run({
      mode,
      original,
      modified,
      ignoreWhitespace,
      ignoreCase,
    });
    const res = await Promise.resolve(rawResult);

    if (res.success && res.changes) {
      setResult({
        changes: res.changes as Change[],
        stats: res.stats!,
      });
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setResult(null);
    }
  }, [original, modified, mode, ignoreWhitespace, ignoreCase]);

  useEffect(() => {
    const timer = setTimeout(processDiff, 200);
    return () => clearTimeout(timer);
  }, [processDiff]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = result.changes.map(c => {
      const prefix = c.type === 'insert' ? '+' : c.type === 'delete' ? '-' : ' ';
      return `${prefix} ${c.value}`;
    }).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
            type="button"
          >
            <Columns className="w-4 h-4" />
            <span>Split</span>
          </button>
          <button
            className={`mode-btn ${mode === 'inline' ? 'active' : ''}`}
            onClick={() => setMode('inline')}
            type="button"
          >
            <AlignLeft className="w-4 h-4" />
            <span>Inline</span>
          </button>
        </div>

        <div className="variant-chips">
          <button
            className={`variant-chip ${ignoreWhitespace ? 'active' : ''}`}
            onClick={() => setIgnoreWhitespace(!ignoreWhitespace)}
            type="button"
          >
            <span>Ignore spaces</span>
          </button>
          <button
            className={`variant-chip ${ignoreCase ? 'active' : ''}`}
            onClick={() => setIgnoreCase(!ignoreCase)}
            type="button"
          >
            <span>Ignore case</span>
          </button>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
      {/* Split View Inputs */}
      {mode === 'split' && (
        <div className="diff-split-inputs">
          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">ORIGINAL</span>
                {original && (
                  <span className="auto-badge">
                    <Zap className="w-3 h-3" />
                    {original.split('\n').length} lines
                  </span>
                )}
              </div>
            </div>
            <textarea
              ref={originalRef}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste original text here..."
              className="zone-textarea"
              spellCheck={false}
            />
          </div>

          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">MODIFIED</span>
                {modified && (
                  <span className="auto-badge">
                    <Zap className="w-3 h-3" />
                    {modified.split('\n').length} lines
                  </span>
                )}
              </div>
            </div>
            <textarea
              ref={modifiedRef}
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste modified text here..."
              className="zone-textarea"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Inline Mode Inputs */}
      {mode === 'inline' && (
        <>
          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">ORIGINAL</span>
              </div>
            </div>
            <textarea
              ref={originalRef}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste original text here..."
              className="zone-textarea"
              spellCheck={false}
            />
          </div>

          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">MODIFIED</span>
              </div>
            </div>
            <textarea
              ref={modifiedRef}
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste modified text here..."
              className="zone-textarea"
              spellCheck={false}
            />
          </div>
        </>
      )}

      {/* Results */}
      {result && (
        <div className={`output-zone ${error ? 'has-error' : ''}`}>
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">DIFF</span>
              <span className="success-badge">
                <Plus className="w-3 h-3" />
                {result.stats.additions}
              </span>
              <span className="error-badge">
                <Minus className="w-3 h-3" />
                {result.stats.deletions}
              </span>
              <span className="auto-badge">
                <Equal className="w-3 h-3" />
                {result.stats.unchanged}
              </span>
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={handleCopy}
                title="Copy diff"
                type="button"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="zone-output">
            {mode === 'split' ? (
              <div className="diff-lines">
                {result.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className={`diff-line diff-${change.type}`}
                  >
                    <span className="diff-prefix">
                      {change.type === 'insert' ? '+' : change.type === 'delete' ? '-' : ' '}
                    </span>
                    <span className="diff-content">{change.value || ' '}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="diff-inline">
                {result.changes.map((change, idx) => (
                  <span
                    key={idx}
                    className={`diff-chunk diff-${change.type}`}
                  >
                    {change.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">DIFF</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Enter text in both fields to see the differences...
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
              <span className="error-badge"><AlertTriangle className="w-3 h-3" />Failed</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-error">{error}</span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default DiffTool;
