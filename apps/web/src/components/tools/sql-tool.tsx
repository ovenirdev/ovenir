'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import { Database, Copy, Check, Zap, Minimize2, Maximize2 } from 'lucide-react';

interface SqlToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'format' | 'minify';

export function SqlTool({ slug, initialInput, initialMode }: SqlToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'format');
  const [sql, setSql] = useState(initialInput || '');
  const [indent, setIndent] = useState(2);
  const [uppercase, setUppercase] = useState(true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [sql]);

  const format = useCallback(async () => {
    if (!sql.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const { sqlTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(sqlTool.run({ mode, sql, indent, uppercase }));

    if (res.success && res.output !== undefined) {
      setOutput(res.output);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setOutput('');
    }
  }, [mode, sql, indent, uppercase]);

  useEffect(() => {
    const timer = setTimeout(format, 200);
    return () => clearTimeout(timer);
  }, [format]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const getPlaceholder = () => {
    return 'SELECT u.id, u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.active = 1 GROUP BY u.id ORDER BY order_count DESC LIMIT 10';
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'format' ? 'active' : ''}`}
            onClick={() => setMode('format')}
            type="button"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Format</span>
          </button>
          <button
            className={`mode-btn ${mode === 'minify' ? 'active' : ''}`}
            onClick={() => setMode('minify')}
            type="button"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Minify</span>
          </button>
        </div>

        {mode === 'format' && (
          <div className="variant-chips">
            <select
              value={indent}
              onChange={(e) => setIndent(parseInt(e.target.value))}
              className="indent-select"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
            </select>
            <button
              className={`variant-chip ${uppercase ? 'active' : ''}`}
              onClick={() => setUppercase(!uppercase)}
              type="button"
            >
              <span>UPPERCASE</span>
            </button>
          </div>
        )}
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">SQL INPUT</span>
              {sql && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {sql.split('\n').length} lines
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder={getPlaceholder()}
            className="zone-textarea"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        {output && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">{mode === 'format' ? 'FORMATTED' : 'MINIFIED'}</span>
                <span className="success-badge">
                  <Database className="w-3 h-3" />
                  Ready
                </span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={handleCopy}
                  title="Copy output"
                  type="button"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="zone-output">
              <pre className="zone-code">{output}</pre>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!output && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">{mode === 'format' ? 'FORMATTED' : 'MINIFIED'}</span>
              </div>
            </div>
            <div className="zone-output">
              <span className="output-placeholder">
                Enter SQL to {mode === 'format' ? 'format' : 'minify'}...
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

export default SqlTool;
