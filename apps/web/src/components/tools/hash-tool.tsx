'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Hash, Copy, Check, Shield, ShieldCheck, ShieldX, AlertCircle,
  Lock, RefreshCw
} from 'lucide-react';

// Types
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

const ALGORITHM_COLORS: Record<string, string> = {
  'MD5': '#EF4444',
  'SHA-1': '#F59E0B',
  'SHA-256': '#10B981',
  'SHA-512': '#3B82F6',
};

const ALGORITHM_SECURITY: Record<string, { level: string; note: string }> = {
  'MD5': { level: 'weak', note: 'Cryptographically broken - use for checksums only' },
  'SHA-1': { level: 'deprecated', note: 'Deprecated - avoid for security purposes' },
  'SHA-256': { level: 'secure', note: 'Recommended for most use cases' },
  'SHA-512': { level: 'secure', note: 'Maximum security, larger output' },
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

  // Process hash
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

  // Copy handler
  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="hash-tool">
      {/* Mode Toggle */}
      <div className="hash-modes">
        <button
          className={`hash-mode-btn ${mode === 'generate' ? 'active' : ''}`}
          onClick={() => setMode('generate')}
        >
          <Hash className="w-4 h-4" />
          <span>Generate</span>
        </button>
        <button
          className={`hash-mode-btn ${mode === 'compare' ? 'active' : ''}`}
          onClick={() => setMode('compare')}
        >
          <Shield className="w-4 h-4" />
          <span>Compare</span>
        </button>
      </div>

      {/* Input Section */}
      <div className="hash-input-section">
        <div className="hash-input-header">
          <Lock className="w-4 h-4" />
          <span>Input Text</span>
          {input && (
            <span className="hash-input-size">{new TextEncoder().encode(input).length} bytes</span>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
          className="hash-input"
          spellCheck={false}
        />
      </div>

      {/* Compare Hash Input */}
      {mode === 'compare' && (
        <div className="hash-compare-section">
          <div className="hash-input-header">
            <Shield className="w-4 h-4" />
            <span>Expected Hash</span>
          </div>
          <input
            type="text"
            value={compareHash}
            onChange={(e) => setCompareHash(e.target.value)}
            placeholder="Paste hash to compare..."
            className="hash-compare-input"
            spellCheck={false}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="hash-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Compare Result */}
      {mode === 'compare' && compareResult && (
        <div className={`hash-compare-result ${compareResult.match ? 'match' : 'no-match'}`}>
          {compareResult.match ? (
            <>
              <ShieldCheck className="w-6 h-6" />
              <div className="hash-compare-text">
                <strong>Match Found!</strong>
                <span>The input matches the expected {compareResult.algorithm} hash</span>
              </div>
            </>
          ) : (
            <>
              <ShieldX className="w-6 h-6" />
              <div className="hash-compare-text">
                <strong>No Match</strong>
                <span>The computed hash does not match the expected value</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Generate Results */}
      {mode === 'generate' && hashes.length > 0 && (
        <div className="hash-results">
          <div className="hash-results-header">
            <span>Generated Hashes</span>
            <button
              className={`hash-case-toggle ${uppercase ? 'active' : ''}`}
              onClick={() => setUppercase(!uppercase)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {uppercase ? 'UPPERCASE' : 'lowercase'}
            </button>
          </div>

          <div className="hash-list">
            {hashes.map((result) => {
              const security = ALGORITHM_SECURITY[result.algorithm];
              const color = ALGORITHM_COLORS[result.algorithm];

              return (
                <div
                  key={result.algorithm}
                  className="hash-item"
                  style={{ '--algo-color': color } as React.CSSProperties}
                >
                  <div className="hash-item-header">
                    <span
                      className="hash-algo-badge"
                      style={{ background: color }}
                    >
                      {result.algorithm}
                    </span>
                    <span className="hash-bits">{result.bits} bits</span>
                    <span className={`hash-security hash-security-${security.level}`}>
                      {security.level}
                    </span>
                    <button
                      className="hash-copy-btn"
                      onClick={() => handleCopy(
                        uppercase ? result.hashUpperCase : result.hash,
                        result.algorithm
                      )}
                    >
                      {copied === result.algorithm ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <code className="hash-value">
                    {uppercase ? result.hashUpperCase : result.hash}
                  </code>
                  <span className="hash-note">{security.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hashes.length && !compareResult && !error && (
        <div className="hash-empty">
          <Hash className="w-12 h-12" />
          <h3>Hash Generator</h3>
          <p>
            {mode === 'generate'
              ? 'Enter text above to generate MD5, SHA-1, SHA-256, and SHA-512 hashes'
              : 'Enter text and a hash to verify if they match'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default HashTool;
