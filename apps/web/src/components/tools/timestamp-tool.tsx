'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Copy, Check, Trash2, Share2,
  Zap, AlertTriangle, Clock, Globe, RefreshCw,
} from 'lucide-react';

interface TimestampToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

// Common timezones
const TIMEZONES = [
  { id: 'local', label: 'Local', offset: '' },
  { id: 'UTC', label: 'UTC', offset: '+00:00' },
  { id: 'America/New_York', label: 'New York', offset: '-05:00' },
  { id: 'America/Los_Angeles', label: 'Los Angeles', offset: '-08:00' },
  { id: 'Europe/London', label: 'London', offset: '+00:00' },
  { id: 'Europe/Paris', label: 'Paris', offset: '+01:00' },
  { id: 'Asia/Tokyo', label: 'Tokyo', offset: '+09:00' },
  { id: 'Asia/Shanghai', label: 'Shanghai', offset: '+08:00' },
];

interface OutputData {
  iso?: string;
  rfc?: string;
  locale?: string;
  relative?: string;
  utc?: string;
  seconds?: number;
  milliseconds?: number;
  inputType: string;
  timezone: string;
}

export function TimestampTool({ slug, initialInput, initialMode }: TimestampToolProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State - prefer props over URL params
  const [input, setInput] = useState(initialInput || '');
  const [output, setOutput] = useState<OutputData | null>(null);
  const initMode = initialMode === 'toDate' || initialMode === 'toTimestamp' || initialMode === 'convert' ?
    (initialMode === 'convert' ? 'toDate' : initialMode) : 'toDate';
  const [mode, setMode] = useState<'toDate' | 'toTimestamp'>(initMode);
  const [timezone, setTimezone] = useState('local');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 2, 8);
  }, [input]);

  // Live "now" timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
    if (urlMode === 'toDate' || urlMode === 'toTimestamp') {
      setMode(urlMode);
    }
  }, [searchParams, initialInput, initialMode]);

  // Process input
  useEffect(() => {
    if (!input.trim()) {
      setOutput(null);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const result = processTimestamp(input, mode, timezone);
        setOutput(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid input');
        setOutput(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [input, mode, timezone]);

  // Process timestamp logic
  const processTimestamp = (
    rawInput: string,
    currentMode: 'toDate' | 'toTimestamp',
    tz: string
  ): OutputData => {
    const trimmed = rawInput.trim();

    // Detect input type
    let date: Date;
    let inputType: string;

    if (/^-?\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      const absNum = Math.abs(num);

      if (trimmed.replace('-', '').length >= 13 || absNum > 1e12) {
        date = new Date(num);
        inputType = 'Unix (milliseconds)';
      } else {
        date = new Date(num * 1000);
        inputType = 'Unix (seconds)';
      }
    } else {
      date = new Date(trimmed);
      inputType = 'Date string';
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date or timestamp');
    }

    if (currentMode === 'toDate') {
      const localeOptions: Intl.DateTimeFormatOptions = {
        timeZone: tz === 'local' ? undefined : tz,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      };

      return {
        iso: date.toISOString(),
        rfc: date.toUTCString(),
        locale: date.toLocaleString('en-US', localeOptions),
        relative: getRelativeTime(date),
        utc: date.toISOString().replace('T', ' ').replace('Z', ' UTC'),
        inputType,
        timezone: tz === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz,
      };
    } else {
      const ms = date.getTime();
      return {
        seconds: Math.floor(ms / 1000),
        milliseconds: ms,
        inputType,
        timezone: tz === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz,
      };
    }
  };

  // Relative time helper
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffDay) < 7) return rtf.format(diffDay, 'day');
    if (Math.abs(diffWeek) < 4) return rtf.format(diffWeek, 'week');
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    return rtf.format(diffYear, 'year');
  };

  // Handlers
  const handleCopy = useCallback(async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput(null);
    setError(null);
    router.replace(`/tools/${slug}`, { scroll: false });
  }, [router, slug]);

  const handleUseNow = useCallback(() => {
    setInput(Math.floor(nowTimestamp / 1000).toString());
  }, [nowTimestamp]);

  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('input', encodeURIComponent(input));
    url.searchParams.set('mode', mode);
    await navigator.clipboard.writeText(url.toString());
    setCopied('share');
    setTimeout(() => setCopied(null), 2000);
  }, [input, mode]);

  const nowSeconds = Math.floor(nowTimestamp / 1000);

  return (
    <div className="timestamp-tool">
      {/* Now Banner */}
      <div className="now-banner">
        <div className="now-content">
          <Clock className="w-4 h-4" />
          <span className="now-label">Now:</span>
          <code className="now-value">{nowSeconds}</code>
          <span className="now-ms">({nowTimestamp} ms)</span>
        </div>
        <button className="now-use-btn" onClick={handleUseNow} type="button">
          Use this
        </button>
      </div>

      {/* Controls */}
      <div className="tool-controls">
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'toDate' ? 'active' : ''}`}
            onClick={() => setMode('toDate')}
            type="button"
          >
            <Clock className="w-4 h-4" />
            <span>To Date</span>
          </button>
          <button
            className={`mode-btn ${mode === 'toTimestamp' ? 'active' : ''}`}
            onClick={() => setMode('toTimestamp')}
            type="button"
          >
            <span>#</span>
            <span>To Timestamp</span>
          </button>
        </div>

        {/* Timezone Selector */}
        <div className="timezone-selector">
          <Globe className="w-4 h-4" />
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="timezone-select"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label} {tz.offset && `(${tz.offset})`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Input Zone */}
        <div className={`input-zone ${error ? 'has-error' : ''}`}>
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">INPUT</span>
              {input && !error && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {output?.inputType}
                </span>
              )}
            </div>
            <div className="zone-actions">
              <button className="action-btn" onClick={handleClear} title="Clear" type="button">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'toDate'
              ? 'Enter Unix timestamp (e.g., 1704067200) or date string...'
              : 'Enter a date (e.g., 2024-01-01 or January 1, 2024)...'
            }
            className="zone-textarea"
            spellCheck={false}
          />
        </div>

        {/* Output Zone */}
        <div className={`output-zone ${error ? 'has-error' : ''}`}>
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">OUTPUT</span>
            {output && !error && (
              <span className="success-badge">Converted ✓</span>
            )}
            {error && (
              <span className="error-badge">
                <AlertTriangle className="w-3 h-3" />
                Error
              </span>
            )}
          </div>
          <div className="zone-actions">
            <button className="action-btn" onClick={handleShare} title="Share" type="button">
              {copied === 'share' ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="zone-output">
          {error ? (
            <span className="output-error">{error}</span>
          ) : output ? (
            <div className="timestamp-results">
              {mode === 'toDate' ? (
                <>
                  <OutputRow
                    label="ISO 8601"
                    value={output.iso ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="iso"
                  />
                  <OutputRow
                    label="RFC 2822"
                    value={output.rfc ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="rfc"
                  />
                  <OutputRow
                    label="Local"
                    value={output.locale ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="locale"
                  />
                  <OutputRow
                    label="UTC"
                    value={output.utc ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="utc"
                  />
                  <OutputRow
                    label="Relative"
                    value={output.relative ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="relative"
                    highlight
                  />
                </>
              ) : (
                <>
                  <OutputRow
                    label="Seconds"
                    value={output.seconds?.toString() ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="seconds"
                    mono
                  />
                  <OutputRow
                    label="Milliseconds"
                    value={output.milliseconds?.toString() ?? ''}
                    onCopy={handleCopy}
                    copied={copied}
                    id="milliseconds"
                    mono
                  />
                </>
              )}
            </div>
          ) : (
            <span className="output-placeholder">
              {mode === 'toDate'
                ? 'Enter a timestamp to see date formats...'
                : 'Enter a date to get Unix timestamps...'
              }
            </span>
          )}
        </div>
      </div>
      </div>{/* End tool-zones */}
    </div>
  );
}

// Output row component
function OutputRow({
  label,
  value,
  onCopy,
  copied,
  id,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: (text: string, id: string) => void;
  copied: string | null;
  id: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`output-row ${highlight ? 'highlight' : ''}`}>
      <span className="output-label">{label}</span>
      <code className={`output-value ${mono ? 'mono' : ''}`}>{value}</code>
      <button
        className="output-copy"
        onClick={() => onCopy(value, id)}
        title="Copy"
        type="button"
      >
        {copied === id ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

export default TimestampTool;
