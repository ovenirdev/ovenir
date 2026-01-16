'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Code, Copy, Check, Lock, Unlock, Zap, ArrowRightLeft } from 'lucide-react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';

interface HtmlToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'encode' | 'decode';

interface Stats {
  inputLength: number;
  outputLength: number;
  entitiesConverted: number;
}

export function HtmlTool({ slug, initialInput, initialMode }: HtmlToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'encode');
  const [input, setInput] = useState(initialInput || '');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  const convert = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setStats(null);
      setError(null);
      return;
    }

    try {
      const { htmlTool } = await import('@ovenir/tools');
      const res = await Promise.resolve(htmlTool.run({ mode, input }));

      if (res.output !== undefined) {
        setOutput(res.output);
        setStats(res.stats || null);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setOutput('');
      setStats(null);
    }
  }, [mode, input]);

  useEffect(() => {
    const timer = setTimeout(convert, 150);
    return () => clearTimeout(timer);
  }, [convert]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const swapMode = useCallback(() => {
    setMode(mode === 'encode' ? 'decode' : 'encode');
    setInput(output);
    setOutput('');
    setStats(null);
  }, [mode, output]);

  const getPlaceholder = () => {
    return mode === 'encode'
      ? '<div class="example">Hello & "World"</div>'
      : '&lt;div class=&quot;example&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;';
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'encode' ? 'active' : ''}`}
            onClick={() => setMode('encode')}
            type="button"
          >
            <Lock className="w-4 h-4" />
            <span>Encode</span>
          </button>
          <button
            className={`mode-btn ${mode === 'decode' ? 'active' : ''}`}
            onClick={() => setMode('decode')}
            type="button"
          >
            <Unlock className="w-4 h-4" />
            <span>Decode</span>
          </button>
        </div>

        <div className="variant-chips">
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
              <span className="zone-label">{mode === 'encode' ? 'TEXT' : 'HTML ENTITIES'}</span>
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
                <span className="zone-label">{mode === 'encode' ? 'ENCODED' : 'DECODED'}</span>
                <span className="success-badge">
                  <Code className="w-3 h-3" />
                  {stats?.entitiesConverted || 0} entities
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
                <span className="zone-label">{mode === 'encode' ? 'ENCODED' : 'DECODED'}</span>
              </div>
            </div>
            <div className="zone-output">
              <span className="output-placeholder">
                Enter {mode === 'encode' ? 'text with HTML characters' : 'HTML entities'} to {mode}...
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

export default HtmlTool;
