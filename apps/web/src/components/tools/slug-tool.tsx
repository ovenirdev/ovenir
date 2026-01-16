'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Link2, Copy, Check, Zap, Settings } from 'lucide-react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';

interface SlugToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Separator = '-' | '_' | '.';

interface Changes {
  lowercased: boolean;
  spacesReplaced: number;
  specialCharsRemoved: number;
  accentsMapped: number;
  trimmed: boolean;
}

export function SlugTool({ initialInput }: SlugToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [separator, setSeparator] = useState<Separator>('-');
  const [lowercase, setLowercase] = useState(true);
  const [strict, setStrict] = useState(false);
  const [maxLength, setMaxLength] = useState<number | undefined>(undefined);
  const [result, setResult] = useState('');
  const [changes, setChanges] = useState<Changes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  const generate = useCallback(async () => {
    if (!input.trim()) {
      setResult('');
      setChanges(null);
      setError(null);
      return;
    }

    try {
      const { slugTool } = await import('@ovenir/tools');
      const res = await Promise.resolve(slugTool.run({
        input,
        separator,
        lowercase,
        strict,
        maxLength,
      }));

      if (res.slug !== undefined) {
        setResult(res.slug);
        setChanges(res.changes);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setResult('');
      setChanges(null);
    }
  }, [input, separator, lowercase, strict, maxLength]);

  useEffect(() => {
    const timer = setTimeout(generate, 150);
    return () => clearTimeout(timer);
  }, [generate]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const getChangeSummary = () => {
    if (!changes) return null;
    const parts: string[] = [];
    if (changes.accentsMapped > 0) parts.push(`${changes.accentsMapped} accents`);
    if (changes.spacesReplaced > 0) parts.push(`${changes.spacesReplaced} spaces`);
    if (changes.specialCharsRemoved > 0) parts.push(`${changes.specialCharsRemoved} special`);
    return parts.length > 0 ? parts.join(', ') : 'No changes';
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${separator === '-' ? 'active' : ''}`}
            onClick={() => setSeparator('-')}
            type="button"
          >
            <span>kebab-case</span>
          </button>
          <button
            className={`mode-btn ${separator === '_' ? 'active' : ''}`}
            onClick={() => setSeparator('_')}
            type="button"
          >
            <span>snake_case</span>
          </button>
          <button
            className={`mode-btn ${separator === '.' ? 'active' : ''}`}
            onClick={() => setSeparator('.')}
            type="button"
          >
            <span>dot.case</span>
          </button>
        </div>

        <div className="variant-chips">
          <button
            className={`variant-chip ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            type="button"
          >
            <Settings className="w-3 h-3" />
            <span>Options</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span>Lowercase</span>
          </label>
          <label className="setting-item">
            <input
              type="checkbox"
              checked={strict}
              onChange={(e) => setStrict(e.target.checked)}
            />
            <span>Strict (only a-z, 0-9)</span>
          </label>
          <label className="setting-item">
            <span>Max length:</span>
            <input
              type="number"
              value={maxLength || ''}
              onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="No limit"
              min={1}
              max={200}
              className="setting-input"
            />
          </label>
        </div>
      )}

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">TEXT</span>
              {input && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {input.length} chars
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="My Amazing Blog Post Title! (2024)"
            className="zone-textarea"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        {result && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">SLUG</span>
                <span className="success-badge">
                  <Link2 className="w-3 h-3" />
                  {result.length} chars
                </span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={handleCopy}
                  title="Copy slug"
                  type="button"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="zone-output">
              <code className="output-value-large">{result}</code>
              {changes && (
                <p className="output-hint">{getChangeSummary()}</p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">SLUG</span>
              </div>
            </div>
            <div className="zone-output">
              <span className="output-placeholder">
                Enter text to generate a URL-friendly slug...
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
    </div>
  );
}

export default SlugTool;
