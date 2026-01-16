'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Fingerprint, Copy, Check, RefreshCw, Sparkles, Clock,
  Hash, Shield, AlertCircle, Download, ChevronDown, ChevronUp
} from 'lucide-react';

// Types
interface UuidInfo {
  uuid: string;
  version: number | null;
  variant: string;
  isValid: boolean;
  isNil: boolean;
  timestamp?: string;
  clockSeq?: number;
  node?: string;
  randomBits?: string;
}

interface UuidToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'generate' | 'parse' | 'bulk';
type Version = 'v1' | 'v4' | 'v7';

const VERSION_INFO: Record<Version, { name: string; color: string; desc: string }> = {
  v1: {
    name: 'Version 1',
    color: '#3B82F6',
    desc: 'Time-based with node ID',
  },
  v4: {
    name: 'Version 4',
    color: '#10B981',
    desc: 'Random (most common)',
  },
  v7: {
    name: 'Version 7',
    color: '#8B5CF6',
    desc: 'Unix timestamp + random (new standard)',
  },
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
  const [showDetails, setShowDetails] = useState(true);

  // Generate single UUID
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

  // Parse UUID
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

  // Generate bulk UUIDs
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

  // Initial generation
  useEffect(() => {
    if (mode === 'generate') {
      generateSingle();
    }
  }, [mode]);

  // Parse on input change
  useEffect(() => {
    if (mode === 'parse') {
      const timer = setTimeout(parseUuid, 150);
      return () => clearTimeout(timer);
    }
  }, [parseInput, mode, parseUuid]);

  // Copy handler
  const handleCopy = useCallback(async (text: string, id: string = 'uuid') => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Download bulk
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
    <div className="uuid-tool">
      {/* Mode Toggle */}
      <div className="uuid-modes">
        <button
          className={`uuid-mode-btn ${mode === 'generate' ? 'active' : ''}`}
          onClick={() => setMode('generate')}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate</span>
        </button>
        <button
          className={`uuid-mode-btn ${mode === 'parse' ? 'active' : ''}`}
          onClick={() => setMode('parse')}
        >
          <Shield className="w-4 h-4" />
          <span>Parse</span>
        </button>
        <button
          className={`uuid-mode-btn ${mode === 'bulk' ? 'active' : ''}`}
          onClick={() => setMode('bulk')}
        >
          <Hash className="w-4 h-4" />
          <span>Bulk</span>
        </button>
      </div>

      {/* Generate Mode */}
      {mode === 'generate' && (
        <>
          {/* Version Selector */}
          <div className="uuid-version-selector">
            {(Object.keys(VERSION_INFO) as Version[]).map((v) => (
              <button
                key={v}
                className={`uuid-version-btn ${version === v ? 'active' : ''}`}
                onClick={() => { setVersion(v); }}
                style={{ '--version-color': VERSION_INFO[v].color } as React.CSSProperties}
              >
                <span className="uuid-version-name">{VERSION_INFO[v].name}</span>
                <span className="uuid-version-desc">{VERSION_INFO[v].desc}</span>
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="uuid-options">
            <label className="uuid-option">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
              />
              <span>UPPERCASE</span>
            </label>
            <label className="uuid-option">
              <input
                type="checkbox"
                checked={noDashes}
                onChange={(e) => setNoDashes(e.target.checked)}
              />
              <span>No dashes</span>
            </label>
          </div>

          {/* Generated UUID */}
          {generatedUuid && (
            <div className="uuid-result">
              <div className="uuid-result-header">
                <Fingerprint className="w-5 h-5" />
                <span>Generated UUID</span>
                <div className="uuid-result-actions">
                  <button
                    className="uuid-action-btn"
                    onClick={() => handleCopy(generatedUuid)}
                  >
                    {copied === 'uuid' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied === 'uuid' ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    className="uuid-action-btn primary"
                    onClick={generateSingle}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate New
                  </button>
                </div>
              </div>
              <code className="uuid-value">{generatedUuid}</code>
            </div>
          )}

          {/* UUID Info */}
          {uuidInfo && (
            <div className="uuid-info-card">
              <button
                className="uuid-info-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span>UUID Details</span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showDetails && (
                <div className="uuid-info-grid">
                  <div className="uuid-info-item">
                    <span className="uuid-info-label">Version</span>
                    <span
                      className="uuid-info-value version-badge"
                      style={{ background: VERSION_INFO[version].color }}
                    >
                      {uuidInfo.version}
                    </span>
                  </div>
                  <div className="uuid-info-item">
                    <span className="uuid-info-label">Variant</span>
                    <span className="uuid-info-value">{uuidInfo.variant}</span>
                  </div>
                  {uuidInfo.timestamp && (
                    <div className="uuid-info-item full">
                      <span className="uuid-info-label">
                        <Clock className="w-3.5 h-3.5" />
                        Timestamp
                      </span>
                      <span className="uuid-info-value">
                        {new Date(uuidInfo.timestamp).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {uuidInfo.node && (
                    <div className="uuid-info-item">
                      <span className="uuid-info-label">Node</span>
                      <code className="uuid-info-value">{uuidInfo.node}</code>
                    </div>
                  )}
                  {uuidInfo.clockSeq !== undefined && (
                    <div className="uuid-info-item">
                      <span className="uuid-info-label">Clock Seq</span>
                      <code className="uuid-info-value">{uuidInfo.clockSeq}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Parse Mode */}
      {mode === 'parse' && (
        <>
          <div className="uuid-input-section">
            <div className="uuid-input-header">
              <Fingerprint className="w-4 h-4" />
              <span>UUID to Parse</span>
            </div>
            <input
              type="text"
              value={parseInput}
              onChange={(e) => setParseInput(e.target.value)}
              placeholder="Enter UUID (e.g., 550e8400-e29b-41d4-a716-446655440000)"
              className="uuid-parse-input"
              spellCheck={false}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="uuid-error">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Parse Result */}
          {uuidInfo && (
            <div className={`uuid-parse-result ${uuidInfo.isValid ? 'valid' : 'invalid'}`}>
              <div className="uuid-parse-status">
                {uuidInfo.isValid ? (
                  <>
                    <Shield className="w-6 h-6 text-green" />
                    <div className="uuid-parse-text">
                      <strong>Valid UUID</strong>
                      <span>
                        {uuidInfo.isNil
                          ? 'This is the nil UUID'
                          : `Version ${uuidInfo.version} • ${uuidInfo.variant}`}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6" />
                    <div className="uuid-parse-text">
                      <strong>Invalid UUID</strong>
                      <span>The input is not a valid UUID format</span>
                    </div>
                  </>
                )}
              </div>

              {uuidInfo.isValid && !uuidInfo.isNil && (
                <div className="uuid-info-grid">
                  <div className="uuid-info-item">
                    <span className="uuid-info-label">Normalized</span>
                    <code className="uuid-info-value clickable" onClick={() => handleCopy(uuidInfo.uuid, 'normalized')}>
                      {uuidInfo.uuid}
                      {copied === 'normalized' && <Check className="w-3 h-3 inline ml-2" />}
                    </code>
                  </div>
                  <div className="uuid-info-item">
                    <span className="uuid-info-label">Version</span>
                    <span className="uuid-info-value">{uuidInfo.version}</span>
                  </div>
                  <div className="uuid-info-item">
                    <span className="uuid-info-label">Variant</span>
                    <span className="uuid-info-value">{uuidInfo.variant}</span>
                  </div>
                  {uuidInfo.timestamp && (
                    <div className="uuid-info-item full">
                      <span className="uuid-info-label">
                        <Clock className="w-3.5 h-3.5" />
                        Embedded Timestamp
                      </span>
                      <span className="uuid-info-value">
                        {new Date(uuidInfo.timestamp).toLocaleString()} ({new Date(uuidInfo.timestamp).toISOString()})
                      </span>
                    </div>
                  )}
                  {uuidInfo.node && (
                    <div className="uuid-info-item">
                      <span className="uuid-info-label">Node ID</span>
                      <code className="uuid-info-value">{uuidInfo.node}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!parseInput && !error && !uuidInfo && (
            <div className="uuid-empty">
              <Fingerprint className="w-12 h-12" />
              <h3>UUID Parser</h3>
              <p>Enter a UUID above to analyze its version, variant, and embedded data</p>
            </div>
          )}
        </>
      )}

      {/* Bulk Mode */}
      {mode === 'bulk' && (
        <>
          {/* Bulk Options */}
          <div className="uuid-bulk-options">
            <div className="uuid-bulk-row">
              <div className="uuid-bulk-field">
                <label>Version</label>
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value as Version)}
                  className="uuid-select"
                >
                  <option value="v1">Version 1 (Time-based)</option>
                  <option value="v4">Version 4 (Random)</option>
                  <option value="v7">Version 7 (Unix + Random)</option>
                </select>
              </div>
              <div className="uuid-bulk-field">
                <label>Count</label>
                <input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  min={1}
                  max={1000}
                  className="uuid-count-input"
                />
              </div>
            </div>

            <div className="uuid-bulk-row">
              <label className="uuid-option">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                />
                <span>UPPERCASE</span>
              </label>
              <label className="uuid-option">
                <input
                  type="checkbox"
                  checked={noDashes}
                  onChange={(e) => setNoDashes(e.target.checked)}
                />
                <span>No dashes</span>
              </label>
            </div>

            <button className="uuid-generate-btn" onClick={generateBulk}>
              <Sparkles className="w-4 h-4" />
              Generate {bulkCount} UUIDs
            </button>
          </div>

          {/* Bulk Results */}
          {bulkUuids.length > 0 && (
            <div className="uuid-bulk-result">
              <div className="uuid-bulk-header">
                <span>{bulkUuids.length} UUIDs Generated</span>
                <div className="uuid-bulk-actions">
                  <button
                    className="uuid-action-btn"
                    onClick={() => handleCopy(bulkUuids.join('\n'), 'bulk')}
                  >
                    {copied === 'bulk' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied === 'bulk' ? 'Copied!' : 'Copy All'}
                  </button>
                  <button className="uuid-action-btn" onClick={downloadBulk}>
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>
              <div className="uuid-bulk-list">
                {bulkUuids.map((uuid, i) => (
                  <code
                    key={i}
                    className="uuid-bulk-item"
                    onClick={() => handleCopy(uuid, `bulk-${i}`)}
                  >
                    {uuid}
                    {copied === `bulk-${i}` && (
                      <Check className="w-3 h-3 copied-icon" />
                    )}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {bulkUuids.length === 0 && (
            <div className="uuid-empty">
              <Hash className="w-12 h-12" />
              <h3>Bulk Generator</h3>
              <p>Configure options above and generate multiple UUIDs at once</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UuidTool;
