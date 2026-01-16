'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Copy, Check, Trash2, Share2, ArrowDownUp,
  FileUp, Zap, AlertTriangle, ChevronDown,
  Binary, Link as LinkIcon, Mail, FileText,
  Code, Image as ImageIcon,
} from 'lucide-react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';

interface Base64ToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

// Base64 variants
type Base64Variant = 'standard' | 'urlsafe' | 'mime';

interface Base64Options {
  variant: Base64Variant;
  lineBreaks: boolean;
  lineLength: number;
  removeWhitespace: boolean;
}

// Encoders/Decoders
const base64Encode = (input: string, options: Base64Options): string => {
  const bytes = new TextEncoder().encode(input);
  const binary = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
  let encoded = btoa(binary);

  if (options.variant === 'urlsafe') {
    encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  if (options.lineBreaks || options.variant === 'mime') {
    const len = options.variant === 'mime' ? 76 : options.lineLength;
    encoded = encoded.match(new RegExp(`.{1,${len}}`, 'g'))?.join('\n') ?? encoded;
  }

  return encoded;
};

const base64Decode = (input: string, options: Base64Options): string => {
  let cleaned = input;

  if (options.removeWhitespace) {
    cleaned = cleaned.replace(/\s/g, '');
  }

  if (options.variant === 'urlsafe') {
    cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    const pad = cleaned.length % 4;
    if (pad) cleaned += '='.repeat(4 - pad);
  }

  const binary = atob(cleaned);
  const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0)!);
  return new TextDecoder().decode(bytes);
};

// Detection helpers
const isValidBase64 = (str: string): boolean => {
  if (!str || str.length < 2) return false;
  const cleaned = str.replace(/\s/g, '');
  const pattern = /^[A-Za-z0-9+/\-_]*={0,2}$/;
  return pattern.test(cleaned) && cleaned.length % 4 <= 2;
};

const detectInputType = (input: string): 'base64' | 'text' | 'unknown' => {
  if (!input || input.trim().length === 0) return 'unknown';
  const trimmed = input.trim();

  if (isValidBase64(trimmed) && trimmed.length >= 4) {
    const base64Ratio = (trimmed.match(/[A-Za-z0-9+/\-_=]/g)?.length ?? 0) / trimmed.length;
    if (base64Ratio > 0.95) return 'base64';
  }

  return 'text';
};

const getByteSize = (str: string): number => new TextEncoder().encode(str).length;

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Copy format generators
const generateDataUri = (base64: string, mimeType: string = 'text/plain'): string => {
  return `data:${mimeType};base64,${base64.replace(/\s/g, '')}`;
};

const generateCodeSnippet = (base64: string, lang: string): string => {
  const clean = base64.replace(/\s/g, '');
  switch (lang) {
    case 'javascript':
      return `const data = "${clean}";\nconst decoded = atob(data);`;
    case 'python':
      return `import base64\ndata = "${clean}"\ndecoded = base64.b64decode(data)`;
    default:
      return clean;
  }
};

export function Base64Tool({ slug, initialInput, initialMode }: Base64ToolProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // State - prefer props over URL params
  const [input, setInput] = useState(initialInput || '');
  const [output, setOutput] = useState('');
  const initMode = initialMode === 'encode' || initialMode === 'decode' ? initialMode : 'auto';
  const [mode, setMode] = useState<'encode' | 'decode' | 'auto'>(initMode);
  const [detectedMode, setDetectedMode] = useState<'encode' | 'decode'>('encode');
  const [options, setOptions] = useState<Base64Options>({
    variant: 'standard',
    lineBreaks: false,
    lineLength: 76,
    removeWhitespace: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [inputMetadata, setInputMetadata] = useState({ bytes: 0, type: 'unknown' as string });
  const [outputMetadata, setOutputMetadata] = useState({ bytes: 0, valid: true, ratio: '0' });

  // URL params init (only if no initial props were provided)
  useEffect(() => {
    if (initialInput || initialMode) return; // Props take precedence

    const urlInput = searchParams.get('input');
    const urlMode = searchParams.get('mode');

    if (urlInput) {
      try {
        setInput(decodeURIComponent(urlInput));
      } catch {
        setInput(urlInput);
      }
    }
    if (urlMode === 'encode' || urlMode === 'decode') {
      setMode(urlMode);
    }
  }, [searchParams, initialInput, initialMode]);

  // Process input
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setInputMetadata({ bytes: 0, type: 'unknown' });
      setOutputMetadata({ bytes: 0, valid: true, ratio: '0' });
      return;
    }

    const inputBytes = getByteSize(input);
    const detected = detectInputType(input);
    setInputMetadata({ bytes: inputBytes, type: detected });

    const actualMode = mode === 'auto'
      ? (detected === 'base64' ? 'decode' : 'encode')
      : mode;
    setDetectedMode(actualMode);

    const timer = setTimeout(() => {
      try {
        let result: string;
        if (actualMode === 'encode') {
          result = base64Encode(input, options);
        } else {
          result = base64Decode(input, options);
        }
        setOutput(result);
        setError(null);

        const outputBytes = getByteSize(result);
        const ratio = inputBytes > 0 ? (outputBytes / inputBytes).toFixed(2) : '0';
        setOutputMetadata({
          bytes: outputBytes,
          valid: true,
          ratio: actualMode === 'encode' ? ratio : (inputBytes / outputBytes).toFixed(2)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid input');
        setOutput('');
        setOutputMetadata({ bytes: 0, valid: false, ratio: '0' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [input, mode, options]);

  // Auto-resize textarea
  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  // Handlers
  const handleCopy = useCallback(async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    setShowCopyMenu(false);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    router.replace(`/tools/${slug}`, { scroll: false });
  }, [router, slug]);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setInput(output);
    setMode(prev => {
      if (prev === 'encode') return 'decode';
      if (prev === 'decode') return 'encode';
      return 'auto';
    });
  }, [output]);

  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('input', encodeURIComponent(input));
    url.searchParams.set('mode', detectedMode);
    await navigator.clipboard.writeText(url.toString());
    setCopied('share');
    setTimeout(() => setCopied(null), 2000);
  }, [input, detectedMode]);

  // File handling
  const handleFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result.startsWith('data:')) {
        const base64 = result.split(',')[1];
        setInput(base64 ?? '');
        setMode('decode');
      } else {
        setInput(result);
      }
    };

    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  }, []);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Variants data
  const variants: { id: Base64Variant; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'standard', label: 'Standard', icon: <Binary className="w-4 h-4" />, desc: 'RFC 4648' },
    { id: 'urlsafe', label: 'URL-safe', icon: <LinkIcon className="w-4 h-4" />, desc: 'No +/=' },
    { id: 'mime', label: 'MIME', icon: <Mail className="w-4 h-4" />, desc: '76 char lines' },
  ];

  // Copy formats
  const copyFormats = [
    { id: 'raw', label: 'Raw', icon: <Copy className="w-4 h-4" /> },
    { id: 'datauri', label: 'Data URI', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'javascript', label: 'JavaScript', icon: <Code className="w-4 h-4" /> },
    { id: 'python', label: 'Python', icon: <Code className="w-4 h-4" /> },
    { id: 'json', label: 'JSON string', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="base64-tool">
      {/* Mode & Variant Selection */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
            onClick={() => setMode('auto')}
            type="button"
          >
            <Zap className="w-4 h-4" />
            <span>Auto</span>
          </button>
          <button
            className={`mode-btn ${mode === 'encode' ? 'active' : ''}`}
            onClick={() => setMode('encode')}
            type="button"
          >
            Encode
          </button>
          <button
            className={`mode-btn ${mode === 'decode' ? 'active' : ''}`}
            onClick={() => setMode('decode')}
            type="button"
          >
            Decode
          </button>
        </div>

        <div className="variant-chips">
          {variants.map((v) => (
            <button
              key={v.id}
              className={`variant-chip ${options.variant === v.id ? 'active' : ''}`}
              onClick={() => setOptions((prev) => ({ ...prev, variant: v.id }))}
              title={v.desc}
              type="button"
            >
              {v.icon}
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
      {/* Input Zone */}
      <div
        ref={dropZoneRef}
        className={`input-zone ${isDragging ? 'dragging' : ''} ${error ? 'has-error' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">INPUT</span>
            {mode === 'auto' && input && (
              <span className="auto-badge">
                <Zap className="w-3 h-3" />
                {detectedMode === 'encode' ? 'Will encode' : 'Will decode'}
              </span>
            )}
          </div>

          <div className="zone-actions">
            <label className="action-btn" title="Upload file">
              <FileUp className="w-4 h-4" />
              <input
                type="file"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            <button className="action-btn" onClick={handleClear} title="Clear" type="button">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste text, drop a file, or type here..."
          className="zone-textarea"
          spellCheck={false}
        />

        <div className="zone-meta">
          <span className="meta-item">{formatBytes(inputMetadata.bytes)}</span>
          {inputMetadata.type !== 'unknown' && (
            <span className="meta-item meta-badge">
              {inputMetadata.type === 'base64' ? 'Looks like Base64' : 'Plain text'}
            </span>
          )}
        </div>

        {isDragging && (
          <div className="drag-overlay">
            <FileUp className="w-8 h-8" />
            <span>Drop file here</span>
          </div>
        )}
      </div>

      {/* Swap Button */}
      <button
        className="swap-btn"
        onClick={handleSwap}
        disabled={!output}
        title="Swap input/output"
        type="button"
      >
        <ArrowDownUp className="w-5 h-5" />
      </button>

      {/* Output Zone */}
      <div className={`output-zone ${error ? 'has-error' : ''}`}>
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">OUTPUT</span>

            {output && !error && (
              <span className="success-badge">
                {detectedMode === 'encode' ? 'Encoded' : 'Decoded'} ✓
              </span>
            )}

            {error && (
              <span className="error-badge">
                <AlertTriangle className="w-3 h-3" />
                Error
              </span>
            )}
          </div>

          <div className="zone-actions">
            <button className="action-btn" onClick={handleShare} title="Copy share link" type="button">
              {copied === 'share' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            <div className="copy-menu-wrap">
              <button
                className="action-btn copy-btn"
                onClick={() => output && handleCopy(output, 'raw')}
                title="Copy output"
                type="button"
              >
                {copied === 'raw' ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                className="action-btn copy-dropdown"
                onClick={() => setShowCopyMenu(!showCopyMenu)}
                title="More copy options"
                type="button"
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {showCopyMenu && output && (
                <div className="copy-menu">
                  {copyFormats.map((fmt) => (
                    <button
                      key={fmt.id}
                      className="copy-menu-item"
                      type="button"
                      onClick={() => {
                        let text = output;

                        if (fmt.id === 'datauri') {
                          text = generateDataUri(output);
                        } else if (fmt.id === 'json') {
                          text = JSON.stringify(output);
                        } else if (fmt.id === 'javascript' || fmt.id === 'python') {
                          text = generateCodeSnippet(output, fmt.id);
                        }

                        handleCopy(text, fmt.id);
                      }}
                    >
                      {fmt.icon}
                      <span>{fmt.label}</span>
                      {copied === fmt.id && <Check className="w-3 h-3 text-green-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="zone-output">
          {error ? (
            <span className="output-error">{error}</span>
          ) : output ? (
            <pre>{output}</pre>
          ) : (
            <span className="output-placeholder">Result will appear here...</span>
          )}
        </div>

        {output && !error && (
          <div className="zone-meta">
            <span className="meta-item">{formatBytes(outputMetadata.bytes)}</span>
            <span className="meta-item">
              {detectedMode === 'encode'
                ? `${outputMetadata.ratio}× larger`
                : `${outputMetadata.ratio}× smaller`}
            </span>
          </div>
        )}
      </div>
      </div>{/* End tool-zones */}

      {/* Options Panel */}
      <details className="options-panel">
        <summary className="options-toggle">
          <span>Advanced options</span>
          <ChevronDown className="w-4 h-4" />
        </summary>

        <div className="options-content">
          <label className="option-row">
            <input
              type="checkbox"
              checked={options.lineBreaks}
              onChange={(e) => setOptions((prev) => ({ ...prev, lineBreaks: e.target.checked }))}
            />
            <span>Add line breaks every</span>
            <input
              type="number"
              value={options.lineLength}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, lineLength: parseInt(e.target.value, 10) || 76 }))
              }
              className="option-input"
              min={1}
              max={256}
            />
            <span>characters</span>
          </label>

          <label className="option-row">
            <input
              type="checkbox"
              checked={options.removeWhitespace}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, removeWhitespace: e.target.checked }))
              }
            />
            <span>Remove whitespace from input (for decoding)</span>
          </label>
        </div>
      </details>
    </div>
  );
}

export default Base64Tool;
