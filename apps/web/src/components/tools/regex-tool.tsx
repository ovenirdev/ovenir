'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import { Regex, Copy, Check, AlertTriangle, CheckCircle, Replace, Zap } from 'lucide-react';

interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  index: number;
  line: number;
  column: number;
}

interface TestResult {
  matches: RegexMatch[];
  matchCount: number;
  executionTime: number;
}

interface ReplaceResult {
  replaced: string;
  replacements: number;
}

interface RegexToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'test' | 'replace';

const COMMON_PATTERNS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: 'URL', pattern: 'https?:\\/\\/[^\\s]+' },
  { name: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'Date', pattern: '\\d{4}-\\d{2}-\\d{2}' },
];

export function RegexTool({ initialInput, initialMode }: RegexToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'test');
  const [pattern, setPattern] = useState(initialInput || '');
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [replaceResult, setReplaceResult] = useState<ReplaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [text]);

  const flagsString = useMemo(() => {
    return Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join('');
  }, [flags]);

  const processRegex = useCallback(async () => {
    if (!pattern.trim()) {
      setTestResult(null);
      setReplaceResult(null);
      setError(null);
      setPatternError(null);
      return;
    }

    const { regexTool } = await import('@ovenir/tools');

    if (mode === 'test') {
      const rawResult = regexTool.run({ mode: 'test', pattern, text, flags: flagsString });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.test) {
        setTestResult(result.test as TestResult);
        setError(null);
        setPatternError(null);
      } else if (result.patternError) {
        setPatternError(result.patternError);
        setTestResult(null);
      } else if (result.error) {
        setError(result.error.message);
        setTestResult(null);
      }
    } else {
      const rawResult = regexTool.run({ mode: 'replace', pattern, text, replacement, flags: flagsString });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.replace) {
        setReplaceResult(result.replace as ReplaceResult);
        setError(null);
        setPatternError(null);
      } else if (result.patternError) {
        setPatternError(result.patternError);
        setReplaceResult(null);
      } else if (result.error) {
        setError(result.error.message);
        setReplaceResult(null);
      }
    }
  }, [pattern, text, mode, flagsString, replacement]);

  useEffect(() => {
    const timer = setTimeout(processRegex, 150);
    return () => clearTimeout(timer);
  }, [processRegex]);

  const handleCopy = useCallback(async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'test' ? 'active' : ''}`} onClick={() => setMode('test')} type="button">
            <Regex className="w-4 h-4" />
            <span>Test</span>
          </button>
          <button className={`mode-btn ${mode === 'replace' ? 'active' : ''}`} onClick={() => setMode('replace')} type="button">
            <Replace className="w-4 h-4" />
            <span>Replace</span>
          </button>
        </div>

        <div className="variant-chips">
          {Object.entries({ g: 'Global', i: 'Case-i', m: 'Multi' }).map(([flag, flagLabel]) => (
            <button
              key={flag}
              className={`variant-chip ${flags[flag as keyof typeof flags] ? 'active' : ''}`}
              onClick={() => setFlags({ ...flags, [flag]: !flags[flag as keyof typeof flags] })}
              type="button"
              title={flagLabel}
            >
              <span>{flag}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Pattern + Test String Inputs */}
        <div className="input-zone">
          {/* Pattern Input */}
          <div className={`regex-pattern-section ${patternError ? 'has-error' : ''}`}>
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">PATTERN</span>
              </div>
              <div className="zone-actions">
                <select
                  className="pattern-select"
                  onChange={(e) => e.target.value && setPattern(e.target.value)}
                  value=""
                >
                  <option value="">Common patterns...</option>
                  {COMMON_PATTERNS.map((p) => (
                    <option key={p.name} value={p.pattern}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="pattern-input-wrap">
              <span className="pattern-delim">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern..."
                className="pattern-input"
                spellCheck={false}
              />
              <span className="pattern-delim">/</span>
              <span className="pattern-flags">{flagsString}</span>
            </div>
            {patternError && <p className="pattern-error">{patternError}</p>}
          </div>

          {/* Test String */}
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">TEST STRING</span>
              {text && <span className="auto-badge"><Zap className="w-3 h-3" />{text.length} chars</span>}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to test against..."
            className="zone-textarea"
            spellCheck={false}
          />

          {/* Replacement (Replace mode) */}
          {mode === 'replace' && (
            <div className="regex-replacement-section">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">REPLACEMENT</span>
                  <span className="zone-hint">$1, $2... for groups, $& for match</span>
                </div>
              </div>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="Replacement string..."
                className="zone-input"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Output */}
        <div className={`output-zone ${error ? 'has-error' : ''}`}>
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">OUTPUT</span>
            {mode === 'test' && testResult && (
              testResult.matchCount > 0 ? (
                <span className="success-badge"><CheckCircle className="w-3 h-3" />{testResult.matchCount} matches</span>
              ) : (
                <span className="error-badge">No matches</span>
              )
            )}
            {mode === 'replace' && replaceResult && (
              <span className="success-badge">{replaceResult.replacements} replacements</span>
            )}
            {error && <span className="error-badge"><AlertTriangle className="w-3 h-3" />Error</span>}
          </div>
          {mode === 'replace' && replaceResult && (
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={() => handleCopy(replaceResult.replaced, 'result')}
                type="button"
              >
                {copied === 'result' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
        <div className="zone-output">
          {error ? (
            <span className="output-error">{error}</span>
          ) : mode === 'test' && testResult ? (
            testResult.matchCount > 0 ? (
              <div className="matches-list">
                {testResult.matches.slice(0, 50).map((match, idx) => (
                  <div key={idx} className="match-item">
                    <span className="match-index">#{idx + 1}</span>
                    <code className="match-value">{match.fullMatch}</code>
                    <span className="match-pos">L{match.line}:C{match.column}</span>
                    <button
                      className="match-copy"
                      onClick={() => handleCopy(match.fullMatch, `match-${idx}`)}
                      type="button"
                    >
                      {copied === `match-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
                {testResult.matchCount > 50 && (
                  <p className="matches-more">+{testResult.matchCount - 50} more matches</p>
                )}
              </div>
            ) : (
              <span className="output-placeholder">No matches found</span>
            )
          ) : mode === 'replace' && replaceResult ? (
            <pre>{replaceResult.replaced || '(empty result)'}</pre>
          ) : (
            <span className="output-placeholder">
              {mode === 'test' ? 'Enter a pattern and text to find matches...' : 'Enter pattern, replacement, and text...'}
            </span>
          )}
        </div>
      </div>
      </div>{/* End tool-zones */}
    </div>
  );
}

export default RegexTool;
