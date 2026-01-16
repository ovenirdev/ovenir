'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Palette, Copy, Check, AlertCircle, CheckCircle, XCircle,
  Droplets, RefreshCw, Eye
} from 'lucide-react';

// Types
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

const PALETTE_TYPES: { id: PaletteType; name: string; desc: string }[] = [
  { id: 'complementary', name: 'Complementary', desc: 'Opposite on color wheel' },
  { id: 'analogous', name: 'Analogous', desc: 'Adjacent colors' },
  { id: 'triadic', name: 'Triadic', desc: 'Three evenly spaced' },
  { id: 'tetradic', name: 'Tetradic', desc: 'Four evenly spaced' },
  { id: 'monochromatic', name: 'Monochromatic', desc: 'Same hue, different lightness' },
];

export function ColorTool({ slug, initialInput, initialMode }: ColorToolProps) {
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

  // Process color
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

  // Copy handler
  const handleCopy = useCallback(async (value: string, id: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Random color
  const randomColor = useCallback(() => {
    const hex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setColorInput(hex);
  }, []);

  // Swap colors
  const swapColors = useCallback(() => {
    setForeground(background);
    setBackground(foreground);
  }, [foreground, background]);

  return (
    <div className="color-tool">
      {/* Mode Toggle */}
      <div className="color-modes">
        <button
          className={`color-mode-btn ${mode === 'convert' ? 'active' : ''}`}
          onClick={() => setMode('convert')}
        >
          <Droplets className="w-4 h-4" />
          <span>Convert</span>
        </button>
        <button
          className={`color-mode-btn ${mode === 'palette' ? 'active' : ''}`}
          onClick={() => setMode('palette')}
        >
          <Palette className="w-4 h-4" />
          <span>Palette</span>
        </button>
        <button
          className={`color-mode-btn ${mode === 'contrast' ? 'active' : ''}`}
          onClick={() => setMode('contrast')}
        >
          <Eye className="w-4 h-4" />
          <span>Contrast</span>
        </button>
      </div>

      {/* Convert & Palette Mode Input */}
      {(mode === 'convert' || mode === 'palette') && (
        <div className="color-input-section">
          <div className="color-input-header">
            <Palette className="w-4 h-4" />
            <span>Color</span>
            <button className="color-random-btn" onClick={randomColor}>
              <RefreshCw className="w-3.5 h-3.5" />
              Random
            </button>
          </div>
          <div className="color-input-wrap">
            <input
              type="color"
              value={formats?.hex || '#000000'}
              onChange={(e) => setColorInput(e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              placeholder="Enter color (HEX, RGB, HSL, or name)..."
              className="color-text-input"
              spellCheck={false}
            />
            {formats && (
              <div
                className="color-preview"
                style={{ background: formats.hex }}
              />
            )}
          </div>
        </div>
      )}

      {/* Palette Type Selector */}
      {mode === 'palette' && (
        <div className="color-palette-types">
          {PALETTE_TYPES.map((pt) => (
            <button
              key={pt.id}
              className={`color-palette-type ${paletteType === pt.id ? 'active' : ''}`}
              onClick={() => setPaletteType(pt.id)}
            >
              <span className="color-pt-name">{pt.name}</span>
              <span className="color-pt-desc">{pt.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Contrast Mode Input */}
      {mode === 'contrast' && (
        <div className="color-contrast-inputs">
          <div className="color-contrast-input">
            <label>Foreground (Text)</label>
            <div className="color-input-wrap">
              <input
                type="color"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={foreground}
                onChange={(e) => setForeground(e.target.value)}
                className="color-text-input"
                spellCheck={false}
              />
            </div>
          </div>

          <button className="color-swap-btn" onClick={swapColors}>
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="color-contrast-input">
            <label>Background</label>
            <div className="color-input-wrap">
              <input
                type="color"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="color-text-input"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="color-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Convert Results */}
      {mode === 'convert' && formats && (
        <div className="color-results">
          {/* Large Preview */}
          <div
            className="color-large-preview"
            style={{ background: formats.hex }}
          >
            <span style={{ color: formats.hsl.l > 50 ? '#000' : '#fff' }}>
              {formats.hex}
            </span>
          </div>

          {/* Format Cards */}
          <div className="color-formats">
            {[
              { label: 'HEX', value: formats.hex, id: 'hex' },
              { label: 'HEX (Alpha)', value: formats.hexAlpha, id: 'hexAlpha' },
              { label: 'RGB', value: formats.rgbString, id: 'rgb' },
              { label: 'HSL', value: formats.hslString, id: 'hsl' },
              { label: 'HSV', value: `hsv(${formats.hsv.h}, ${formats.hsv.s}%, ${formats.hsv.v}%)`, id: 'hsv' },
              { label: 'CMYK', value: formats.cmykString, id: 'cmyk' },
            ].map((format) => (
              <div key={format.id} className="color-format-card">
                <span className="color-format-label">{format.label}</span>
                <code className="color-format-value">{format.value}</code>
                <button
                  className="color-format-copy"
                  onClick={() => handleCopy(format.value, format.id)}
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

          {/* RGB/HSL Values */}
          <div className="color-values-grid">
            <div className="color-values-section">
              <h4>RGB Values</h4>
              <div className="color-value-bars">
                <div className="color-value-bar">
                  <span>R</span>
                  <div className="color-bar-track">
                    <div className="color-bar-fill red" style={{ width: `${(formats.rgb.r / 255) * 100}%` }} />
                  </div>
                  <code>{formats.rgb.r}</code>
                </div>
                <div className="color-value-bar">
                  <span>G</span>
                  <div className="color-bar-track">
                    <div className="color-bar-fill green" style={{ width: `${(formats.rgb.g / 255) * 100}%` }} />
                  </div>
                  <code>{formats.rgb.g}</code>
                </div>
                <div className="color-value-bar">
                  <span>B</span>
                  <div className="color-bar-track">
                    <div className="color-bar-fill blue" style={{ width: `${(formats.rgb.b / 255) * 100}%` }} />
                  </div>
                  <code>{formats.rgb.b}</code>
                </div>
              </div>
            </div>

            <div className="color-values-section">
              <h4>HSL Values</h4>
              <div className="color-value-bars">
                <div className="color-value-bar">
                  <span>H</span>
                  <div className="color-bar-track hue">
                    <div className="color-bar-indicator" style={{ left: `${(formats.hsl.h / 360) * 100}%` }} />
                  </div>
                  <code>{formats.hsl.h}°</code>
                </div>
                <div className="color-value-bar">
                  <span>S</span>
                  <div className="color-bar-track">
                    <div className="color-bar-fill" style={{ width: `${formats.hsl.s}%`, background: formats.hex }} />
                  </div>
                  <code>{formats.hsl.s}%</code>
                </div>
                <div className="color-value-bar">
                  <span>L</span>
                  <div className="color-bar-track lightness">
                    <div className="color-bar-indicator" style={{ left: `${formats.hsl.l}%` }} />
                  </div>
                  <code>{formats.hsl.l}%</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Palette Results */}
      {mode === 'palette' && palette && (
        <div className="color-palette-result">
          <div className="color-palette-header">
            <span>Generated Palette</span>
            <button
              className="color-copy-all-btn"
              onClick={() => handleCopy(palette.join(', '), 'palette')}
            >
              {copied === 'palette' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy All
            </button>
          </div>
          <div className="color-palette-swatches">
            {palette.map((color, idx) => (
              <div
                key={idx}
                className="color-palette-swatch"
                onClick={() => handleCopy(color, `palette-${idx}`)}
              >
                <div className="color-swatch-color" style={{ background: color }} />
                <code className="color-swatch-hex">
                  {color}
                  {copied === `palette-${idx}` && <Check className="w-3 h-3 inline ml-1" />}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contrast Results */}
      {mode === 'contrast' && contrast && (
        <div className="color-contrast-result">
          {/* Preview */}
          <div className="color-contrast-preview" style={{ background }}>
            <span style={{ color: foreground }}>
              Sample Text Preview
            </span>
            <span className="color-contrast-small" style={{ color: foreground }}>
              Small text (14px regular)
            </span>
          </div>

          {/* Ratio */}
          <div className={`color-contrast-ratio ${contrast.level.toLowerCase().replace(' ', '-')}`}>
            <span className="color-ratio-value">{contrast.ratio}:1</span>
            <span className={`color-ratio-level ${contrast.level === 'Fail' ? 'fail' : 'pass'}`}>
              {contrast.level}
            </span>
          </div>

          {/* WCAG Checks */}
          <div className="color-wcag-checks">
            <div className={`color-wcag-check ${contrast.normalText ? 'pass' : 'fail'}`}>
              {contrast.normalText ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <div>
                <strong>Normal Text</strong>
                <span>Requires 4.5:1 ratio</span>
              </div>
            </div>
            <div className={`color-wcag-check ${contrast.largeText ? 'pass' : 'fail'}`}>
              {contrast.largeText ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <div>
                <strong>Large Text</strong>
                <span>Requires 3:1 ratio (18px+ or 14px bold)</span>
              </div>
            </div>
            <div className={`color-wcag-check ${contrast.uiComponents ? 'pass' : 'fail'}`}>
              {contrast.uiComponents ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <div>
                <strong>UI Components</strong>
                <span>Requires 3:1 ratio</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {mode === 'convert' && !colorInput && !error && (
        <div className="color-empty">
          <Palette className="w-12 h-12" />
          <h3>Color Converter</h3>
          <p>Enter a color in HEX, RGB, HSL format or a CSS color name</p>
        </div>
      )}

      {mode === 'palette' && !colorInput && !error && (
        <div className="color-empty">
          <Palette className="w-12 h-12" />
          <h3>Palette Generator</h3>
          <p>Enter a base color and select a palette type to generate harmonious colors</p>
        </div>
      )}
    </div>
  );
}

export default ColorTool;
