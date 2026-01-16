'use client';

import { useState, useCallback, useEffect } from 'react';
import { Binary, Copy, Check, Zap } from 'lucide-react';

interface Conversions {
  decimal: string;
  binary: string;
  octal: string;
  hex: string;
}

interface BaseConverterToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'decimal' | 'binary' | 'octal' | 'hex';

export function BaseConverterTool({ slug, initialInput, initialMode }: BaseConverterToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'decimal');
  const [value, setValue] = useState(initialInput || '');
  const [conversions, setConversions] = useState<Conversions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const convert = useCallback(async () => {
    if (!value.trim()) {
      setConversions(null);
      setError(null);
      return;
    }

    const { baseConverterTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(baseConverterTool.run({ mode, value }));

    if (res.success && res.conversions) {
      setConversions(res.conversions);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setConversions(null);
    }
  }, [mode, value]);

  useEffect(() => {
    const timer = setTimeout(convert, 150);
    return () => clearTimeout(timer);
  }, [convert]);

  const handleCopy = useCallback(async (text: string, type: string) => {
    // Remove formatting for copy
    const cleaned = text.replace(/[\s,]/g, '');
    await navigator.clipboard.writeText(cleaned);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const getPlaceholder = () => {
    switch (mode) {
      case 'binary': return 'Enter binary (e.g., 1010 1100)...';
      case 'octal': return 'Enter octal (e.g., 777)...';
      case 'hex': return 'Enter hex (e.g., FF or 0xFF)...';
      default: return 'Enter decimal (e.g., 255)...';
    }
  };

  const bases = [
    { key: 'decimal', label: 'Decimal', prefix: '' },
    { key: 'binary', label: 'Binary', prefix: '0b' },
    { key: 'octal', label: 'Octal', prefix: '0o' },
    { key: 'hex', label: 'Hex', prefix: '0x' },
  ] as const;

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          {bases.map(({ key, label }) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? 'active' : ''}`}
              onClick={() => setMode(key)}
              type="button"
            >
              <span>{label}</span>
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
              <span className="zone-label">INPUT ({mode.toUpperCase()})</span>
              {value && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="zone-input"
            spellCheck={false}
          />
        </div>

        {/* Results */}
      {conversions && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CONVERSIONS</span>
              <span className="success-badge">
                <Binary className="w-3 h-3" />
                Ready
              </span>
            </div>
          </div>
          <div className="zone-output">
            <div className="base-results">
              {bases.map(({ key, label, prefix }) => (
                <div key={key} className="base-result">
                  <div className="base-label">{label}</div>
                  <div className="base-value-row">
                    {prefix && <span className="base-prefix">{prefix}</span>}
                    <code className="base-value">{conversions[key]}</code>
                    <button
                      className="action-btn"
                      onClick={() => handleCopy(conversions[key], key)}
                      title={`Copy ${label}`}
                      type="button"
                    >
                      {copied === key ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!conversions && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CONVERSIONS</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Enter a number to see conversions in all bases...
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

export default BaseConverterTool;
