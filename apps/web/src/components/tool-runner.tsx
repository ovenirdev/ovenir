'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Copy, Check, Trash2, Share2, RotateCcw } from 'lucide-react';

interface ToolRunnerProps {
  toolId: string;
  modes: { id: string; label: string }[];
  execute: (input: string, mode: string) => string | Promise<string>;
  placeholder?: string;
}

export function ToolRunner({ toolId, modes, execute, placeholder }: ToolRunnerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState(modes[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const urlInput = searchParams.get('input');
    const urlMode = searchParams.get('mode');
    
    if (urlInput) {
      try {
        setInput(decodeURIComponent(urlInput));
      } catch {
        setInput(urlInput);
      }
    }
    if (urlMode && modes.some(m => m.id === urlMode)) {
      setMode(urlMode);
    }
  }, [searchParams, modes]);

  // Auto-execute when input or mode changes
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    const run = async () => {
      setIsProcessing(true);
      setError(null);
      try {
        const result = await execute(input, mode);
        setOutput(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setOutput('');
      } finally {
        setIsProcessing(false);
      }
    };

    const timeout = setTimeout(run, 150);
    return () => clearTimeout(timeout);
  }, [input, mode, execute]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    router.replace(`/tools/${toolId}`, { scroll: false });
  }, [router, toolId]);

  const handleShare = useCallback(async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('input', encodeURIComponent(input));
    url.searchParams.set('mode', mode);
    await navigator.clipboard.writeText(url.toString());
  }, [input, mode]);

  const handleSwap = useCallback(() => {
    if (!output) return;
    setInput(output);
    if (modes.length === 2) {
      setMode(prev => prev === modes[0].id ? modes[1].id : modes[0].id);
    }
  }, [output, modes]);

  return (
    <div className="tool-runner">
      {/* Mode Selector */}
      <div className="runner-modes">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`runner-mode ${mode === m.id ? 'active' : ''}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Input/Output Panels */}
      <div className="runner-panels">
        {/* Input */}
        <div className="runner-panel">
          <div className="panel-header">
            <span>INPUT</span>
            <button onClick={handleClear} className="panel-action" title="Clear">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? 'Paste or type here...'}
            className="panel-textarea"
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Swap Button */}
        <button 
          className="runner-swap" 
          onClick={handleSwap}
          disabled={!output}
          title="Swap input/output"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Output */}
        <div className="runner-panel">
          <div className="panel-header">
            <span>OUTPUT</span>
            <div className="panel-actions">
              <button onClick={handleShare} className="panel-action" title="Share link">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={handleCopy} className="panel-action" title="Copy">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className={`panel-output ${error ? 'has-error' : ''} ${isProcessing ? 'processing' : ''}`}>
            {error ? (
              <span className="output-error">{error}</span>
            ) : output ? (
              <pre>{output}</pre>
            ) : (
              <span className="output-placeholder">Result will appear here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
