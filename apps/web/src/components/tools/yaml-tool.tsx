'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileCode, Copy, Check, ArrowRightLeft, Zap } from 'lucide-react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';

interface YamlToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'yaml-to-json' | 'json-to-yaml';

export function YamlTool({ initialInput, initialMode }: YamlToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'yaml-to-json');
  const [input, setInput] = useState(initialInput || '');
  const [indent, setIndent] = useState(2);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const convert = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const { yamlTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(yamlTool.run({ mode, input, indent }));

    if (res.success && res.output !== undefined) {
      setOutput(res.output);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setOutput('');
    }
  }, [mode, input, indent]);

  useEffect(() => {
    const timer = setTimeout(convert, 200);
    return () => clearTimeout(timer);
  }, [convert]);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const swapMode = useCallback(() => {
    setMode(mode === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json');
    setInput(output);
    setOutput('');
  }, [mode, output]);

  const getPlaceholder = () => {
    return mode === 'yaml-to-json'
      ? 'name: John Doe\nage: 30\nskills:\n  - JavaScript\n  - TypeScript'
      : '{\n  "name": "John Doe",\n  "age": 30\n}';
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'yaml-to-json' ? 'active' : ''}`}
            onClick={() => setMode('yaml-to-json')}
            type="button"
          >
            <span>YAML → JSON</span>
          </button>
          <button
            className={`mode-btn ${mode === 'json-to-yaml' ? 'active' : ''}`}
            onClick={() => setMode('json-to-yaml')}
            type="button"
          >
            <span>JSON → YAML</span>
          </button>
        </div>

        <div className="variant-chips">
          <select
            value={indent}
            onChange={(e) => setIndent(parseInt(e.target.value))}
            className="indent-select"
          >
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
          </select>
          {output && (
            <button
              className="variant-chip"
              onClick={swapMode}
              type="button"
              title="Swap input/output"
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span>Swap</span>
            </button>
          )}
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">{mode === 'yaml-to-json' ? 'YAML' : 'JSON'}</span>
              {input && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {input.split('\n').length} lines
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
                <span className="zone-label">{mode === 'yaml-to-json' ? 'JSON' : 'YAML'}</span>
                <span className="success-badge">
                  <FileCode className="w-3 h-3" />
                  Converted
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
                <span className="zone-label">{mode === 'yaml-to-json' ? 'JSON' : 'YAML'}</span>
              </div>
            </div>
            <div className="zone-output">
              <span className="output-placeholder">
                Enter {mode === 'yaml-to-json' ? 'YAML' : 'JSON'} to convert...
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

export default YamlTool;
