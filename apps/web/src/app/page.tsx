'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectFormat, type DetectionResult } from '@ovenir/core';
import {
  Braces, Binary, KeyRound, Link, Link2, Hash, Fingerprint, Clock, Palette,
  Search, GitCompare, FileJson, FileText, Code, Database,
  AlignLeft, QrCode, KeySquare, CalendarClock, Sparkles,
  ArrowRight, Wand2, FileCode, Zap, LayoutGrid, Lock, Globe, Type,
  Star, Eye, Scan
} from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { FavoritesSection } from '@/components/favorites-section';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  json: Braces, base64: Binary, jwt: KeyRound, url: Link, hash: Hash,
  uuid: Fingerprint, timestamp: Clock, color: Palette, regex: Search,
  diff: GitCompare, yaml: FileJson, xml: FileCode, markdown: FileText,
  html: Code, sql: Database, lorem: AlignLeft, qrcode: QrCode,
  password: KeySquare, cron: CalendarClock, slug: Link2,
};

const QUICK_TOOLS = [
  { id: 'json', name: 'JSON', desc: 'Format & validate' },
  { id: 'base64', name: 'Base64', desc: 'Encode & decode' },
  { id: 'jwt', name: 'JWT', desc: 'Decode tokens' },
  { id: 'url', name: 'URL', desc: 'Parse & encode' },
  { id: 'hash', name: 'Hash', desc: 'Generate hashes' },
  { id: 'uuid', name: 'UUID', desc: 'Generate IDs' },
];

const TOOLS = [
  { id: 'json', name: 'JSON Format', desc: 'Parse, validate & beautify JSON data', cat: 'data', size: 'lg' },
  { id: 'base64', name: 'Base64', desc: 'Encode and decode Base64 strings', cat: 'encoding', size: 'md' },
  { id: 'jwt', name: 'JWT Decoder', desc: 'Inspect and validate JWT tokens', cat: 'crypto', size: 'md' },
  { id: 'url', name: 'URL Parser', desc: 'Parse, encode & decode URLs', cat: 'web', size: 'sm' },
  { id: 'hash', name: 'Hash Generator', desc: 'MD5, SHA-1, SHA-256 hashing', cat: 'crypto', size: 'sm' },
  { id: 'uuid', name: 'UUID Generator', desc: 'Generate UUID v4 identifiers', cat: 'id', size: 'sm' },
  { id: 'timestamp', name: 'Timestamp', desc: 'Convert Unix timestamps to dates', cat: 'time', size: 'md' },
  { id: 'color', name: 'Color Picker', desc: 'Convert HEX, RGB, HSL colors', cat: 'web', size: 'sm' },
  { id: 'regex', name: 'Regex Tester', desc: 'Test regular expressions live', cat: 'text', size: 'md' },
  { id: 'diff', name: 'Text Diff', desc: 'Compare two texts side by side', cat: 'text', size: 'md' },
  { id: 'yaml', name: 'YAML ↔ JSON', desc: 'Convert between YAML and JSON', cat: 'data', size: 'sm' },
  { id: 'xml', name: 'XML Format', desc: 'Format and validate XML', cat: 'data', size: 'sm' },
  { id: 'markdown', name: 'Markdown', desc: 'Preview and convert Markdown', cat: 'text', size: 'sm' },
  { id: 'html', name: 'HTML Entities', desc: 'Encode & decode HTML entities', cat: 'web', size: 'sm' },
  { id: 'sql', name: 'SQL Format', desc: 'Format SQL queries beautifully', cat: 'data', size: 'sm' },
  { id: 'qrcode', name: 'QR Code', desc: 'Generate QR codes from text', cat: 'encoding', size: 'sm' },
  { id: 'password', name: 'Password Gen', desc: 'Generate secure passwords', cat: 'crypto', size: 'sm' },
  { id: 'cron', name: 'Cron Parser', desc: 'Parse cron expressions', cat: 'time', size: 'sm' },
  { id: 'slug', name: 'Slug Generator', desc: 'Generate URL-friendly slugs', cat: 'text', size: 'sm' },
];

const CATEGORIES = [
  { id: 'all', name: 'All tools', icon: LayoutGrid },
  { id: 'encoding', name: 'Encoding', icon: Binary },
  { id: 'data', name: 'Data', icon: Database },
  { id: 'crypto', name: 'Crypto', icon: Lock },
  { id: 'web', name: 'Web', icon: Globe },
  { id: 'text', name: 'Text', icon: Type },
  { id: 'time', name: 'Time', icon: Clock },
];

const PATTERN_TO_ACTIONS: Record<string, { toolId: string; mode: string; label: string }[]> = {
  base64: [
    { toolId: 'base64', mode: 'decode', label: 'Decode' },
    { toolId: 'base64', mode: 'encode', label: 'Encode' },
  ],
  json: [
    { toolId: 'json', mode: 'format', label: 'Format' },
    { toolId: 'json', mode: 'minify', label: 'Minify' },
  ],
  jwt: [
    { toolId: 'jwt', mode: 'decode', label: 'Decode' },
    { toolId: 'jwt', mode: 'inspect', label: 'Inspect' },
  ],
  url: [
    { toolId: 'url', mode: 'parse', label: 'Parse' },
    { toolId: 'url', mode: 'decode', label: 'Decode' },
  ],
  uuid: [
    { toolId: 'uuid', mode: 'validate', label: 'Validate' },
  ],
  timestamp: [
    { toolId: 'timestamp', mode: 'convert', label: 'Convert' },
  ],
};

export default function Home() {
  const [value, setValue] = useState('');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [cat, setCat] = useState('all');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [animatingStar, setAnimatingStar] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { favorites, toggleFavorite, isFavorite, removeFavorite, isLoaded } = useFavorites();

  // Handle favorite toggle with animation
  const handleToggleFavorite = useCallback((e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isFavorite(toolId)) {
      setAnimatingStar(toolId);
      setTimeout(() => setAnimatingStar(null), 600);
    }

    toggleFavorite(toolId);
  }, [toggleFavorite, isFavorite]);

  // Map tools for favorites section
  const toolsForFavorites = TOOLS.map(t => ({
    id: t.id,
    name: t.name,
    description: t.desc,
    icon: ICONS[t.id]?.name || 'Sparkles',
  }));

  // Compute preview based on detected format
  const computePreview = useCallback((text: string, patternId: string): string | null => {
    try {
      switch (patternId) {
        case 'base64':
          return atob(text.trim()).slice(0, 100) + (atob(text.trim()).length > 100 ? '...' : '');
        case 'json':
          return JSON.stringify(JSON.parse(text), null, 2).slice(0, 150) + '...';
        case 'jwt':
          const parts = text.trim().split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            return JSON.stringify(payload, null, 2).slice(0, 150) + '...';
          }
          return null;
        case 'url':
          const url = new URL(text.trim());
          return `Host: ${url.hostname}\nPath: ${url.pathname}${url.search ? '\nQuery: ' + url.search : ''}`;
        case 'timestamp':
          const ts = parseInt(text.trim());
          const date = new Date(ts < 1e12 ? ts * 1000 : ts);
          return date.toLocaleString();
        default:
          return null;
      }
    } catch {
      return null;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValue(v);

    // Trigger scanning animation
    setIsScanning(true);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);

    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
      if (v.trim()) {
        const result = detectFormat(v);
        setDetection(result);
        // Compute preview for best match
        if (result?.bestMatch) {
          setPreview(computePreview(v, result.bestMatch.pattern.id));
        } else {
          setPreview(null);
        }
      } else {
        setDetection(null);
        setPreview(null);
      }
    }, 150);
  }, [computePreview]);

  const focus = useCallback(() => inputRef.current?.focus(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeBtn = nav.querySelector(`[data-cat="${cat}"]`) as HTMLButtonElement;
    if (activeBtn) {
      const navRect = nav.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
      });
    }
  }, [cat]);

  const getToolCount = (catId: string) => {
    if (catId === 'all') return TOOLS.length;
    return TOOLS.filter(t => t.cat === catId).length;
  };

  const tools = cat === 'all' ? TOOLS : TOOLS.filter(t => t.cat === cat);

  const getIcon = (id: string, className = "w-6 h-6") => {
    const Icon = ICONS[id] || Braces;
    return <Icon className={className} />;
  };

  const handleToolClick = (toolId: string) => {
    router.push(`/tools/${toolId}`);
  };

  const handleActionClick = (toolId: string, mode: string) => {
    const params = new URLSearchParams();
    if (value) params.set('input', encodeURIComponent(value));
    params.set('mode', mode);
    router.push(`/tools/${toolId}?${params.toString()}`);
  };

  const getActionsForPattern = (patternId: string) => {
    return PATTERN_TO_ACTIONS[patternId] ?? [];
  };

  return (
    <>
      {/* Background */}
      <div className="bg-wrap">
        <div className="bg-base" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
        <div className="bg-orb bg-orb-4" />
        <div className="bg-mesh" />
        <div className="bg-noise" />
      </div>

      <div className="app">
        <main className="layout">
          {/* Left Panel */}
          <aside className="panel-left">
            {/* Brand */}
            <header className="brand">
              <div className="brand-mark">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="brand-name">OVENIR</span>
              <span className="brand-tag">Beta</span>
            </header>

            {/* Hero */}
            <div className="hero">
              <h1>Developer tools.<br /><span className="text-glow">Instant.</span></h1>
              <p>Paste anything. We detect and transform. <strong>100% local.</strong></p>
            </div>

            {/* Input */}
            <div
              className={`glass-card input-card ${isFocused ? 'focused' : ''} ${isScanning ? 'scanning' : ''} ${value ? 'has-content' : ''}`}
              onClick={focus}
            >

              <div className="input-header">
                <div className={`input-status ${isScanning ? 'scanning' : detection?.bestMatch ? 'detected' : ''}`}>
                  {isScanning ? (
                    <Scan className="w-4 h-4 scanning-icon" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </div>
                <span>{isScanning ? 'Analyzing...' : 'Paste anything...'}</span>
                <kbd>⌘K</kbd>
              </div>

              <div className="input-body">
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder='{"name": "OVENIR", "version": "1.0"}'
                  spellCheck={false}
                />
              </div>

              {/* Scanning line effect */}
              {isScanning && <div className="scan-line" />}
            </div>

            {/* Detection */}
            {detection?.bestMatch && (
              <div className="glass-card result-card detected">
                {/* Confidence bar */}
                <div
                  className="confidence-bar"
                  style={{ '--confidence': `${detection.bestMatch.confidence}%` } as React.CSSProperties}
                />

                <div className="result-header">
                  <div className="result-icon pulse">
                    {getIcon(detection.bestMatch.pattern.id, "w-6 h-6")}
                  </div>
                  <div className="result-meta">
                    <strong>{detection.bestMatch.pattern.name}</strong>
                    <span>{detection.bestMatch.pattern.description}</span>
                  </div>
                  <div className="result-score">
                    <span className="score-value">{detection.bestMatch.confidence}</span>
                    <span className="score-percent">%</span>
                  </div>
                </div>

                {/* Live Preview */}
                {preview && (
                  <div className="result-preview">
                    <div className="preview-header">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </div>
                    <pre className="preview-content">{preview}</pre>
                  </div>
                )}

                <div className="result-actions">
                  {getActionsForPattern(detection.bestMatch.pattern.id).map((action, index) => (
                    <button
                      key={`${action.toolId}-${action.mode}`}
                      className="btn-action"
                      style={{ '--delay': `${index * 50}ms` } as React.CSSProperties}
                      onClick={() => handleActionClick(action.toolId, action.mode)}
                    >
                      {action.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Tools */}
            <div className="quick-section">
              <div className="section-header">
                <Zap className="w-4 h-4" />
                <span>Quick access</span>
              </div>
              <div className="quick-grid">
                {QUICK_TOOLS.map(t => (
                  <button
                    key={t.id}
                    className="glass-card quick-btn"
                    onClick={() => handleToolClick(t.id)}
                  >
                    {getIcon(t.id, "w-5 h-5")}
                    <span className="quick-name">{t.name}</span>
                    <span className="quick-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Panel */}
          <section className="panel-right">
            {/* Categories */}
            <nav className="cats-wrapper" ref={navRef}>
              <div
                className="cats-indicator"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width
                }}
              />
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const count = getToolCount(c.id);
                return (
                  <button
                    key={c.id}
                    data-cat={c.id}
                    onClick={() => setCat(c.id)}
                    className={`cat-btn ${cat === c.id ? 'active' : ''}`}
                  >
                    <Icon className="cat-icon" />
                    <span className="cat-name">{c.name}</span>
                    <span className="cat-count">{count}</span>
                  </button>
                );
              })}
            </nav>

            {/* Favorites Section */}
            {isLoaded && (
              <FavoritesSection
                favorites={favorites}
                tools={toolsForFavorites}
                onRemove={removeFavorite}
              />
            )}

            {/* Bento Grid */}
            <div className="bento">
              {tools.map((t, i) => (
                <article
                  key={t.id}
                  className={`glass-card cell cell-${t.size}`}
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => handleToolClick(t.id)}
                >
                  {/* Favorite Button */}
                  <button
                    className={`star-btn ${isFavorite(t.id) ? 'active' : ''} ${animatingStar === t.id ? 'animating' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, t.id)}
                    title={isFavorite(t.id) ? 'Remove from favorites' : 'Add to favorites'}
                    type="button"
                  >
                    <Star
                      className="w-4 h-4"
                      fill={isFavorite(t.id) ? 'currentColor' : 'none'}
                    />
                    {/* Particles */}
                    <div className="star-particles">
                      {[...Array(8)].map((_, j) => (
                        <span key={j} className="star-particle" />
                      ))}
                    </div>
                  </button>

                  <div className="cell-icon">{getIcon(t.id, t.size === 'lg' ? 'w-10 h-10' : 'w-7 h-7')}</div>
                  <h3 className="cell-name">{t.name}</h3>
                  <p className="cell-desc">{t.desc}</p>
                </article>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <span>🔒 100% local</span>
          <span>•</span>
          <span>Privacy-first</span>
          <span>•</span>
          <span>Open source</span>
        </footer>
      </div>
    </>
  );
}
