'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Link as LinkIcon, Globe, Lock, Unlock, Shield, Copy, Check,
  ExternalLink, ChevronRight, Hash, Search, User, Key, Server,
  Layers, Code, AlertTriangle, Zap
} from 'lucide-react';
import { useAutoResize } from '@/hooks/useAutoResize';

interface UrlPart {
  key: string;
  label: string;
  value: string;
  encoded?: string;
  description: string;
}

interface QueryParam {
  key: string;
  value: string;
  keyDecoded: string;
  valueDecoded: string;
  index: number;
}

interface UrlAnalysis {
  original: string;
  normalized: string;
  valid: boolean;
  parts: UrlPart[];
  queryParams: QueryParam[];
  isSecure: boolean;
  hasAuth: boolean;
  hasPort: boolean;
  hasFragment: boolean;
}

interface UrlToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'parse' | 'encode' | 'decode';

const PART_ICONS: Record<string, React.ReactNode> = {
  protocol: <Globe className="w-4 h-4" />,
  hostname: <Server className="w-4 h-4" />,
  port: <Hash className="w-4 h-4" />,
  pathname: <ChevronRight className="w-4 h-4" />,
  search: <Search className="w-4 h-4" />,
  hash: <Hash className="w-4 h-4" />,
  username: <User className="w-4 h-4" />,
  password: <Key className="w-4 h-4" />,
  origin: <LinkIcon className="w-4 h-4" />,
};

export function UrlTool({ slug, initialInput, initialMode }: UrlToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'parse');
  const [analysis, setAnalysis] = useState<UrlAnalysis | null>(null);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { ref: textareaRef, resize } = useAutoResize<HTMLTextAreaElement>({ minRows: 2, maxRows: 10 });

  const processUrl = useCallback(async () => {
    if (!input.trim()) {
      setAnalysis(null);
      setResult('');
      setError(null);
      return;
    }

    const { urlTool } = await import('@ovenir/tools');
    const rawResult = urlTool.run({ mode, input });
    const res = await Promise.resolve(rawResult);

    if (res.success) {
      setError(null);
      if (res.analysis) {
        setAnalysis(res.analysis as UrlAnalysis);
      }
      if (res.result) {
        setResult(res.result);
      }
    } else if (res.error) {
      setError(res.error);
      setAnalysis(null);
      setResult('');
    }
  }, [input, mode]);

  useEffect(() => {
    const timer = setTimeout(processUrl, 150);
    return () => clearTimeout(timer);
  }, [processUrl]);

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
            className={`mode-btn ${mode === 'parse' ? 'active' : ''}`}
            onClick={() => setMode('parse')}
            type="button"
          >
            <Layers className="w-4 h-4" />
            <span>Parse</span>
          </button>
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
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className={`input-zone ${error ? 'has-error' : ''}`}>
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">
                {mode === 'parse' && 'URL TO PARSE'}
                {mode === 'encode' && 'TEXT TO ENCODE'}
                {mode === 'decode' && 'URL TO DECODE'}
              </span>
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
            placeholder={
              mode === 'parse'
                ? 'https://example.com/path?query=value&foo=bar#section'
                : mode === 'encode'
                ? 'Text with spaces & special chars!'
                : 'https%3A%2F%2Fexample.com%2Fpath'
            }
            className="zone-textarea"
            spellCheck={false}
          />
        </div>

        {/* Error */}
      {error && (
        <div className="output-zone has-error">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">ERROR</span>
              <span className="error-badge"><AlertTriangle className="w-3 h-3" />Invalid</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-error">{error.message}</span>
            {error.suggestion && <p className="output-hint">{error.suggestion}</p>}
          </div>
        </div>
      )}

      {/* Parse Results */}
      {mode === 'parse' && analysis && (
        <>
          {/* Status */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">STATUS</span>
                {analysis.isSecure ? (
                  <span className="success-badge"><Shield className="w-3 h-3" />Secure (HTTPS)</span>
                ) : (
                  <span className="warning-badge"><Unlock className="w-3 h-3" />Insecure (HTTP)</span>
                )}
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={() => window.open(analysis.normalized, '_blank')}
                  title="Open URL"
                  type="button"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* URL Parts */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">COMPONENTS</span>
                <span className="auto-badge">{analysis.parts.length} parts</span>
              </div>
            </div>
            <div className="zone-output">
              <div className="url-parts-grid">
                {analysis.parts.map((part) => (
                  <div key={part.key} className="url-part">
                    <div className="url-part-header">
                      {PART_ICONS[part.key] || <Code className="w-4 h-4" />}
                      <span className="url-part-label">{part.label}</span>
                      <button
                        className="url-part-copy"
                        onClick={() => handleCopy(part.value, part.key)}
                        type="button"
                      >
                        {copied === part.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <code className="url-part-value">{part.value || '(empty)'}</code>
                    <span className="url-part-desc">{part.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Query Parameters */}
          {analysis.queryParams.length > 0 && (
            <div className="output-zone">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">QUERY PARAMETERS</span>
                  <span className="success-badge">{analysis.queryParams.length} params</span>
                </div>
              </div>
              <div className="zone-output">
                <div className="url-params-list">
                  {analysis.queryParams.map((param) => (
                    <div key={`${param.key}-${param.index}`} className="url-param">
                      <div className="url-param-key">
                        <code>{param.keyDecoded}</code>
                        {param.key !== param.keyDecoded && (
                          <span className="url-param-encoded">({param.key})</span>
                        )}
                      </div>
                      <div className="url-param-sep">=</div>
                      <div className="url-param-value">
                        <code>{param.valueDecoded}</code>
                        {param.value !== param.valueDecoded && (
                          <span className="url-param-encoded">({param.value})</span>
                        )}
                      </div>
                      <button
                        className="url-param-copy"
                        onClick={() => handleCopy(`${param.keyDecoded}=${param.valueDecoded}`, `param-${param.index}`)}
                        type="button"
                      >
                        {copied === `param-${param.index}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Normalized URL */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">NORMALIZED URL</span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={() => handleCopy(analysis.normalized, 'normalized')}
                  title="Copy"
                  type="button"
                >
                  {copied === 'normalized' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="zone-output">
              <code className="output-value-large">{analysis.normalized}</code>
            </div>
          </div>
        </>
      )}

      {/* Encode/Decode Results */}
      {(mode === 'encode' || mode === 'decode') && result && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">{mode === 'encode' ? 'ENCODED' : 'DECODED'}</span>
              <span className="success-badge">{result.length} chars</span>
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={() => handleCopy(result, 'result')}
                title="Copy"
                type="button"
              >
                {copied === 'result' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="zone-output">
            <pre className="output-pre">{result}</pre>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !result && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              {mode === 'parse' && 'Enter a URL to parse into components...'}
              {mode === 'encode' && 'Enter text to URL-encode...'}
              {mode === 'decode' && 'Enter an encoded URL to decode...'}
            </span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default UrlTool;
