'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import { QrCode, Copy, Check, Download, Link, Wifi, Type } from 'lucide-react';

interface QrCodeToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'text' | 'url' | 'wifi';

export function QrCodeTool({ initialInput, initialMode }: QrCodeToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'text');
  const [content, setContent] = useState(initialInput || '');
  const [size, setSize] = useState(200);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 8);
  }, [content]);

  const generate = useCallback(async () => {
    if (mode === 'wifi') {
      if (!ssid.trim()) {
        setSvg('');
        setError(null);
        return;
      }
    } else if (!content.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    const { qrcodeTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(qrcodeTool.run({
      mode,
      content: mode === 'wifi' ? '' : content,
      size,
      ssid: mode === 'wifi' ? ssid : undefined,
      password: mode === 'wifi' ? password : undefined,
      encryption: mode === 'wifi' ? encryption : undefined,
    }));

    if (res.success && res.data) {
      setSvg(res.data);
      setError(null);
    } else if (res.error) {
      setError(res.error.message);
      setSvg('');
    }
  }, [mode, content, size, ssid, password, encryption]);

  useEffect(() => {
    const timer = setTimeout(generate, 300);
    return () => clearTimeout(timer);
  }, [generate]);

  const handleCopy = useCallback(async () => {
    if (!svg) return;
    await navigator.clipboard.writeText(svg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [svg]);

  const handleDownload = useCallback(() => {
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
            type="button"
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>
          <button
            className={`mode-btn ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
            type="button"
          >
            <Link className="w-4 h-4" />
            <span>URL</span>
          </button>
          <button
            className={`mode-btn ${mode === 'wifi' ? 'active' : ''}`}
            onClick={() => setMode('wifi')}
            type="button"
          >
            <Wifi className="w-4 h-4" />
            <span>WiFi</span>
          </button>
        </div>

        <div className="variant-chips">
          <select
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="indent-select"
          >
            <option value="150">150px</option>
            <option value="200">200px</option>
            <option value="300">300px</option>
            <option value="400">400px</option>
          </select>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
      {/* Input */}
      {mode !== 'wifi' ? (
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">{mode === 'url' ? 'URL' : 'TEXT'}</span>
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={mode === 'url' ? 'https://example.com' : 'Enter text to encode...'}
            className="zone-textarea"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">WIFI SETTINGS</span>
            </div>
          </div>
          <div className="wifi-inputs">
            <div className="wifi-row">
              <label>Network Name (SSID)</label>
              <input
                type="text"
                value={ssid}
                onChange={(e) => setSsid(e.target.value)}
                placeholder="MyNetwork"
                className="zone-input"
              />
            </div>
            <div className="wifi-row">
              <label>Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (optional)"
                className="zone-input"
              />
            </div>
            <div className="wifi-row">
              <label>Security</label>
              <div className="wifi-encryption">
                {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                  <button
                    key={enc}
                    className={`variant-chip ${encryption === enc ? 'active' : ''}`}
                    onClick={() => setEncryption(enc)}
                    type="button"
                  >
                    <span>{enc === 'nopass' ? 'None' : enc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {svg && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">QR CODE</span>
              <span className="success-badge">
                <QrCode className="w-3 h-3" />
                Ready
              </span>
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={handleCopy}
                title="Copy SVG"
                type="button"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                className="action-btn"
                onClick={handleDownload}
                title="Download SVG"
                type="button"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="zone-output visual-output qr-output">
            <div
              className="qr-preview"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!svg && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">QR CODE</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Enter {mode === 'wifi' ? 'WiFi details' : 'content'} to generate QR code...
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

export default QrCodeTool;
