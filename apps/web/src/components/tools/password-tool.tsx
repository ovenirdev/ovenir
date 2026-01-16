'use client';

import { useState, useCallback } from 'react';
import {
  KeyRound, Copy, Check, RefreshCw, Shield,
  Hash, Type, AtSign, Zap
} from 'lucide-react';

interface PasswordResult {
  value: string;
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  entropy: number;
}

interface PasswordToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'password' | 'passphrase' | 'pin';

export function PasswordTool({ slug, initialInput, initialMode }: PasswordToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'password');
  const [length, setLength] = useState(16);
  const [wordCount, setWordCount] = useState(4);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [separator, setSeparator] = useState('-');
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<PasswordResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(async () => {
    const { passwordTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(passwordTool.run({
      mode,
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      wordCount,
      separator,
      count,
    }));

    if (res.success && res.passwords) {
      setResults(res.passwords);
    }
  }, [mode, length, uppercase, lowercase, numbers, symbols, wordCount, separator, count]);

  const handleCopy = useCallback(async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return '#EF4444';
      case 'fair': return '#F59E0B';
      case 'good': return '#22C55E';
      case 'strong': return '#3B82F6';
      case 'very-strong': return '#8B5CF6';
      default: return 'var(--color-text-tertiary)';
    }
  };

  const getStrengthWidth = (strength: string) => {
    switch (strength) {
      case 'weak': return '20%';
      case 'fair': return '40%';
      case 'good': return '60%';
      case 'strong': return '80%';
      case 'very-strong': return '100%';
      default: return '0%';
    }
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'password' ? 'active' : ''}`}
            onClick={() => setMode('password')}
            type="button"
          >
            <KeyRound className="w-4 h-4" />
            <span>Password</span>
          </button>
          <button
            className={`mode-btn ${mode === 'passphrase' ? 'active' : ''}`}
            onClick={() => setMode('passphrase')}
            type="button"
          >
            <Type className="w-4 h-4" />
            <span>Passphrase</span>
          </button>
          <button
            className={`mode-btn ${mode === 'pin' ? 'active' : ''}`}
            onClick={() => setMode('pin')}
            type="button"
          >
            <Hash className="w-4 h-4" />
            <span>PIN</span>
          </button>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Options */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OPTIONS</span>
            </div>
          </div>
          <div className="password-options">
          {mode === 'password' && (
            <>
              <div className="password-option-row">
                <label>Length: {length}</label>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="password-slider"
                />
              </div>
              <div className="password-toggles">
                <button
                  className={`variant-chip ${uppercase ? 'active' : ''}`}
                  onClick={() => setUppercase(!uppercase)}
                  type="button"
                >
                  <span>ABC</span>
                </button>
                <button
                  className={`variant-chip ${lowercase ? 'active' : ''}`}
                  onClick={() => setLowercase(!lowercase)}
                  type="button"
                >
                  <span>abc</span>
                </button>
                <button
                  className={`variant-chip ${numbers ? 'active' : ''}`}
                  onClick={() => setNumbers(!numbers)}
                  type="button"
                >
                  <span>123</span>
                </button>
                <button
                  className={`variant-chip ${symbols ? 'active' : ''}`}
                  onClick={() => setSymbols(!symbols)}
                  type="button"
                >
                  <AtSign className="w-3 h-3" />
                  <span>!@#</span>
                </button>
              </div>
            </>
          )}

          {mode === 'passphrase' && (
            <>
              <div className="password-option-row">
                <label>Words: {wordCount}</label>
                <input
                  type="range"
                  min="3"
                  max="8"
                  value={wordCount}
                  onChange={(e) => setWordCount(parseInt(e.target.value))}
                  className="password-slider"
                />
              </div>
              <div className="password-option-row">
                <label>Separator:</label>
                <div className="password-toggles">
                  {['-', '_', '.', ' '].map((sep) => (
                    <button
                      key={sep}
                      className={`variant-chip ${separator === sep ? 'active' : ''}`}
                      onClick={() => setSeparator(sep)}
                      type="button"
                    >
                      <span>{sep === ' ' ? 'space' : sep}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'pin' && (
            <div className="password-option-row">
              <label>Length: {length}</label>
              <input
                type="range"
                min="4"
                max="12"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="password-slider"
              />
            </div>
          )}

          <div className="password-option-row">
            <label>Generate: {count}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="password-slider"
            />
          </div>

          <button className="generate-btn" onClick={generate} type="button">
            <RefreshCw className="w-4 h-4" />
            <span>Generate</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">GENERATED</span>
              <span className="success-badge">
                <Shield className="w-3 h-3" />
                {results.length} password{results.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="zone-output">
            <div className="password-results">
              {results.map((result, index) => (
                <div key={index} className="password-result">
                  <div className="password-value-row">
                    <code className="password-value">{result.value}</code>
                    <button
                      className="action-btn"
                      onClick={() => handleCopy(result.value, index)}
                      title="Copy"
                      type="button"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="password-meta">
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: getStrengthWidth(result.strength),
                          backgroundColor: getStrengthColor(result.strength),
                        }}
                      />
                    </div>
                    <span
                      className="password-strength-label"
                      style={{ color: getStrengthColor(result.strength) }}
                    >
                      {result.strength.replace('-', ' ')}
                    </span>
                    <span className="password-entropy">
                      <Zap className="w-3 h-3" />
                      {result.entropy} bits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">GENERATED</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Configure options and click Generate to create secure passwords...
            </span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default PasswordTool;
