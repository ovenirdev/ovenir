'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Link as LinkIcon, Globe, Lock, Unlock, Shield, Copy, Check,
  ExternalLink, ChevronRight, Hash, Search, User, Key, Server,
  Layers, Code, AlertCircle, Zap
} from 'lucide-react';

// Types
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

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: 'parse', label: 'Parse', icon: <Layers className="w-4 h-4" /> },
  { id: 'encode', label: 'Encode', icon: <Lock className="w-4 h-4" /> },
  { id: 'decode', label: 'Decode', icon: <Unlock className="w-4 h-4" /> },
];

// Part icons
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

  // Process URL
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

  // Copy handler
  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="url-tool">
      {/* Mode Selector */}
      <div className="url-modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`url-mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="url-input-section">
        <div className="url-input-header">
          <LinkIcon className="w-4 h-4" />
          <span>
            {mode === 'parse' && 'Enter URL to parse'}
            {mode === 'encode' && 'Enter text to encode'}
            {mode === 'decode' && 'Enter encoded URL to decode'}
          </span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'parse'
              ? 'https://example.com/path?query=value&foo=bar#section'
              : mode === 'encode'
              ? 'Text with spaces & special chars!'
              : 'https%3A%2F%2Fexample.com%2Fpath'
          }
          className="url-input"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="url-error">
          <AlertCircle className="w-5 h-5" />
          <div className="url-error-content">
            <strong>{error.message}</strong>
            {error.suggestion && <span>{error.suggestion}</span>}
          </div>
        </div>
      )}

      {/* Parse Results */}
      {mode === 'parse' && analysis && (
        <div className="url-results">
          {/* Status Banner */}
          <div className={`url-status ${analysis.isSecure ? 'secure' : 'insecure'}`}>
            {analysis.isSecure ? (
              <>
                <Shield className="w-5 h-5" />
                <span>Secure Connection (HTTPS)</span>
              </>
            ) : (
              <>
                <Unlock className="w-5 h-5" />
                <span>Insecure Connection (HTTP)</span>
              </>
            )}
            <button
              className="url-open-btn"
              onClick={() => window.open(analysis.normalized, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              Open
            </button>
          </div>

          {/* URL Parts */}
          <div className="url-parts">
            <div className="url-section-header">
              <Layers className="w-4 h-4" />
              <span>URL Components</span>
            </div>
            <div className="url-parts-grid">
              {analysis.parts.map((part) => (
                <div key={part.key} className="url-part">
                  <div className="url-part-header">
                    {PART_ICONS[part.key] || <Code className="w-4 h-4" />}
                    <span className="url-part-label">{part.label}</span>
                    <button
                      className="url-part-copy"
                      onClick={() => handleCopy(part.value, part.key)}
                    >
                      {copied === part.key ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <code className="url-part-value">{part.value || '(empty)'}</code>
                  <span className="url-part-desc">{part.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Query Parameters */}
          {analysis.queryParams.length > 0 && (
            <div className="url-params">
              <div className="url-section-header">
                <Search className="w-4 h-4" />
                <span>Query Parameters</span>
                <span className="url-param-count">{analysis.queryParams.length}</span>
              </div>
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
                    >
                      {copied === `param-${param.index}` ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Normalized URL */}
          <div className="url-normalized">
            <div className="url-section-header">
              <Zap className="w-4 h-4" />
              <span>Normalized URL</span>
              <button
                className="url-copy-btn"
                onClick={() => handleCopy(analysis.normalized, 'normalized')}
              >
                {copied === 'normalized' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <code className="url-normalized-value">{analysis.normalized}</code>
          </div>
        </div>
      )}

      {/* Encode/Decode Results */}
      {(mode === 'encode' || mode === 'decode') && result && (
        <div className="url-output">
          <div className="url-output-header">
            {mode === 'encode' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            <span>{mode === 'encode' ? 'Encoded' : 'Decoded'}</span>
            <button
              className="url-copy-btn"
              onClick={() => handleCopy(result, 'result')}
            >
              {copied === 'result' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="url-output-value">{result}</pre>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !result && !error && (
        <div className="url-empty">
          <LinkIcon className="w-12 h-12" />
          <h3>URL Studio</h3>
          <p>
            {mode === 'parse' && 'Parse URLs into components, analyze query parameters'}
            {mode === 'encode' && 'Encode text for use in URLs'}
            {mode === 'decode' && 'Decode URL-encoded strings'}
          </p>
        </div>
      )}
    </div>
  );
}

export default UrlTool;
