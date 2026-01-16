'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Regex, Copy, Check, AlertCircle, CheckCircle, Clock,
  Replace, Zap, ChevronDown, ChevronUp, Hash, MapPin
} from 'lucide-react';

// Types
interface RegexMatch {
  fullMatch: string;
  groups: (string | undefined)[];
  namedGroups: Record<string, string>;
  index: number;
  endIndex: number;
  line: number;
  column: number;
}

interface TestResult {
  isValid: boolean;
  matches: RegexMatch[];
  matchCount: number;
  executionTime: number;
}

interface ReplaceResult {
  original: string;
  replaced: string;
  replacements: number;
  executionTime: number;
}

interface RegexToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'test' | 'replace';

// Common patterns
const COMMON_PATTERNS = [
  { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' },
  { name: 'URL', pattern: 'https?:\\/\\/[^\\s]+' },
  { name: 'IP Address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { name: 'Phone', pattern: '\\+?[\\d\\s\\-().]{10,}' },
  { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}' },
  { name: 'Time (HH:MM)', pattern: '\\d{2}:\\d{2}(?::\\d{2})?' },
  { name: 'Hex Color', pattern: '#[0-9A-Fa-f]{6}\\b' },
  { name: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' },
];

// Flag descriptions
const FLAG_INFO: Record<string, { name: string; desc: string }> = {
  g: { name: 'Global', desc: 'Find all matches' },
  i: { name: 'Case-insensitive', desc: 'Ignore case' },
  m: { name: 'Multiline', desc: '^$ match line start/end' },
  s: { name: 'Dotall', desc: '. matches newlines' },
  u: { name: 'Unicode', desc: 'Enable Unicode support' },
};

export function RegexTool({ slug, initialInput, initialMode }: RegexToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'test');
  const [pattern, setPattern] = useState(initialInput || '');
  const [text, setText] = useState('');
  const [replacement, setReplacement] = useState('');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [replaceResult, setReplaceResult] = useState<ReplaceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [patternError, setPatternError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPatterns, setShowPatterns] = useState(false);
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  // Build flags string
  const flagsString = useMemo(() => {
    return Object.entries(flags)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join('');
  }, [flags]);

  // Process regex
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
      const rawResult = regexTool.run({
        mode: 'test',
        pattern,
        text,
        flags: flagsString,
      });
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
    } else if (mode === 'replace') {
      const rawResult = regexTool.run({
        mode: 'replace',
        pattern,
        text,
        replacement,
        flags: flagsString,
      });
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

  // Highlight matches in text
  const highlightedText = useMemo(() => {
    if (!testResult?.matches?.length || !text) return null;

    const parts: { text: string; isMatch: boolean; matchIndex?: number }[] = [];
    let lastIndex = 0;

    testResult.matches.forEach((match, idx) => {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), isMatch: false });
      }
      parts.push({ text: match.fullMatch, isMatch: true, matchIndex: idx });
      lastIndex = match.endIndex;
    });

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), isMatch: false });
    }

    return parts;
  }, [testResult, text]);

  // Copy handler
  const handleCopy = useCallback(async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Select pattern
  const selectPattern = useCallback((p: string) => {
    setPattern(p);
    setShowPatterns(false);
  }, []);

  return (
    <div className="regex-tool">
      {/* Mode Toggle */}
      <div className="regex-modes">
        <button
          className={`regex-mode-btn ${mode === 'test' ? 'active' : ''}`}
          onClick={() => setMode('test')}
        >
          <Regex className="w-4 h-4" />
          <span>Test</span>
        </button>
        <button
          className={`regex-mode-btn ${mode === 'replace' ? 'active' : ''}`}
          onClick={() => setMode('replace')}
        >
          <Replace className="w-4 h-4" />
          <span>Replace</span>
        </button>
      </div>

      {/* Pattern Input */}
      <div className="regex-pattern-section">
        <div className="regex-pattern-header">
          <Regex className="w-4 h-4" />
          <span>Pattern</span>
          <button
            className="regex-patterns-btn"
            onClick={() => setShowPatterns(!showPatterns)}
          >
            Common Patterns
            {showPatterns ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showPatterns && (
          <div className="regex-patterns-list">
            {COMMON_PATTERNS.map((p) => (
              <button
                key={p.name}
                className="regex-pattern-item"
                onClick={() => selectPattern(p.pattern)}
              >
                <span className="regex-pattern-name">{p.name}</span>
                <code className="regex-pattern-code">{p.pattern}</code>
              </button>
            ))}
          </div>
        )}

        <div className="regex-pattern-input-wrap">
          <span className="regex-delimiter">/</span>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Enter regex pattern..."
            className={`regex-pattern-input ${patternError ? 'error' : ''}`}
            spellCheck={false}
          />
          <span className="regex-delimiter">/</span>
          <span className="regex-flags">{flagsString}</span>
        </div>

        {patternError && (
          <div className="regex-pattern-error">
            <AlertCircle className="w-3.5 h-3.5" />
            {patternError}
          </div>
        )}

        {/* Flags */}
        <div className="regex-flags-row">
          {Object.entries(FLAG_INFO).map(([flag, info]) => (
            <label
              key={flag}
              className={`regex-flag ${flags[flag as keyof typeof flags] ? 'active' : ''}`}
              title={info.desc}
            >
              <input
                type="checkbox"
                checked={flags[flag as keyof typeof flags]}
                onChange={(e) => setFlags({ ...flags, [flag]: e.target.checked })}
              />
              <span className="regex-flag-letter">{flag}</span>
              <span className="regex-flag-name">{info.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Text Input */}
      <div className="regex-text-section">
        <div className="regex-text-header">
          <span>Test String</span>
          {text && (
            <span className="regex-text-stats">
              {text.length} chars • {text.split('\n').length} lines
            </span>
          )}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to test against..."
          className="regex-text-input"
          spellCheck={false}
        />
      </div>

      {/* Replace Input (Replace mode only) */}
      {mode === 'replace' && (
        <div className="regex-replace-section">
          <div className="regex-text-header">
            <Replace className="w-4 h-4" />
            <span>Replacement</span>
            <span className="regex-replace-hint">Use $1, $2... for groups, $& for match</span>
          </div>
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replacement string..."
            className="regex-replace-input"
            spellCheck={false}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="regex-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Test Results */}
      {mode === 'test' && testResult && (
        <div className="regex-results">
          {/* Stats Banner */}
          <div className={`regex-stats-banner ${testResult.matchCount > 0 ? 'has-matches' : 'no-matches'}`}>
            {testResult.matchCount > 0 ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{testResult.matchCount} match{testResult.matchCount !== 1 ? 'es' : ''} found</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>No matches found</span>
              </>
            )}
            <span className="regex-exec-time">
              <Clock className="w-3.5 h-3.5" />
              {testResult.executionTime.toFixed(2)}ms
            </span>
          </div>

          {/* Highlighted Text */}
          {highlightedText && highlightedText.length > 0 && (
            <div className="regex-highlighted">
              <div className="regex-highlighted-header">
                <Zap className="w-4 h-4" />
                <span>Highlighted Matches</span>
              </div>
              <pre className="regex-highlighted-text">
                {highlightedText.map((part, i) =>
                  part.isMatch ? (
                    <mark
                      key={i}
                      className="regex-match-highlight"
                      onClick={() => setExpandedMatch(
                        expandedMatch === part.matchIndex ? null : part.matchIndex!
                      )}
                    >
                      {part.text}
                    </mark>
                  ) : (
                    <span key={i}>{part.text}</span>
                  )
                )}
              </pre>
            </div>
          )}

          {/* Match Details */}
          {testResult.matches.length > 0 && (
            <div className="regex-matches">
              <div className="regex-matches-header">
                <Hash className="w-4 h-4" />
                <span>Match Details</span>
              </div>
              <div className="regex-matches-list">
                {testResult.matches.slice(0, 100).map((match, idx) => (
                  <div
                    key={idx}
                    className={`regex-match ${expandedMatch === idx ? 'expanded' : ''}`}
                    onClick={() => setExpandedMatch(expandedMatch === idx ? null : idx)}
                  >
                    <div className="regex-match-main">
                      <span className="regex-match-index">#{idx + 1}</span>
                      <code className="regex-match-value">{match.fullMatch}</code>
                      <span className="regex-match-pos">
                        <MapPin className="w-3 h-3" />
                        L{match.line}:C{match.column}
                      </span>
                      <button
                        className="regex-match-copy"
                        onClick={(e) => { e.stopPropagation(); handleCopy(match.fullMatch, `match-${idx}`); }}
                      >
                        {copied === `match-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {expandedMatch === idx && (
                      <div className="regex-match-details">
                        <div className="regex-match-detail">
                          <span>Index</span>
                          <code>{match.index} - {match.endIndex}</code>
                        </div>
                        {match.groups.length > 0 && (
                          <div className="regex-match-detail full">
                            <span>Groups</span>
                            <div className="regex-groups-list">
                              {match.groups.map((g, i) => (
                                <code key={i} className="regex-group">
                                  ${i + 1}: {g ?? '(empty)'}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                        {Object.keys(match.namedGroups).length > 0 && (
                          <div className="regex-match-detail full">
                            <span>Named Groups</span>
                            <div className="regex-groups-list">
                              {Object.entries(match.namedGroups).map(([name, value]) => (
                                <code key={name} className="regex-group">
                                  {name}: {value}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {testResult.matches.length > 100 && (
                  <div className="regex-matches-more">
                    +{testResult.matches.length - 100} more matches
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Replace Results */}
      {mode === 'replace' && replaceResult && (
        <div className="regex-replace-result">
          <div className="regex-replace-header">
            <Replace className="w-4 h-4" />
            <span>Result</span>
            <span className="regex-replace-stats">
              {replaceResult.replacements} replacement{replaceResult.replacements !== 1 ? 's' : ''} •
              <Clock className="w-3.5 h-3.5 inline ml-1" />
              {replaceResult.executionTime.toFixed(2)}ms
            </span>
            <button
              className="regex-copy-btn"
              onClick={() => handleCopy(replaceResult.replaced, 'replaced')}
            >
              {copied === 'replaced' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'replaced' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="regex-replace-output">{replaceResult.replaced || '(empty result)'}</pre>
        </div>
      )}

      {/* Empty State */}
      {!pattern && !error && (
        <div className="regex-empty">
          <Regex className="w-12 h-12" />
          <h3>Regex Tester</h3>
          <p>
            {mode === 'test'
              ? 'Enter a regex pattern and test string to find matches'
              : 'Enter a regex pattern, replacement string, and test string'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default RegexTool;
