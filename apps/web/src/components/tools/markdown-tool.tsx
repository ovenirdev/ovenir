'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import { FileText, Copy, Check, Eye, Code, Zap } from 'lucide-react';

interface MarkdownToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'preview' | 'html';

export function MarkdownTool({ slug, initialInput, initialMode }: MarkdownToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'preview');
  const [markdown, setMarkdown] = useState(initialInput || '');
  const [html, setHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [markdown]);

  const processMarkdown = useCallback(async () => {
    if (!markdown.trim()) {
      setHtml('');
      setError(null);
      return;
    }

    const { markdownTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(markdownTool.run({ mode, markdown }));

    if (res.success && res.html !== undefined) {
      setHtml(res.html);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setHtml('');
    }
  }, [markdown, mode]);

  useEffect(() => {
    const timer = setTimeout(processMarkdown, 150);
    return () => clearTimeout(timer);
  }, [processMarkdown]);

  const handleCopy = useCallback(async () => {
    if (!html) return;
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const lineCount = markdown.split('\n').length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => setMode('preview')}
            type="button"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button
            className={`mode-btn ${mode === 'html' ? 'active' : ''}`}
            onClick={() => setMode('html')}
            type="button"
          >
            <Code className="w-4 h-4" />
            <span>HTML</span>
          </button>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">MARKDOWN</span>
              {markdown && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {lineCount} lines · {wordCount} words
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# Hello World\n\nWrite your **Markdown** here..."
            className="zone-textarea"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        {html && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">{mode === 'preview' ? 'PREVIEW' : 'HTML'}</span>
                <span className="success-badge">
                  <FileText className="w-3 h-3" />
                  Ready
                </span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={handleCopy}
                  title="Copy HTML"
                  type="button"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="zone-output">
              {mode === 'preview' ? (
                <div
                  className="markdown-preview"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <pre className="zone-code">{html}</pre>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!html && !error && (
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">{mode === 'preview' ? 'PREVIEW' : 'HTML'}</span>
              </div>
            </div>
            <div className="zone-output">
              <span className="output-placeholder">
                Start typing Markdown to see the {mode === 'preview' ? 'preview' : 'HTML output'}...
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

export default MarkdownTool;
