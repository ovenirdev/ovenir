'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileCode, Copy, Check, Zap, Minimize2, Maximize2 } from 'lucide-react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';

interface XmlToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'format' | 'minify';

interface Stats {
  elements: number;
  attributes: number;
  textNodes: number;
}

export function XmlTool({ initialInput, initialMode }: XmlToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'format');
  const [xml, setXml] = useState(initialInput || '');
  const [indent, setIndent] = useState(2);
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<{ message: string; line?: number; column?: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [xml]);

  const format = useCallback(async () => {
    if (!xml.trim()) {
      setOutput('');
      setStats(null);
      setError(null);
      return;
    }

    try {
      const { xmlTool } = await import('@ovenir/tools');
      const res = await Promise.resolve(xmlTool.run({ mode, xml, indent }));

      if (res.success && res.output !== undefined) {
        setOutput(res.output);
        setStats(res.stats || null);
        setError(null);
      } else if (res.error) {
        setError(res.error);
        setOutput('');
        setStats(null);
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : 'Unknown error' });
      setOutput('');
      setStats(null);
    }
  }, [mode, xml, indent]);

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
    return `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item id="1">
    <name>Example</name>
    <value>Hello World</value>
  </item>
</root>`;
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
          </div>
        )}
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">XML INPUT</span>
              {xml && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {xml.split('\n').length} lines
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={xml}
            onChange={(e) => setXml(e.target.value)}
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
                  <FileCode className="w-3 h-3" />
                  {stats ? `${stats.elements} elements` : 'Ready'}
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
                Enter XML to {mode === 'format' ? 'format' : 'minify'}...
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
                {error.line && (
                  <span className="error-badge">Line {error.line}</span>
                )}
              </div>
            </div>
            <div className="zone-output">
              <span className="output-error">{error.message}</span>
            </div>
          </div>
        )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default XmlTool;
