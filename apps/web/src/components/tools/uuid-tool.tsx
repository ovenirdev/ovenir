'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Fingerprint, Copy, Check, RefreshCw, Sparkles, Clock,
  Hash, AlertTriangle, Download, Zap
} from 'lucide-react';

interface UuidInfo {
  uuid: string;
  version: number | null;
  variant: string;
  isValid: boolean;
  isNil: boolean;
  timestamp?: string;
  clockSeq?: number;
  node?: string;
}

interface UuidToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'generate' | 'parse' | 'bulk';
type Version = 'v1' | 'v4' | 'v7';

const VERSION_INFO: Record<Version, { name: string; desc: string }> = {
  v1: { name: 'v1', desc: 'Time-based' },
  v4: { name: 'v4', desc: 'Random' },
  v7: { name: 'v7', desc: 'Unix + Random' },
};

export function UuidTool({ slug, initialInput, initialMode }: UuidToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'generate');
  const [version, setVersion] = useState<Version>('v4');
  const [parseInput, setParseInput] = useState(initialInput || '');
  const [bulkCount, setBulkCount] = useState(10);
  const [uppercase, setUppercase] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [generatedUuid, setGeneratedUuid] = useState<string | null>(null);
  const [uuidInfo, setUuidInfo] = useState<UuidInfo | null>(null);
  const [bulkUuids, setBulkUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generateSingle = useCallback(async () => {
    const { uuidTool } = await import('@ovenir/tools');
    const rawResult = uuidTool.run({ mode: 'generate', version, uppercase, noDashes });
    const result = await Promise.resolve(rawResult);

    if (result.success && result.uuid) {
      setGeneratedUuid(result.uuid);
      setUuidInfo(result.info as UuidInfo);
      setError(null);
    } else if (result.error) {
      setError(result.error.message);
    }
  }, [version, uppercase, noDashes]);

  const parseUuid = useCallback(async () => {
    if (!parseInput.trim()) {
      setUuidInfo(null);
      setError(null);
      return;
    }

    const { uuidTool } = await import('@ovenir/tools');
    const rawResult = uuidTool.run({ mode: 'parse', uuid: parseInput });
    const result = await Promise.resolve(rawResult);

    if (result.success && result.info) {
      setUuidInfo(result.info as UuidInfo);
      setError(null);
    } else if (result.error) {
      setError(result.error.message);
      setUuidInfo(null);
    }
  }, [parseInput]);

  const generateBulk = useCallback(async () => {
    const { uuidTool } = await import('@ovenir/tools');
    const rawResult = uuidTool.run({
      mode: 'bulk',
      version,
      count: bulkCount,
      uppercase,
      noDashes,
    });
    const result = await Promise.resolve(rawResult);

    if (result.success && result.uuids) {
      setBulkUuids(result.uuids);
      setError(null);
    } else if (result.error) {
      setError(result.error.message);
    }
  }, [version, bulkCount, uppercase, noDashes]);

  useEffect(() => {
    if (mode === 'generate') {
      generateSingle();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'parse') {
      const timer = setTimeout(parseUuid, 150);
      return () => clearTimeout(timer);
    }
  }, [parseInput, mode, parseUuid]);

  const handleCopy = useCallback(async (text: string, id: string = 'uuid') => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const downloadBulk = useCallback(() => {
    const content = bulkUuids.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uuids-${version}-${bulkUuids.length}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bulkUuids, version]);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'generate' ? 'active' : ''}`}
            onClick={() => setMode('generate')}
            type="button"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate</span>
          </button>
          <button
            className={`mode-btn ${mode === 'parse' ? 'active' : ''}`}
            onClick={() => setMode('parse')}
            type="button"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Parse</span>
          </button>
          <button
            className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
            onClick={() => setMode('bulk')}
            type="button"
          >
            <Hash className="w-4 h-4" />
            <span>Bulk</span>
          </button>
        </div>

        {(mode === 'generate' || mode === 'bulk') && (
          <div className="variant-chips">
            {(Object.keys(VERSION_INFO) as Version[]).map((v) => (
              <button
                key={v}
                className={`variant-chip ${version === v ? 'active' : ''}`}
                onClick={() => setVersion(v)}
                type="button"
              >
                <span>{VERSION_INFO[v].name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
      {/* Generate Mode */}
      {mode === 'generate' && (
        <>
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">GENERATED UUID</span>
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  {VERSION_INFO[version].desc}
                </span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={() => handleCopy(generatedUuid || '', 'uuid')}
                  title="Copy"
                  type="button"
                >
                  {copied === 'uuid' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  className="action-btn"
                  onClick={generateSingle}
                  title="Generate new"
                  type="button"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="zone-output">
              {generatedUuid ? (
                <code className="output-value-large">{generatedUuid}</code>
              ) : (
                <span className="output-placeholder">Generating...</span>
              )}
            </div>
          </div>

          {uuidInfo && (
            <div className="output-zone">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">DETAILS</span>
                </div>
              </div>
              <div className="zone-output">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Version</span>
                    <span className="detail-value">{uuidInfo.version}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Variant</span>
                    <span className="detail-value">{uuidInfo.variant}</span>
                  </div>
                  {uuidInfo.timestamp && (
                    <div className="detail-item full">
                      <span className="detail-label">
                        <Clock className="w-3 h-3" /> Timestamp
                      </span>
                      <span className="detail-value">{new Date(uuidInfo.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Parse Mode */}
      {mode === 'parse' && (
        <>
          <div className={`input-zone ${error ? 'has-error' : ''}`}>
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">UUID TO PARSE</span>
              </div>
            </div>
            <input
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="Enter UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
              className="zone-input"
              spellCheck={false}
            />
          </div>

          <div className={`output-zone ${error ? 'has-error' : ''}`}>
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">OUTPUT</span>
                {uuidInfo && (
                  uuidInfo.isValid ? (
                    <span className="success-badge">Valid UUID ✓</span>
                  ) : (
                    <span className="error-badge">Invalid</span>
                  )
                )}
                {error && (
                  <span className="error-badge">
                    <AlertTriangle className="w-3 h-3" />
                    Error
                  </span>
                )}
              </div>
            </div>
            <div className="zone-output">
              {error ? (
                <span className="output-error">{error}</span>
              ) : uuidInfo ? (
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Normalized</span>
                    <code className="detail-value mono">{uuidInfo.uuid}</code>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Version</span>
                    <span className="detail-value">{uuidInfo.version || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Variant</span>
                    <span className="detail-value">{uuidInfo.variant}</span>
                  </div>
                  {uuidInfo.timestamp && (
                    <div className="detail-item full">
                      <span className="detail-label">Timestamp</span>
                      <span className="detail-value">{new Date(uuidInfo.timestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <span className="output-placeholder">Enter a UUID to analyze...</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bulk Mode */}
      {mode === 'bulk' && (
        <>
          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">OPTIONS</span>
              </div>
            </div>
            <div className="options-row">
              <label className="option-field">
                <span>Count</span>
                <input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={1000}
                  className="option-input"
                />
              </label>
              <button className="generate-btn" onClick={generateBulk} type="button">
                <Sparkles className="w-4 h-4" />
                Generate {bulkCount} UUIDs
              </button>
            </div>
          </div>

          {bulkUuids.length > 0 && (
            <div className="output-zone">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">{bulkUuids.length} UUIDS</span>
                  <span className="success-badge">Generated ✓</span>
                </div>
                <div className="zone-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleCopy(bulkUuids.join('\n'), 'bulk')}
                    title="Copy all"
                    type="button"
                  >
                    {copied === 'bulk' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button className="action-btn" onClick={downloadBulk} title="Download" type="button">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="zone-output">
                <pre className="bulk-list">
                  {bulkUuids.join('\n')}
                </pre>
              </div>
            </div>
          )}

          {bulkUuids.length === 0 && (
            <div className="output-zone">
              <div className="zone-header">
                <div className="zone-title">
                  <span className="zone-label">OUTPUT</span>
                </div>
              </div>
              <div className="zone-output">
                <span className="output-placeholder">Configure options and generate UUIDs...</span>
              </div>
            </div>
          )}
        </>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default UuidTool;
