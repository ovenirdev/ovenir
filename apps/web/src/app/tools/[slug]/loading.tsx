import { Sparkles } from 'lucide-react';

export default function ToolLoading() {
  return (
    <div className="tool-page">
      <div className="tool-content">
        <header className="tool-header">
          <div className="back-link skeleton-pulse" style={{ width: 80, height: 20 }} />
          <div className="brand-mini">
            <div className="brand-mark-mini">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>OVENIR</span>
          </div>
        </header>

        <div className="tool-info">
          <div className="skeleton-pulse" style={{ width: 200, height: 32, borderRadius: 8 }} />
          <div className="skeleton-pulse" style={{ width: 300, height: 20, borderRadius: 6, marginTop: 8 }} />
        </div>

        <div className="tool-container">
          <div className="tool-controls">
            <div className="skeleton-pulse" style={{ width: 150, height: 36, borderRadius: 8 }} />
          </div>
          <div className="tool-zones">
            <div className="input-zone">
              <div className="skeleton-pulse" style={{ width: '100%', height: 120, borderRadius: 8 }} />
            </div>
            <div className="output-zone">
              <div className="skeleton-pulse" style={{ width: '100%', height: 100, borderRadius: 8 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
