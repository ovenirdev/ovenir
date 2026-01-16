import { meta, config, inputSchema, outputSchema, type QrCodeInput, type QrCodeOutput } from './meta';
import qrGenerator from 'qrcode-generator';

function formatWifi(ssid: string, password: string, encryption: string): string {
  return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
}

function run(input: QrCodeInput): QrCodeOutput {
  try {
    const { mode, content, size, ssid, password, encryption } = input;

    let data = content;

    if (mode === 'wifi') {
      if (!ssid) {
        return {
          success: false,
          error: { message: 'Please enter a WiFi network name (SSID)' },
        };
      }
      data = formatWifi(ssid, password || '', encryption || 'WPA');
    } else if (!content.trim()) {
      return {
        success: false,
        error: { message: 'Please enter content to encode' },
      };
    }

    if (data.length > 2000) {
      return {
        success: false,
        error: { message: 'Content too long. Maximum 2000 characters.' },
      };
    }

    // Create QR code
    // Type 0 = auto-detect, Error correction level L (7%)
    const qr = qrGenerator(0, 'M');
    qr.addData(data);
    qr.make();

    // Generate SVG
    const moduleCount = qr.getModuleCount();
    const cellSize = Math.max(4, Math.floor(size / moduleCount));
    const margin = cellSize * 2;
    const totalSize = moduleCount * cellSize + margin * 2;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          svg += `<rect x="${col * cellSize + margin}" y="${row * cellSize + margin}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }

    svg += '</svg>';

    return {
      success: true,
      data: svg,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'QR code generation failed' },
    };
  }
}

export const qrcodeTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { QrCodeInput, QrCodeOutput };
