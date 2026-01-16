'use client';

import { useState, useCallback, useEffect } from 'react';
import { CaseSensitive, Copy, Check, Zap } from 'lucide-react';

interface CaseToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

const CASE_INFO: Record<string, { label: string; example: string }> = {
  camel: { label: 'camelCase', example: 'myVariableName' },
  pascal: { label: 'PascalCase', example: 'MyClassName' },
  snake: { label: 'snake_case', example: 'my_variable_name' },
  kebab: { label: 'kebab-case', example: 'my-css-class' },
  constant: { label: 'CONSTANT_CASE', example: 'MY_CONSTANT_VALUE' },
  title: { label: 'Title Case', example: 'My Article Title' },
  sentence: { label: 'Sentence case', example: 'My sentence here' },
  lower: { label: 'lowercase', example: 'all lowercase text' },
  upper: { label: 'UPPERCASE', example: 'ALL UPPERCASE TEXT' },
};

export function CaseTool({ initialInput }: CaseToolProps) {
  const [text, setText] = useState(initialInput || '');
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const convert = useCallback(async () => {
    if (!text.trim()) {
      setResults({});
      setError(null);
      return;
    }

    const { caseTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(caseTool.run({ text }));

    if (res.success && res.results) {
      setResults(res.results);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setResults({});
    }
  }, [text]);

  useEffect(() => {
    const timer = setTimeout(convert, 150);
    return () => clearTimeout(timer);
  }, [convert]);

  const handleCopy = useCallback(async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const caseOrder = ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'sentence', 'lower', 'upper'];

  return (
    <div className="tool-container">
      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">INPUT</span>
              {text && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  Live
                </span>
              )}
            </div>
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text like: myVariableName, my-css-class, MY_CONSTANT..."
            className="zone-input"
            spellCheck={false}
          />
        </div>

        {/* Results */}
      {Object.keys(results).length > 0 && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CONVERSIONS</span>
              <span className="success-badge">
                <CaseSensitive className="w-3 h-3" />
                {Object.keys(results).length} formats
              </span>
            </div>
          </div>
          <div className="zone-output">
            <div className="case-results">
              {caseOrder.map((key) => (
                <div key={key} className="case-result">
                  <div className="case-label">{CASE_INFO[key].label}</div>
                  <div className="case-value-row">
                    <code className="case-value">{results[key]}</code>
                    <button
                      className="action-btn"
                      onClick={() => handleCopy(key, results[key])}
                      title="Copy"
                      type="button"
                    >
                      {copiedKey === key ? (
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
      {Object.keys(results).length === 0 && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CONVERSIONS</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Enter text to see all case conversions...
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

export default CaseTool;
