'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Braces, Minimize2, CheckCircle, TreePine, Code, Search,
  Copy, Check, ChevronRight, ChevronDown, AlertCircle, Wand2,
  FileJson, Hash, Type, ToggleLeft, Zap, Sparkles, Eye
} from 'lucide-react';

// Types from the tool package
interface JsonNode {
  key: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  value: unknown;
  children?: JsonNode[];
  size: number;
  depth: number;
}

interface JsonStats {
  totalKeys: number;
  maxDepth: number;
  totalSize: number;
  arrayCount: number;
  objectCount: number;
  stringCount: number;
  numberCount: number;
  booleanCount: number;
  nullCount: number;
}

interface JsonError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFix?: string;
}

type Mode = 'format' | 'minify' | 'validate' | 'tree' | 'typescript' | 'query';

const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
  { id: 'format', label: 'Format', icon: <Braces className="w-4 h-4" /> },
  { id: 'minify', label: 'Minify', icon: <Minimize2 className="w-4 h-4" /> },
  { id: 'validate', label: 'Validate', icon: <CheckCircle className="w-4 h-4" /> },
  { id: 'tree', label: 'Tree', icon: <TreePine className="w-4 h-4" /> },
  { id: 'typescript', label: 'TypeScript', icon: <Code className="w-4 h-4" /> },
  { id: 'query', label: 'Query', icon: <Search className="w-4 h-4" /> },
];

// ============ TREE NODE COMPONENT ============
interface TreeNodeProps {
  node: JsonNode;
  onPathClick: (path: string) => void;
  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  totalSize: number;
}

function TreeNode({ node, onPathClick, expandedPaths, toggleExpand, totalSize }: TreeNodeProps) {
  const isExpanded = expandedPaths.has(node.path);
  const hasChildren = node.children && node.children.length > 0;
  const sizePercent = (node.size / totalSize) * 100;

  const getTypeColor = (type: JsonNode['type']) => {
    switch (type) {
      case 'string': return 'var(--color-success)';
      case 'number': return 'var(--color-info)';
      case 'boolean': return 'var(--color-warning)';
      case 'null': return 'var(--color-text-tertiary)';
      case 'object': return 'var(--color-accent)';
      case 'array': return '#a855f7';
      default: return 'var(--color-text)';
    }
  };

  const getTypeIcon = (type: JsonNode['type']) => {
    switch (type) {
      case 'string': return <Type className="w-3 h-3" />;
      case 'number': return <Hash className="w-3 h-3" />;
      case 'boolean': return <ToggleLeft className="w-3 h-3" />;
      case 'null': return <span className="text-xs">null</span>;
      case 'object': return <Braces className="w-3 h-3" />;
      case 'array': return <span className="text-xs">[]</span>;
      default: return null;
    }
  };

  const formatValue = (value: unknown, type: JsonNode['type']) => {
    if (type === 'string') return `"${String(value).slice(0, 50)}${String(value).length > 50 ? '...' : ''}"`;
    if (type === 'null') return 'null';
    if (type === 'boolean') return String(value);
    if (type === 'number') return String(value);
    if (type === 'object') return `{${node.children?.length || 0} keys}`;
    if (type === 'array') return `[${node.children?.length || 0} items]`;
    return String(value);
  };

  return (
    <div className="tree-node" style={{ '--depth': node.depth } as React.CSSProperties}>
      <div
        className="tree-node-row"
        onClick={() => hasChildren ? toggleExpand(node.path) : onPathClick(node.path)}
      >
        {/* Expand/collapse */}
        <button
          className="tree-toggle"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpand(node.path);
          }}
          style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Type icon */}
        <span className="tree-type" style={{ color: getTypeColor(node.type) }}>
          {getTypeIcon(node.type)}
        </span>

        {/* Key */}
        <span className="tree-key">{node.key}</span>

        {/* Colon */}
        {!hasChildren && <span className="tree-colon">:</span>}

        {/* Value */}
        <span className="tree-value" style={{ color: getTypeColor(node.type) }}>
          {formatValue(node.value, node.type)}
        </span>

        {/* Size bar */}
        <div className="tree-size" title={`${node.size} bytes (${sizePercent.toFixed(1)}%)`}>
          <div
            className="tree-size-bar"
            style={{ width: `${Math.max(sizePercent, 2)}%` }}
          />
        </div>

        {/* Copy path button */}
        <button
          className="tree-copy"
          onClick={(e) => {
            e.stopPropagation();
            onPathClick(node.path);
          }}
          title="Copy path"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="tree-children">
          {node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              onPathClick={onPathClick}
              expandedPaths={expandedPaths}
              toggleExpand={toggleExpand}
              totalSize={totalSize}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ STATS COMPONENT ============
function StatsPanel({ stats }: { stats: JsonStats }) {
  const items = [
    { label: 'Keys', value: stats.totalKeys, color: 'var(--color-accent)' },
    { label: 'Depth', value: stats.maxDepth, color: 'var(--color-info)' },
    { label: 'Objects', value: stats.objectCount, color: 'var(--color-accent)' },
    { label: 'Arrays', value: stats.arrayCount, color: '#a855f7' },
    { label: 'Strings', value: stats.stringCount, color: 'var(--color-success)' },
    { label: 'Numbers', value: stats.numberCount, color: 'var(--color-info)' },
  ];

  return (
    <div className="json-stats">
      {items.map((item) => (
        <div key={item.label} className="stat-item">
          <span className="stat-value" style={{ color: item.color }}>{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
      <div className="stat-item">
        <span className="stat-value">{formatBytes(stats.totalSize)}</span>
        <span className="stat-label">Size</span>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ============ MAIN COMPONENT ============
interface JsonToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

export function JsonTool({ slug, initialInput, initialMode }: JsonToolProps) {
  const [input, setInput] = useState(initialInput || '');
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'format');
  const [query, setQuery] = useState('$');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonError | null>(null);
  const [tree, setTree] = useState<JsonNode | null>(null);
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [typescript, setTypescript] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['$']));
  const [indent, setIndent] = useState(2);
  const [autoFix, setAutoFix] = useState<string | null>(null);

  // Process JSON
  const processJson = useCallback(async () => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      setTree(null);
      setStats(null);
      setTypescript('');
      setAutoFix(null);
      return;
    }

    // Dynamic import to avoid SSR issues
    const { jsonTool } = await import('@ovenir/tools');
    const rawResult = jsonTool.run({
      mode,
      input,
      indent,
      query: mode === 'query' ? query : undefined,
    });

    // Handle both sync and async results
    const result = await Promise.resolve(rawResult);

    if (result.success) {
      setOutput(result.result || '');
      setError(null);
      setTree(result.tree || null);
      setStats(result.stats || null);
      setTypescript(result.typescript || '');
      setAutoFix(null);
    } else if (result.error) {
      setError(result.error as JsonError);
      setAutoFix((result.error as JsonError).autoFix || null);
      setOutput('');
      setTree(null);
      setStats(null);
      setTypescript('');
    }
  }, [input, mode, indent, query]);

  // Process on input/mode change
  useEffect(() => {
    const timer = setTimeout(processJson, 150);
    return () => clearTimeout(timer);
  }, [processJson]);

  // Copy to clipboard
  const handleCopy = useCallback(async (text: string, isPath = false) => {
    await navigator.clipboard.writeText(text);
    if (isPath) {
      setCopiedPath(text);
      setTimeout(() => setCopiedPath(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  // Toggle tree expand
  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all
  const expandAll = useCallback(() => {
    if (!tree) return;
    const paths = new Set<string>();
    const traverse = (node: JsonNode) => {
      paths.add(node.path);
      node.children?.forEach(traverse);
    };
    traverse(tree);
    setExpandedPaths(paths);
  }, [tree]);

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedPaths(new Set(['$']));
  }, []);

  // Apply auto-fix
  const applyAutoFix = useCallback(() => {
    if (autoFix) {
      setInput(autoFix);
    }
  }, [autoFix]);

  // Get current output content
  const outputContent = useMemo(() => {
    if (mode === 'typescript') return typescript;
    if (mode === 'tree') return null;
    return output;
  }, [mode, output, typescript]);

  return (
    <div className="json-tool">
      {/* Mode Selector */}
      <div className="json-modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`json-mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.icon}
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Query Input (only for query mode) */}
      {mode === 'query' && (
        <div className="json-query">
          <Search className="w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="$.users[0].name"
            className="json-query-input"
          />
          <span className="json-query-hint">JSONPath</span>
        </div>
      )}

      <div className="json-panels">
        {/* Input Panel */}
        <div className="json-panel json-input-panel">
          <div className="json-panel-header">
            <FileJson className="w-4 h-4" />
            <span>Input</span>
            <div className="json-panel-actions">
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="json-indent-select"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={0}>Tab</option>
              </select>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{\n  "name": "OVENIR",\n  "version": "1.0",\n  "features": ["json", "base64", "jwt"]\n}'
            className="json-textarea"
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="json-panel json-output-panel">
          <div className="json-panel-header">
            {mode === 'tree' ? <TreePine className="w-4 h-4" /> : <Braces className="w-4 h-4" />}
            <span>
              {mode === 'format' && 'Formatted'}
              {mode === 'minify' && 'Minified'}
              {mode === 'validate' && 'Validation'}
              {mode === 'tree' && 'Tree View'}
              {mode === 'typescript' && 'TypeScript Interface'}
              {mode === 'query' && 'Query Result'}
            </span>
            <div className="json-panel-actions">
              {mode === 'tree' && tree && (
                <>
                  <button className="json-action-btn" onClick={expandAll}>
                    Expand All
                  </button>
                  <button className="json-action-btn" onClick={collapseAll}>
                    Collapse
                  </button>
                </>
              )}
              {outputContent && (
                <button
                  className={`json-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={() => handleCopy(outputContent)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="json-error">
              <div className="json-error-header">
                <AlertCircle className="w-4 h-4" />
                <span>Error</span>
                {error.line && <span className="json-error-pos">Line {error.line}, Col {error.column}</span>}
              </div>
              <p className="json-error-message">{error.message}</p>
              {autoFix && (
                <button className="json-autofix-btn" onClick={applyAutoFix}>
                  <Wand2 className="w-4 h-4" />
                  <span>Auto-fix available</span>
                  <Sparkles className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Success State */}
          {!error && mode === 'validate' && output && (
            <div className="json-success">
              <CheckCircle className="w-5 h-5" />
              <span>Valid JSON</span>
            </div>
          )}

          {/* Tree View */}
          {mode === 'tree' && tree && (
            <div className="json-tree">
              <TreeNode
                node={tree}
                onPathClick={(path) => handleCopy(path, true)}
                expandedPaths={expandedPaths}
                toggleExpand={toggleExpand}
                totalSize={tree.size}
              />
            </div>
          )}

          {/* Path Copied Toast */}
          {copiedPath && (
            <div className="json-path-toast">
              <Check className="w-4 h-4" />
              <code>{copiedPath}</code>
              <span>copied!</span>
            </div>
          )}

          {/* Output Textarea */}
          {mode !== 'tree' && !error && outputContent && (
            <pre className="json-output">{outputContent}</pre>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {stats && !error && (
        <StatsPanel stats={stats} />
      )}
    </div>
  );
}

export default JsonTool;
