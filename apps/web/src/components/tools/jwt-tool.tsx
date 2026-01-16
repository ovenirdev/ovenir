'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { autoResizeTextarea } from '@/hooks/useAutoResize';
import {
  Shield, ShieldAlert, ShieldCheck, Clock, AlertTriangle,
  Copy, Check, ChevronDown, ChevronRight, User, Building, Users,
  Calendar, Hash, Info, Timer, Fingerprint, Zap
} from 'lucide-react';

interface JwtClaim {
  key: string;
  value: unknown;
  type: 'standard' | 'registered' | 'custom';
  label: string;
  description: string;
  formattedValue?: string;
}

interface JwtSecurityIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  title: string;
  description: string;
}

interface JwtTimeline {
  issuedAt?: { timestamp: number; label: string; relative: string };
  notBefore?: { timestamp: number; label: string; relative: string };
  expiresAt?: { timestamp: number; label: string; relative: string };
  currentTime: { timestamp: number; label: string };
  status: 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry';
  remainingTime?: string;
  totalLifetime?: string;
  percentElapsed?: number;
}

interface JwtAnalysis {
  raw: string;
  parts: { header: string; payload: string; signature: string };
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  claims: JwtClaim[];
  securityIssues: JwtSecurityIssue[];
  timeline: JwtTimeline;
  size: { total: number; header: number; payload: number; signature: number };
}

interface JwtToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

const CLAIM_ICONS: Record<string, React.ReactNode> = {
  iss: <Building className="w-4 h-4" />,
  sub: <User className="w-4 h-4" />,
  aud: <Users className="w-4 h-4" />,
  exp: <Timer className="w-4 h-4" />,
  nbf: <Calendar className="w-4 h-4" />,
  iat: <Clock className="w-4 h-4" />,
  jti: <Fingerprint className="w-4 h-4" />,
};

export function JwtTool({ initialInput }: JwtToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [analysis, setAnalysis] = useState<JwtAnalysis | null>(null);
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['header', 'payload', 'security', 'timeline'])
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autoResizeTextarea(textareaRef.current, 3, 12);
  }, [input]);

  const processJwt = useCallback(async () => {
    if (!input.trim()) {
      setAnalysis(null);
      setError(null);
      return;
    }

    const { jwtTool } = await import('@ovenir/tools');
    const rawResult = jwtTool.run({ mode: 'decode', input });
    const result = await Promise.resolve(rawResult);

    if (result.success && result.analysis) {
      setAnalysis(result.analysis as JwtAnalysis);
      setError(null);
    } else if (result.error) {
      setError(result.error);
      setAnalysis(null);
    }
  }, [input]);

  useEffect(() => {
    const timer = setTimeout(processJwt, 150);
    return () => clearTimeout(timer);
  }, [processJwt]);

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const getSeverityIcon = (severity: JwtSecurityIssue['severity']) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="tool-container">
      {/* Zones Container */}
      <div className="tool-zones">
      {/* Input */}
      <div className={`input-zone ${error ? 'has-error' : ''}`}>
        <div className="zone-header">
          <div className="zone-title">
            <span className="zone-label">JWT TOKEN</span>
            {analysis && (
              <span className="auto-badge">
                <Zap className="w-3 h-3" />
                {analysis.size.total} chars
              </span>
            )}
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
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

      {/* Results */}
      {analysis && (
        <>
          {/* Status Banner */}
          <div className={`output-zone jwt-status-${analysis.timeline.status}`}>
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">STATUS</span>
                {analysis.timeline.status === 'valid' && (
                  <span className="success-badge"><ShieldCheck className="w-3 h-3" />Valid</span>
                )}
                {analysis.timeline.status === 'expired' && (
                  <span className="error-badge"><ShieldAlert className="w-3 h-3" />Expired</span>
                )}
                {analysis.timeline.status === 'not-yet-valid' && (
                  <span className="warning-badge"><Clock className="w-3 h-3" />Not Yet Valid</span>
                )}
                {analysis.timeline.status === 'no-expiry' && (
                  <span className="auto-badge"><Shield className="w-3 h-3" />No Expiry</span>
                )}
              </div>
            </div>
            <div className="zone-output">
              <div className="jwt-status-info">
                {analysis.timeline.remainingTime && analysis.timeline.status === 'valid' && (
                  <p>Expires in {analysis.timeline.remainingTime}</p>
                )}
                {analysis.timeline.percentElapsed !== undefined && (
                  <div className="jwt-lifetime-bar">
                    <div
                      className="jwt-lifetime-progress"
                      style={{ width: `${analysis.timeline.percentElapsed}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Issues */}
          {analysis.securityIssues.length > 0 && (
            <div className="output-zone">
              <button className="zone-header clickable" onClick={() => toggleSection('security')} type="button">
                <div className="zone-title">
                  {expandedSections.has('security') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="zone-label">SECURITY</span>
                  <span className="warning-badge">{analysis.securityIssues.length} issues</span>
                </div>
              </button>
              {expandedSections.has('security') && (
                <div className="zone-output">
                  <div className="jwt-security-list">
                    {analysis.securityIssues.map((issue) => (
                      <div key={issue.code} className={`jwt-security-item severity-${issue.severity}`}>
                        {getSeverityIcon(issue.severity)}
                        <div>
                          <strong>{issue.title}</strong>
                          <span>{issue.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div className="output-zone">
            <button className="zone-header clickable" onClick={() => toggleSection('header')} type="button">
              <div className="zone-title">
                {expandedSections.has('header') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="zone-label">HEADER</span>
                <span className="auto-badge">{analysis.size.header} chars</span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={(e) => { e.stopPropagation(); handleCopy(JSON.stringify(analysis.header, null, 2), 'header'); }}
                  title="Copy"
                  type="button"
                >
                  {copied === 'header' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </button>
            {expandedSections.has('header') && (
              <div className="zone-output">
                <pre className="json-output">{JSON.stringify(analysis.header, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Payload */}
          <div className="output-zone">
            <button className="zone-header clickable" onClick={() => toggleSection('payload')} type="button">
              <div className="zone-title">
                {expandedSections.has('payload') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="zone-label">PAYLOAD</span>
                <span className="auto-badge">{analysis.size.payload} chars</span>
              </div>
              <div className="zone-actions">
                <button
                  className="action-btn"
                  onClick={(e) => { e.stopPropagation(); handleCopy(JSON.stringify(analysis.payload, null, 2), 'payload'); }}
                  title="Copy"
                  type="button"
                >
                  {copied === 'payload' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </button>
            {expandedSections.has('payload') && (
              <div className="zone-output">
                {/* Claims Grid */}
                <div className="jwt-claims-grid">
                  {analysis.claims.map((claim) => (
                    <div key={claim.key} className={`jwt-claim claim-${claim.type}`}>
                      <div className="jwt-claim-header">
                        {CLAIM_ICONS[claim.key] || <Hash className="w-4 h-4" />}
                        <span className="jwt-claim-key">{claim.key}</span>
                        {claim.type === 'standard' && (
                          <span className="jwt-claim-type">standard</span>
                        )}
                      </div>
                      <div className="jwt-claim-value">
                        {claim.formattedValue || (
                          typeof claim.value === 'object'
                            ? JSON.stringify(claim.value)
                            : String(claim.value)
                        )}
                      </div>
                      {claim.type === 'standard' && (
                        <div className="jwt-claim-desc">{claim.description}</div>
                      )}
                      <button
                        className="jwt-claim-copy"
                        onClick={() => handleCopy(
                          typeof claim.value === 'object'
                            ? JSON.stringify(claim.value)
                            : String(claim.value),
                          `claim-${claim.key}`
                        )}
                        type="button"
                      >
                        {copied === `claim-${claim.key}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Raw JSON */}
                <pre className="json-output">{JSON.stringify(analysis.payload, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="output-zone">
            <button className="zone-header clickable" onClick={() => toggleSection('timeline')} type="button">
              <div className="zone-title">
                {expandedSections.has('timeline') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="zone-label">TIMELINE</span>
              </div>
            </button>
            {expandedSections.has('timeline') && (
              <div className="zone-output">
                <div className="jwt-timeline">
                  {analysis.timeline.issuedAt && (
                    <div className="jwt-timeline-item">
                      <div className="jwt-timeline-dot" />
                      <div className="jwt-timeline-content">
                        <span className="jwt-timeline-label">Issued</span>
                        <span className="jwt-timeline-value">{analysis.timeline.issuedAt.label}</span>
                        <span className="jwt-timeline-relative">{analysis.timeline.issuedAt.relative}</span>
                      </div>
                    </div>
                  )}

                  {analysis.timeline.notBefore && (
                    <div className="jwt-timeline-item">
                      <div className="jwt-timeline-dot" />
                      <div className="jwt-timeline-content">
                        <span className="jwt-timeline-label">Valid From</span>
                        <span className="jwt-timeline-value">{analysis.timeline.notBefore.label}</span>
                        <span className="jwt-timeline-relative">{analysis.timeline.notBefore.relative}</span>
                      </div>
                    </div>
                  )}

                  <div className="jwt-timeline-item jwt-timeline-now">
                    <div className="jwt-timeline-dot active" />
                    <div className="jwt-timeline-content">
                      <span className="jwt-timeline-label">Now</span>
                      <span className="jwt-timeline-value">{analysis.timeline.currentTime.label}</span>
                    </div>
                  </div>

                  {analysis.timeline.expiresAt && (
                    <div className={`jwt-timeline-item ${analysis.timeline.status === 'expired' ? 'expired' : ''}`}>
                      <div className="jwt-timeline-dot" />
                      <div className="jwt-timeline-content">
                        <span className="jwt-timeline-label">Expires</span>
                        <span className="jwt-timeline-value">{analysis.timeline.expiresAt.label}</span>
                        <span className="jwt-timeline-relative">{analysis.timeline.expiresAt.relative}</span>
                      </div>
                    </div>
                  )}

                  {analysis.timeline.totalLifetime && (
                    <div className="jwt-timeline-summary">
                      <span>Total lifetime: {analysis.timeline.totalLifetime}</span>
                      {analysis.timeline.status === 'valid' && analysis.timeline.remainingTime && (
                        <span>Remaining: {analysis.timeline.remainingTime}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Signature */}
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">SIGNATURE</span>
                <span className="auto-badge">{analysis.size.signature} chars</span>
              </div>
            </div>
            <div className="zone-output">
              <div className="jwt-signature-note">
                <Info className="w-4 h-4" />
                <span>
                  Signature verification requires the secret key.
                  Algorithm: <strong>{String(analysis.header.alg || 'unknown')}</strong>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!analysis && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">Paste a JWT token above to decode and analyze it...</span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default JwtTool;
