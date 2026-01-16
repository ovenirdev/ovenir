'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Star, X, Braces, Binary, KeyRound, Link as LinkIcon, Hash,
  Fingerprint, Clock, Palette, Search, GitCompare, FileJson,
  FileText, Code, Database, AlignLeft, QrCode, KeySquare,
  CalendarClock, Sparkles
} from 'lucide-react';

interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface FavoritesSectionProps {
  favorites: string[];
  tools: FavoriteItem[];
  onRemove: (id: string) => void;
}

// Icon mapping by tool ID
const TOOL_ICONS: Record<string, React.ReactNode> = {
  json: <Braces className="w-5 h-5" />,
  base64: <Binary className="w-5 h-5" />,
  jwt: <KeyRound className="w-5 h-5" />,
  url: <LinkIcon className="w-5 h-5" />,
  hash: <Hash className="w-5 h-5" />,
  uuid: <Fingerprint className="w-5 h-5" />,
  timestamp: <Clock className="w-5 h-5" />,
  color: <Palette className="w-5 h-5" />,
  regex: <Search className="w-5 h-5" />,
  diff: <GitCompare className="w-5 h-5" />,
  yaml: <FileJson className="w-5 h-5" />,
  xml: <Code className="w-5 h-5" />,
  markdown: <FileText className="w-5 h-5" />,
  html: <Code className="w-5 h-5" />,
  sql: <Database className="w-5 h-5" />,
  lorem: <AlignLeft className="w-5 h-5" />,
  qrcode: <QrCode className="w-5 h-5" />,
  password: <KeySquare className="w-5 h-5" />,
  cron: <CalendarClock className="w-5 h-5" />,
};

export function FavoritesSection({ favorites, tools, onRemove }: FavoritesSectionProps) {
  const [animationReady, setAnimationReady] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Filter tools that are favorites
  const favoriteTools = useMemo(() =>
    favorites
      .map((id) => tools.find((t) => t.id === id))
      .filter(Boolean) as FavoriteItem[],
    [favorites, tools]
  );

  // Visibility is derived from favoriteTools length
  const hasFavorites = favoriteTools.length > 0;

  // Trigger animation after mount
  useEffect(() => {
    if (hasFavorites && !animationReady) {
      const timer = setTimeout(() => setAnimationReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [hasFavorites, animationReady]);

  const isVisible = hasFavorites && animationReady;

  // Handle remove with animation
  const handleRemove = (id: string) => {
    setRemovingId(id);
    // Wait for animation then actually remove
    setTimeout(() => {
      onRemove(id);
      setRemovingId(null);
    }, 300);
  };

  if (!hasFavorites) {
    return null;
  }

  return (
    <div
      ref={sectionRef}
      className={`favorites-section ${isVisible ? 'visible' : ''}`}
    >
      {/* Header */}
      <div className="favorites-header">
        <div className="favorites-title">
          <Star className="w-4 h-4" />
          <span>Favorites</span>
          <span className="favorites-count">{favoriteTools.length}</span>
        </div>
        <div className="favorites-hint">
          Click the heart on any tool to add it here
        </div>
      </div>

      {/* Favorites Grid */}
      <div className="favorites-grid">
        {favoriteTools.map((tool, index) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className={`favorite-card ${removingId === tool.id ? 'removing' : ''}`}
            style={{ '--delay': `${index * 50}ms` } as React.CSSProperties}
          >
            {/* Glow effect */}
            <div className="favorite-glow" />

            {/* Content */}
            <div className="favorite-icon">
              {TOOL_ICONS[tool.id] || <Sparkles className="w-5 h-5" />}
            </div>
            <div className="favorite-info">
              <span className="favorite-name">{tool.name}</span>
              <span className="favorite-desc">{tool.description}</span>
            </div>

            {/* Remove button */}
            <button
              className="favorite-remove"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove(tool.id);
              }}
              title="Remove from favorites"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default FavoritesSection;
