const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1726"/>
      <stop offset="50%" stop-color="#0a0f1d"/>
      <stop offset="100%" stop-color="#05070d"/>
    </linearGradient>
    <linearGradient id="greenCandle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="cyanCandle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="rsiLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  
  <!-- Outer subtle border -->
  <rect x="6" y="6" width="500" height="500" rx="106" fill="none" stroke="#25334d" stroke-width="6" opacity="0.6"/>

  <!-- Subtle Chart Grid Lines -->
  <line x1="60" y1="160" x2="452" y2="160" stroke="#1c263c" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="60" y1="256" x2="452" y2="256" stroke="#1c263c" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="60" y1="352" x2="452" y2="352" stroke="#1c263c" stroke-width="2" stroke-dasharray="6 6"/>

  <!-- Candlestick 1: Red/Bearish Pullback -->
  <line x1="130" y1="180" x2="130" y2="320" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
  <rect x="112" y="210" width="36" height="80" rx="6" fill="#f43f5e"/>

  <!-- Candlestick 2: Cyan Neutral / Transition -->
  <line x1="210" y1="140" x2="210" y2="360" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
  <rect x="192" y="180" width="36" height="130" rx="6" fill="url(#cyanCandle)"/>

  <!-- Candlestick 3: Big Bullish Breakout -->
  <line x1="290" y1="100" x2="290" y2="340" stroke="#10b981" stroke-width="6" stroke-linecap="round"/>
  <rect x="272" y="130" width="36" height="160" rx="6" fill="url(#greenCandle)"/>

  <!-- Candlestick 4: Continuation -->
  <line x1="370" y1="80" x2="370" y2="280" stroke="#34d399" stroke-width="6" stroke-linecap="round"/>
  <rect x="352" y="110" width="36" height="120" rx="6" fill="url(#greenCandle)"/>

  <!-- Glowing RSI Curve / Trend Arc -->
  <path d="M 80 370 Q 180 390 240 330 T 430 160" fill="none" stroke="#fbbf24" stroke-width="10" stroke-linecap="round" filter="url(#glow)"/>
  
  <!-- RSI Key Point Dots -->
  <circle cx="130" cy="375" r="9" fill="#fbbf24" stroke="#0a0f1d" stroke-width="3"/>
  <circle cx="240" cy="330" r="9" fill="#fbbf24" stroke="#0a0f1d" stroke-width="3"/>
  <circle cx="430" cy="160" r="11" fill="#fef08a" stroke="#0a0f1d" stroke-width="3" filter="url(#glow)"/>

  <!-- Bottom Badge: PLAYBOOK -->
  <rect x="136" y="420" width="240" height="42" rx="21" fill="#131d2e" stroke="#2e3f5c" stroke-width="2"/>
  <text x="256" y="448" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="4">PLAYBOOK</text>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent, 'utf8');
console.log('Created icon.svg');

// PNG Builder Helper
function createPngBuffer(width, height, getPixelRgba) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcVal = zlib.crc32(Buffer.concat([typeBuf, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Procedural rasterizer for Apple Touch Icon & App icons
function renderAppIconPixel(x, y, size) {
  const nx = x / size;
  const ny = y / size;

  // Background gradient: dark blue/obsidian
  let r = Math.round(14 - ny * 8);
  let g = Math.round(22 - ny * 14);
  let b = Math.round(36 - ny * 22);

  // Subtle radial top glow
  const cx = 0.5, cy = 0.35;
  const dist = Math.sqrt((nx - cx) * (nx - cx) + (ny - cy) * (ny - cy));
  if (dist < 0.6) {
    const glow = (1 - dist / 0.6) * 0.25;
    r = Math.min(255, Math.round(r + 30 * glow));
    g = Math.min(255, Math.round(g + 80 * glow));
    b = Math.min(255, Math.round(b + 140 * glow));
  }

  // Grid lines
  if (Math.abs(ny - 0.35) < 0.003 || Math.abs(ny - 0.52) < 0.003 || Math.abs(ny - 0.69) < 0.003) {
    if (nx > 0.12 && nx < 0.88) {
      r += 12; g += 18; b += 28;
    }
  }

  // Helper box check
  function inBox(bx, by, bw, bh) {
    return nx >= bx && nx <= bx + bw && ny >= by && ny <= by + bh;
  }

  // Candle 1 (Sell/Red pullback): nx around 0.25
  if (Math.abs(nx - 0.25) < 0.008 && ny >= 0.35 && ny <= 0.65) {
    return [244, 63, 94, 255];
  }
  if (inBox(0.21, 0.42, 0.08, 0.16)) {
    return [244, 63, 94, 255];
  }

  // Candle 2 (Cyan): nx around 0.42
  if (Math.abs(nx - 0.42) < 0.008 && ny >= 0.28 && ny <= 0.72) {
    return [56, 189, 248, 255];
  }
  if (inBox(0.38, 0.36, 0.08, 0.26)) {
    return [2, 132, 199, 255];
  }

  // Candle 3 (Emerald Green Big Bullish): nx around 0.59
  if (Math.abs(nx - 0.59) < 0.008 && ny >= 0.20 && ny <= 0.68) {
    return [52, 211, 153, 255];
  }
  if (inBox(0.55, 0.26, 0.08, 0.32)) {
    return [16, 185, 129, 255];
  }

  // Candle 4 (Green High): nx around 0.76
  if (Math.abs(nx - 0.76) < 0.008 && ny >= 0.16 && ny <= 0.56) {
    return [52, 211, 153, 255];
  }
  if (inBox(0.72, 0.22, 0.08, 0.24)) {
    return [16, 185, 129, 255];
  }

  // Golden RSI line curve: y approx 0.75 - 0.5 * (nx - 0.15) + curve
  // Curve equation: ny = 0.76 - 0.58 * ((nx - 0.15) / 0.7) + 0.1 * Math.sin(nx * 4)
  const targetNy = 0.78 - 0.7 * Math.pow(Math.max(0, (nx - 0.15) / 0.72), 1.2);
  if (nx >= 0.15 && nx <= 0.85) {
    const diff = Math.abs(ny - targetNy);
    if (diff < 0.018) {
      return [251, 191, 36, 255];
    } else if (diff < 0.038) {
      const alpha = 1 - (diff - 0.018) / 0.02;
      return [
        Math.min(255, Math.round(r + 251 * alpha * 0.5)),
        Math.min(255, Math.round(g + 191 * alpha * 0.5)),
        Math.min(255, Math.round(b + 36 * alpha * 0.5)),
        255
      ];
    }
  }

  // Accent dot at peak
  const peakDist = Math.sqrt((nx - 0.85) * (nx - 0.85) + (ny - targetNy) * (ny - targetNy));
  if (peakDist < 0.025) {
    return [254, 240, 138, 255];
  }

  // Bottom Pill Bar (nx 0.25 to 0.75, ny 0.83 to 0.91)
  if (inBox(0.25, 0.83, 0.50, 0.08)) {
    return [19, 29, 46, 255];
  }

  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)), 255];
}

// Generate PNG sizes
const sizes = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'apple-touch-icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'favicon.png', size: 32 }
];

sizes.forEach(({ file, size }) => {
  const buf = createPngBuffer(size, size, (x, y) => renderAppIconPixel(x, y, size));
  fs.writeFileSync(path.join(iconsDir, file), buf);
  console.log(`Generated icons/${file} (${size}x${size}, ${buf.length} bytes)`);
});
