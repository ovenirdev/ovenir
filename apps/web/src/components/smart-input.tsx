'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { detectFormat, type DetectionResult } from '@ovenir/core';
import { cn } from '@/lib/utils';

interface SmartInputProps {
  onDetection?: (result: DetectionResult) => void;
  className?: string;
}

export function SmartInput({ onDetection, className }: SmartInputProps) {
  const [value, setValue] = useState('');
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    if (newValue.trim()) {
      const result = detectFormat(newValue);
      setDetection(result);
      onDetection?.(result);
    } else {
      setDetection(null);
    }
  }, [onDetection]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted) {
      setTimeout(() => {
        const result = detectFormat(pasted);
        setDetection(result);
        onDetection?.(result);
      }, 0);
    }
  }, [onDetection]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Cmd/Ctrl + K to focus
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      textareaRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={cn('w-full max-w-3xl mx-auto', className)}>
      {/* Input Area */}
      <div
        className={cn(
          'relative rounded-xl border-2 transition-all duration-200',
          isFocused
            ? 'border-accent shadow-glow'
            : 'border-border hover:border-border-strong',
          detection?.hasSecrets && 'border-danger'
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-xl">🔮</span>
          <span className="text-text-secondary text-sm">
            Paste anything, search, or drop a file...
          </span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">K</kbd>
          </div>
        </div>
        
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="eyJhbGciOiJIUzI1NiIs... or any data"
          className={cn(
            'w-full min-h-[120px] p-4 bg-transparent resize-none',
            'font-mono text-sm text-text-primary',
            'placeholder:text-text-tertiary',
            'focus:outline-none'
          )}
          spellCheck={false}
        />
      </div>

      {/* Detection Result */}
      {detection?.bestMatch && (
        <div className="mt-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{detection.bestMatch.pattern.icon}</span>
            <span className="font-medium text-text-primary">
              {detection.bestMatch.pattern.name}
            </span>
            <span className="badge badge-accent">
              {detection.bestMatch.confidence}% match
            </span>
            {detection.hasSecrets && (
              <span className="badge badge-danger">⚠️ Secret detected</span>
            )}
          </div>
          
          {/* Suggested Actions */}
          <div className="flex flex-wrap gap-2">
            {detection.bestMatch.pattern.suggestedTools.map((toolId) => (
              <button
                key={toolId}
                className="btn btn-secondary btn-sm"
                onClick={() => console.log('Tool:', toolId)}
              >
                {formatToolName(toolId)}
              </button>
            ))}
          </div>

          {/* Other possible formats */}
          {detection.detected.length > 1 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-tertiary mb-2">Also possible:</p>
              <div className="flex flex-wrap gap-2">
                {detection.detected.slice(1, 4).map(({ pattern, confidence }) => (
                  <button
                    key={pattern.id}
                    className="text-xs px-2 py-1 rounded-md bg-bg-tertiary text-text-secondary hover:bg-bg-sunken transition-colors"
                  >
                    {pattern.icon} {pattern.name} ({confidence}%)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatToolName(toolId: string): string {
  return toolId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
