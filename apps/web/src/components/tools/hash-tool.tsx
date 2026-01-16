'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import {
  Hash, Copy, Check, Shield, ShieldCheck, ShieldX, AlertTriangle,
  Zap, RefreshCw
} from 'lucide-react';

interface HashResult {
  algorithm: string;
  hash: string;
  hashUpperCase: string;
  length: number;
  bits: number;
}

interface CompareResult {
  match: boolean;
  algorithm?: string;
  computed: string;
  expected: string;
}

interface HashToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'generate' | 'compare';

const ALGORITHM_INFO: Record<string, { color: string; level: string; note: string }> = {
  'MD5': { color: '#EF4444', level: 'weak', note: 'Cryptographically broken' },
  'SHA-1': { color: '#F59E0B', level: 'deprecated', note: 'Deprecated' },
  'SHA-256': { color: '#10B981', level: 'secure', note: 'Recommended' },
  'SHA-512': { color: '#3B82F6', level: 'secure', note: 'Maximum security' },
};

export function HashTool({ slug, initialInput, initialMode }: HashToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'generate');
  const [compareHash, setCompareHash] = useState('');
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  const processHash = useCallback(async () => {
    if (!input.trim()) {
      setHashes([]);
      setCompareResult(null);
      setError(null);
      return;
    }

    const { hashTool } = await import('@ovenir/tools');

    if (mode === 'generate') {
      const rawResult = hashTool.run({ mode: 'generate', input });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.hashes) {
        setHashes(result.hashes as HashResult[]);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
        setHashes([]);
      }
    } else if (mode === 'compare' && compareHash.trim()) {
      const rawResult = hashTool.run({ mode: 'compare', input, compareHash });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.compare) {
        setCompareResult(result.compare as CompareResult);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
        setCompareResult(null);
      }
    }
  }, [input, mode, compareHash]);

  useEffect(() => {
    const timer = setTimeout(processHash, 150);
    return () => clearTimeout(timer);
  }, [processHash]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => setMode('generate')}
            type="button"
          >
            <Hash className="w-4 h-4" />
            <span>Generate</span>
          </button>
          <button
            className={`mode-btn ${mode === 'compare' ? 'active' : ''}`}
            onClick={() => setMode('compare')}
            type="button"
          >
            <Shield className="w-4 h-4" />
            <span>Compare</span>
          </button>
        </div>

        <div className="variant-chips">
          <button
            className={`variant-chip ${uppercase ? 'active' : ''}`}
            onClick={() => setUppercase(!uppercase)}
            type="button"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{uppercase ? 'UPPERCASE' : 'lowercase'}</span>
          </button>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input Zone */}
        <div className={`input-zone ${error ? 'has-error' : ''}`}>
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">INPUT</span>
              {input && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {new TextEncoder().encode(input).length} bytes
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="zone-textarea"
            spellCheck={false}
          />
          {/* Compare Hash Input (Compare mode only) */}
          {mode === 'compare' && (
            <div className="zone-compare-input">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">EXPECTED HASH</span>
                </div>
              </div>
              <input
                type="text"
                value={compareHash}
                onChange={(e) => setCompareHash(e.target.value)}
                placeholder="Paste hash to compare..."
                className="zone-input"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Output Zone */}
        <div className={`output-zone ${error ? 'has-error' : ''}`}>
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">OUTPUT</span>
            {mode === 'generate' && hashes.length > 0 && (
              <span className="success-badge">Generated ✓</span>
            )}
            {mode === 'compare' && compareResult && (
              compareResult.match ? (
                <span className="success-badge">
                  <ShieldCheck className="w-3 h-3" />
                  Match!
                </span>
              ) : (
                <span className="error-badge">
                  <ShieldX className="w-3 h-3" />
                  No match
                </span>
              )
            )}
            {error && (
              <span className="error-badge">
                <AlertTriangle className="w-3 h-3" />
                Error
              </span>
            )}
          </div>
        </div>

        <div className="zone-output">
          {error ? (
            <span className="output-error">{error}</span>
          ) : mode === 'generate' && hashes.length > 0 ? (
            <div className="output-results">
              {hashes.map((result) => {
                const info = ALGORITHM_INFO[result.algorithm];
                return (
                  <div key={result.algorithm} className="output-row">
                    <div className="output-row-header">
                      <span
                        className="output-algo-badge"
                        style={{ background: info?.color }}
                      >
                        {result.algorithm}
                      </span>
                      <span className="output-meta">{result.bits} bits</span>
                      <span className={`output-level output-level-${info?.level}`}>
                        {info?.level}
                      </span>
                    </div>
                    <code className="output-value mono">
                      {uppercase ? result.hashUpperCase : result.hash}
                    </code>
                    <button
                      className="output-copy"
                      onClick={() => handleCopy(
                        uppercase ? result.hashUpperCase : result.hash,
                        result.algorithm
                      )}
                      title="Copy"
                      type="button"
                    >
                      {copied === result.algorithm ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : mode === 'compare' && compareResult ? (
            <div className="compare-result">
              <p>
                {compareResult.match
                  ? `The input matches the expected ${compareResult.algorithm} hash.`
                  : 'The computed hash does not match the expected value.'
                }
              </p>
            </div>
          ) : (
            <span className="output-placeholder">
              {mode === 'generate'
                ? 'Enter text to generate MD5, SHA-1, SHA-256, SHA-512 hashes...'
                : 'Enter text and a hash to verify if they match...'
              }
            </span>
          )}
        </div>
      </div>
      </div>{/* End tool-zones */}
    </div>
  );
}

export default HashTool;
