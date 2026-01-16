'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Palette, Copy, Check, AlertTriangle, CheckCircle, XCircle,
  Droplets, RefreshCw, Eye, Zap
} from 'lucide-react';

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface CMYK { c: number; m: number; y: number; k: number }

interface ColorFormats {
  hex: string;
  hexAlpha: string;
  rgb: RGB;
  rgbString: string;
  hsl: HSL;
  hslString: string;
  hsv: HSV;
  cmyk: CMYK;
  cmykString: string;
}

interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  normalText: boolean;
  largeText: boolean;
  uiComponents: boolean;
}

interface ColorToolProps {
  slug: string;
  initialInput?: string;
  initialMode?: string;
}

type Mode = 'convert' | 'palette' | 'contrast';
type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'monochromatic';

const PALETTE_TYPES: { id: PaletteType; name: string }[] = [
  { id: 'complementary', name: 'Complementary' },
  { id: 'analogous', name: 'Analogous' },
  { id: 'triadic', name: 'Triadic' },
  { id: 'tetradic', name: 'Tetradic' },
  { id: 'monochromatic', name: 'Mono' },
];

export function ColorTool({ initialInput, initialMode }: ColorToolProps) {
  const [mode, setMode] = useState<Mode>((initialMode as Mode) || 'convert');
  const [colorInput, setColorInput] = useState(initialInput || '');
  const [paletteType, setPaletteType] = useState<PaletteType>('complementary');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#FFFFFF');
  const [formats, setFormats] = useState<ColorFormats | null>(null);
  const [palette, setPalette] = useState<string[] | null>(null);
  const [contrast, setContrast] = useState<ContrastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const processColor = useCallback(async () => {
    const { colorTool } = await import('@ovenir/tools');

    if (mode === 'convert') {
      if (!colorInput.trim()) {
        setFormats(null);
        setError(null);
        return;
      }

      const rawResult = colorTool.run({ mode: 'convert', color: colorInput });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.formats) {
        setFormats(result.formats as ColorFormats);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
        setFormats(null);
      }
    } else if (mode === 'palette') {
      if (!colorInput.trim()) {
        setPalette(null);
        setError(null);
        return;
      }

      const rawResult = colorTool.run({ mode: 'palette', color: colorInput, type: paletteType });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.palette) {
        setPalette(result.palette as string[]);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
        setPalette(null);
      }
    } else if (mode === 'contrast') {
      const rawResult = colorTool.run({ mode: 'contrast', foreground, background });
      const result = await Promise.resolve(rawResult);

      if (result.success && result.contrast) {
        setContrast(result.contrast as ContrastResult);
        setError(null);
      } else if (result.error) {
        setError(result.error.message);
        setContrast(null);
      }
    }
  }, [colorInput, mode, paletteType, foreground, background]);

  useEffect(() => {
    const timer = setTimeout(processColor, 150);
    return () => clearTimeout(timer);
  }, [processColor]);

  const handleCopy = useCallback(async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const randomColor = useCallback(() => {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setColorInput(hex);
  }, []);

  const swapColors = useCallback(() => {
    setForeground(background);
    setBackground(foreground);
  }, [foreground, background]);

  return (
    <div className="tool-container">
      {/* Controls */}
      <div className="tool-controls">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'convert' ? 'active' : ''}`}
            onClick={() => setMode('convert')}
            type="button"
          >
            <Droplets className="w-4 h-4" />
            <span>Convert</span>
          </button>
          <button
            className={`mode-btn ${mode === 'palette' ? 'active' : ''}`}
            onClick={() => setMode('palette')}
            type="button"
          >
            <Palette className="w-4 h-4" />
            <span>Palette</span>
          </button>
          <button
            className={`mode-btn ${mode === 'contrast' ? 'active' : ''}`}
            onClick={() => setMode('contrast')}
            type="button"
          >
            <Eye className="w-4 h-4" />
            <span>Contrast</span>
          </button>
        </div>

        {mode === 'palette' && (
          <div className="variant-chips">
            {PALETTE_TYPES.map((pt) => (
              <button
                key={pt.id}
                className={`variant-chip ${paletteType === pt.id ? 'active' : ''}`}
                onClick={() => setPaletteType(pt.id)}
                type="button"
              >
                <span>{pt.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zones Container */}
      <div className="tool-zones">
      {/* Convert & Palette Mode Input */}
      {(mode === 'convert' || mode === 'palette') && (
        <div className={`input-zone ${error ? 'has-error' : ''}`}>
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">COLOR</span>
              {formats && (
                <span className="auto-badge">
                  <Zap className="w-3 h-3" />
                  Valid
                </span>
              )}
            </div>
            <div className="zone-actions">
              <button className="action-btn" onClick={randomColor} title="Random color" type="button">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="color-input-row">
            <input
              type="color"
              value={formats?.hex || '#000000'}
              onChange={(e) => setColorInput(e.target.value)}
              className="color-picker-input"
            />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Enter color (HEX, RGB, HSL, or name)..."
              className="zone-input"
              spellCheck={false}
            />
            {formats && (
              <div className="color-preview-box" style={{ background: formats.hex }} />
            )}
          </div>
        </div>
      )}

      {/* Contrast Mode Inputs */}
      {mode === 'contrast' && (
        <>
          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">FOREGROUND (TEXT)</span>
              </div>
            </div>
            <div className="color-input-row">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="color-picker-input"
              />
              <input
                type="text"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="zone-input"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="swap-row">
            <button className="action-btn" onClick={swapColors} title="Swap colors" type="button">
              <RefreshCw className="w-4 h-4" />
              <span>Swap</span>
            </button>
          </div>

          <div className="input-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">BACKGROUND</span>
              </div>
            </div>
            <div className="color-input-row">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="color-picker-input"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="zone-input"
                spellCheck={false}
              />
            </div>
          </div>
        </>
      )}

      {/* Convert Results */}
      {mode === 'convert' && formats && (
        <>
          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">PREVIEW</span>
              </div>
            </div>
            <div className="zone-output">
              <div
                className="color-large-preview"
                style={{ background: formats.hex }}
              >
                <span style={{ color: formats.hsl.l > 50 ? '#000' : '#fff' }}>
                  {formats.hex}
                </span>
              </div>
            </div>
          </div>

          <div className="output-zone">
            <div className="zone-header">
              <div className="zone-title">
                <span className="zone-label">FORMATS</span>
                <span className="success-badge">6 formats</span>
              </div>
            </div>
            <div className="zone-output">
              <div className="output-results">
                {[
                  { label: 'HEX', value: formats.hex, id: 'hex' },
                  { label: 'HEX (Alpha)', value: formats.hexAlpha, id: 'hexAlpha' },
                  { label: 'RGB', value: formats.rgbString, id: 'rgb' },
                  { label: 'HSL', value: formats.hslString, id: 'hsl' },
                  { label: 'HSV', value: `hsv(${formats.hsv.h}, ${formats.hsv.s}%, ${formats.hsv.v}%)`, id: 'hsv' },
                  { label: 'CMYK', value: formats.cmykString, id: 'cmyk' },
                ].map((format) => (
                  <div key={format.id} className="output-row">
                    <div className="output-row-header">
                      <span className="output-format-label">{format.label}</span>
                    </div>
                    <code className="output-value mono">{format.value}</code>
                    <button
                      className="output-copy"
                      onClick={() => handleCopy(format.value, format.id)}
                      type="button"
                    >
                      {copied === format.id ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Palette Results */}
      {mode === 'palette' && palette && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">GENERATED PALETTE</span>
              <span className="success-badge">{palette.length} colors</span>
            </div>
            <div className="zone-actions">
              <button
                className="action-btn"
                onClick={() => handleCopy(palette.join(', '), 'palette')}
                title="Copy all"
                type="button"
              >
                {copied === 'palette' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="zone-output">
            <div className="palette-swatches">
              {palette.map((color, idx) => (
                <div
                  key={idx}
                  className="palette-swatch"
                  onClick={() => handleCopy(color, `palette-${idx}`)}
                >
                  <div className="swatch-color" style={{ background: color }} />
                  <code className="swatch-hex">
                    {color}
                    {copied === `palette-${idx}` && <Check className="w-3 h-3" />}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contrast Results */}
      {mode === 'contrast' && contrast && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">CONTRAST RESULT</span>
              {contrast.level !== 'Fail' ? (
                <span className="success-badge"><CheckCircle className="w-3 h-3" />{contrast.level}</span>
              ) : (
                <span className="error-badge"><XCircle className="w-3 h-3" />Fail</span>
              )}
            </div>
          </div>
          <div className="zone-output">
            {/* Preview */}
            <div className="contrast-preview" style={{ background }}>
              <span style={{ color: foreground, fontSize: '18px', fontWeight: 'bold' }}>
                Sample Text Preview
              </span>
              <span style={{ color: foreground, fontSize: '14px' }}>
                Small text (14px regular)
              </span>
            </div>

            {/* Ratio */}
            <div className="contrast-ratio">
              <span className="ratio-value">{contrast.ratio}:1</span>
            </div>

            {/* WCAG Checks */}
            <div className="wcag-checks">
              <div className={`wcag-check ${contrast.normalText ? 'pass' : 'fail'}`}>
                {contrast.normalText ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <div>
                  <strong>Normal Text</strong>
                  <span>Requires 4.5:1 ratio</span>
                </div>
              </div>
              <div className={`wcag-check ${contrast.largeText ? 'pass' : 'fail'}`}>
                {contrast.largeText ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <div>
                  <strong>Large Text</strong>
                  <span>Requires 3:1 ratio</span>
                </div>
              </div>
              <div className={`wcag-check ${contrast.uiComponents ? 'pass' : 'fail'}`}>
                {contrast.uiComponents ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <div>
                  <strong>UI Components</strong>
                  <span>Requires 3:1 ratio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty States */}
      {mode === 'convert' && !colorInput && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">Enter a color to convert between HEX, RGB, HSL, HSV, CMYK...</span>
          </div>
        </div>
      )}

      {mode === 'palette' && !colorInput && !error && (
        <div className="output-zone">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-placeholder">Enter a base color to generate a harmonious palette...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="output-zone has-error">
          <div className="zone-header">
            <div className="zone-title">
              <span className="zone-label">OUTPUT</span>
              <span className="error-badge"><AlertTriangle className="w-3 h-3" />Error</span>
            </div>
          </div>
          <div className="zone-output">
            <span className="output-error">{error}</span>
          </div>
        </div>
      )}
      </div>{/* End tool-zones */}
    </div>
  );
}

export default ColorTool;
