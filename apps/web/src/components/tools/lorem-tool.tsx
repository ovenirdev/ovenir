'use client';

import { useState, useCallback } from 'react';
import {
  AlignLeft, Copy, Check, RefreshCw,
  FileText, Hash, Type
} from 'lucide-react';

interface Stats {
  paragraphs: number;
  sentences: number;
  words: number;
  characters: number;
}

interface LoremToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'paragraphs' | 'sentences' | 'words';

export function LoremTool({ initialMode }: LoremToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [text, setText] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async () => {
    const { loremTool } = await import('@ovenir/tools');
    const res = await Promise.resolve(loremTool.run({
      mode,
      count,
      startWithLorem,
    }));

    if (res.success && res.text) {
      setText(res.text);
      setStats(res.stats || null);
    }
  }, [mode, count, startWithLorem]);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const getMaxCount = () => {
    switch (mode) {
      case 'words': return 500;
      case 'sentences': return 50;
      default: return 20;
    }
  };

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'paragraphs' ? 'active' : ''}`}
            onClick={() => setMode('paragraphs')}
            type="button"
          >
            <FileText className="w-4 h-4" />
            <span>Paragraphs</span>
          </button>
          <button
            className={`mode-btn ${mode === 'sentences' ? 'active' : ''}`}
            onClick={() => setMode('sentences')}
            type="button"
          >
            <AlignLeft className="w-4 h-4" />
            <span>Sentences</span>
          </button>
          <button
            className={`mode-btn ${mode === 'words' ? 'active' : ''}`}
            onClick={() => setMode('words')}
            type="button"
          >
            <Type className="w-4 h-4" />
            <span>Words</span>
          </button>
        </div>
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
        {/* Options */}
        <div className="input-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OPTIONS</span>
            </div>
          </div>
          <div className="lorem-options">
            <div className="lorem-option-row">
              <label>Count: {count}</label>
              <input
                type="range"
                min="1"
                max={getMaxCount()}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="lorem-slider"
              />
            </div>

            <div className="lorem-toggles">
              <button
                className={`variant-chip ${startWithLorem ? 'active' : ''}`}
                onClick={() => setStartWithLorem(!startWithLorem)}
                type="button"
              >
                <span>Start with &quot;Lorem ipsum...&quot;</span>
              </button>
            </div>

            <button className="generate-btn" onClick={generate} type="button">
              <RefreshCw className="w-4 h-4" />
              <span>Generate</span>
            </button>
          </div>
        </div>

        {/* Output */}
      {text && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
              {stats && (
                <>
                  <span className="auto-badge">
                    <FileText className="w-3 h-3" />
                    {stats.paragraphs} para
                  </span>
                  <span className="auto-badge">
                    <Hash className="w-3 h-3" />
                    {stats.words} words
                  </span>
                </>
              )}
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={handleCopy}
                title="Copy text"
                type="button"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="zone-output">
            <div className="lorem-output">
              {text.split('\n\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!text && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">
              Configure options and click Generate to create placeholder text...
            </span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default LoremTool;
