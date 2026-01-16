'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  KeyRound, Shield, ShieldAlert, ShieldCheck, Clock, AlertTriangle,
  Copy, Check, ChevronDown, ChevronRight, User, Building, Users,
  Calendar, Hash, Info, AlertCircle, Timer, Fingerprint, Eye, EyeOff
} from 'lucide-react';

// Types
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

// Claim icons
const CLAIM_ICONS: Record<string, React.ReactNode> = {
  iss: <Building className="w-4 h-4" />,
  sub: <User className="w-4 h-4" />,
  aud: <Users className="w-4 h-4" />,
  exp: <Timer className="w-4 h-4" />,
  nbf: <Calendar className="w-4 h-4" />,
  iat: <Clock className="w-4 h-4" />,
  jti: <Fingerprint className="w-4 h-4" />,
};

export function JwtTool({ slug, initialInput, initialMode }: JwtToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [analysis, setAnalysis] = useState<JwtAnalysis | null>(null);
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['header', 'payload', 'security', 'timeline'])
  );

  // Process JWT
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

  // Copy handler
  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Toggle section
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

  // Get status color
  const getStatusColor = (status: JwtTimeline['status']) => {
    switch (status) {
      case 'valid': return 'var(--color-success)';
      case 'expired': return 'var(--color-error)';
      case 'not-yet-valid': return 'var(--color-warning)';
      default: return 'var(--color-text-secondary)';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: JwtSecurityIssue['severity']) => {
    switch (severity) {
      case 'critical': return <ShieldAlert className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="jwt-tool">
      {/* Input Section */}
      <div className="jwt-input-section">
        <div className="jwt-input-header">
          <KeyRound className="w-5 h-5" />
          <span>Paste JWT Token</span>
          {analysis && (
            <button
              className="jwt-raw-toggle"
              onClick={() => setShowRaw(!showRaw)}
            >
              {showRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showRaw ? 'Hide raw' : 'Show raw'}
            </button>
          )}
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="jwt-input"
          spellCheck={false}
        />

        {/* Raw token display with color coding */}
        {showRaw && analysis && (
          <div className="jwt-raw-display">
            <span className="jwt-part jwt-header">{analysis.parts.header}</span>
            <span className="jwt-dot">.</span>
            <span className="jwt-part jwt-payload">{analysis.parts.payload}</span>
            <span className="jwt-dot">.</span>
            <span className="jwt-part jwt-signature">{analysis.parts.signature}</span>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="jwt-error">
          <AlertCircle className="w-5 h-5" />
          <div className="jwt-error-content">
            <strong>{error.message}</strong>
            {error.suggestion && <span>{error.suggestion}</span>}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="jwt-results">
          {/* Status Banner */}
          <div
            className={`jwt-status-banner jwt-status-${analysis.timeline.status}`}
            style={{ '--status-color': getStatusColor(analysis.timeline.status) } as React.CSSProperties}
          >
            {analysis.timeline.status === 'valid' && <ShieldCheck className="w-5 h-5" />}
            {analysis.timeline.status === 'expired' && <ShieldAlert className="w-5 h-5" />}
            {analysis.timeline.status === 'not-yet-valid' && <Clock className="w-5 h-5" />}
            {analysis.timeline.status === 'no-expiry' && <Shield className="w-5 h-5" />}

            <div className="jwt-status-text">
              <strong>
                {analysis.timeline.status === 'valid' && 'Token Valid'}
                {analysis.timeline.status === 'expired' && 'Token Expired'}
                {analysis.timeline.status === 'not-yet-valid' && 'Not Yet Valid'}
                {analysis.timeline.status === 'no-expiry' && 'No Expiration'}
              </strong>
              {analysis.timeline.remainingTime && analysis.timeline.status === 'valid' && (
                <span>Expires in {analysis.timeline.remainingTime}</span>
              )}
            </div>

            {analysis.timeline.percentElapsed !== undefined && (
              <div className="jwt-lifetime-bar">
                <div
                  className="jwt-lifetime-progress"
                  style={{ width: `${analysis.timeline.percentElapsed}%` }}
                />
              </div>
            )}
          </div>

          {/* Security Issues */}
          {analysis.securityIssues.length > 0 && (
            <div className="jwt-section">
              <button
                className="jwt-section-header"
                onClick={() => toggleSection('security')}
              >
                {expandedSections.has('security') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Shield className="w-4 h-4" />
                <span>Security Analysis</span>
                <span className="jwt-badge">{analysis.securityIssues.length}</span>
              </button>

              {expandedSections.has('security') && (
                <div className="jwt-security-list">
                  {analysis.securityIssues.map((issue) => (
                    <div key={issue.code} className={`jwt-security-item jwt-severity-${issue.severity}`}>
                      {getSeverityIcon(issue.severity)}
                      <div className="jwt-security-content">
                        <strong>{issue.title}</strong>
                        <span>{issue.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Header Section */}
          <div className="jwt-section">
            <button
              className="jwt-section-header"
              onClick={() => toggleSection('header')}
            >
              {expandedSections.has('header') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Hash className="w-4 h-4" />
              <span>Header</span>
              <span className="jwt-size">{analysis.size.header} chars</span>
            </button>

            {expandedSections.has('header') && (
              <div className="jwt-json-block">
                <button
                  className="jwt-copy-btn"
                  onClick={() => handleCopy(JSON.stringify(analysis.header, null, 2), 'header')}
                >
                  {copied === 'header' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <pre>{JSON.stringify(analysis.header, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Payload Section */}
          <div className="jwt-section">
            <button
              className="jwt-section-header"
              onClick={() => toggleSection('payload')}
            >
              {expandedSections.has('payload') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <KeyRound className="w-4 h-4" />
              <span>Payload</span>
              <span className="jwt-size">{analysis.size.payload} chars</span>
            </button>

            {expandedSections.has('payload') && (
              <>
                {/* Claims Grid */}
                <div className="jwt-claims-grid">
                  {analysis.claims.map((claim) => (
                    <div
                      key={claim.key}
                      className={`jwt-claim jwt-claim-${claim.type}`}
                    >
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
                      >
                        {copied === `claim-${claim.key}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Raw JSON */}
                <div className="jwt-json-block">
                  <button
                    className="jwt-copy-btn"
                    onClick={() => handleCopy(JSON.stringify(analysis.payload, null, 2), 'payload')}
                  >
                    {copied === 'payload' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <pre>{JSON.stringify(analysis.payload, null, 2)}</pre>
                </div>
              </>
            )}
          </div>

          {/* Timeline Section */}
          <div className="jwt-section">
            <button
              className="jwt-section-header"
              onClick={() => toggleSection('timeline')}
            >
              {expandedSections.has('timeline') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>

            {expandedSections.has('timeline') && (
              <div className="jwt-timeline">
                {analysis.timeline.issuedAt && (
                  <div className="jwt-timeline-item jwt-timeline-iat">
                    <div className="jwt-timeline-dot" />
                    <div className="jwt-timeline-content">
                      <span className="jwt-timeline-label">Issued</span>
                      <span className="jwt-timeline-value">{analysis.timeline.issuedAt.label}</span>
                      <span className="jwt-timeline-relative">{analysis.timeline.issuedAt.relative}</span>
                    </div>
                  </div>
                )}

                {analysis.timeline.notBefore && (
                  <div className="jwt-timeline-item jwt-timeline-nbf">
                    <div className="jwt-timeline-dot" />
                    <div className="jwt-timeline-content">
                      <span className="jwt-timeline-label">Valid From</span>
                      <span className="jwt-timeline-value">{analysis.timeline.notBefore.label}</span>
                      <span className="jwt-timeline-relative">{analysis.timeline.notBefore.relative}</span>
                    </div>
                  </div>
                )}

                <div className="jwt-timeline-item jwt-timeline-now">
                  <div className="jwt-timeline-dot jwt-timeline-dot-now" />
                  <div className="jwt-timeline-content">
                    <span className="jwt-timeline-label">Now</span>
                    <span className="jwt-timeline-value">{analysis.timeline.currentTime.label}</span>
                  </div>
                </div>

                {analysis.timeline.expiresAt && (
                  <div className={`jwt-timeline-item jwt-timeline-exp ${analysis.timeline.status === 'expired' ? 'expired' : ''}`}>
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
            )}
          </div>

          {/* Signature Section */}
          <div className="jwt-section jwt-signature-section">
            <div className="jwt-section-header">
              <Shield className="w-4 h-4" />
              <span>Signature</span>
              <span className="jwt-size">{analysis.size.signature} chars</span>
            </div>
            <div className="jwt-signature-note">
              <Info className="w-4 h-4" />
              <span>
                Signature verification requires the secret key.
                Algorithm: <strong>{String(analysis.header.alg || 'unknown')}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !error && (
        <div className="jwt-empty">
          <KeyRound className="w-12 h-12" />
          <h3>Decode JWT Token</h3>
          <p>Paste a JSON Web Token above to decode and analyze it.</p>
          <div className="jwt-features">
            <div className="jwt-feature">
              <ShieldCheck className="w-5 h-5" />
              <span>Security Analysis</span>
            </div>
            <div className="jwt-feature">
              <Clock className="w-5 h-5" />
              <span>Expiration Timeline</span>
            </div>
            <div className="jwt-feature">
              <Hash className="w-5 h-5" />
              <span>Claims Breakdown</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JwtTool;
