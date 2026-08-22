const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function makeCRCTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCRCTable();

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generatePngBuffer(width, height, drawFn) {
  // 8-byte signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image scanlines
  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing styles for HolyLink icons:
// HolyLink brand: Gold / Amber (#F59E0B) cross/ray symbol on deep dark (#020617) or transparent.

function drawSymbolIcon(theme = 'dark') {
  return function(x, y, w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rOuter = w * 0.46;
    const cornerRadius = w * 0.22;

    // Background
    let bgR = 2, bgG = 6, bgB = 23, bgA = 255; // #020617
    if (theme === 'light') {
      bgR = 255; bgG = 255; bgB = 255; bgA = 255;
    } else if (theme === 'transparent') {
      bgR = 0; bgG = 0; bgB = 0; bgA = 0;
    }

    // Check rounded rect container if not transparent
    if (theme !== 'transparent') {
      // Rounded rect bounds
      const pad = w * 0.04;
      const left = pad, right = w - pad, top = pad, bottom = h - pad;
      const rx = Math.max(left + cornerRadius, Math.min(right - cornerRadius, x));
      const ry = Math.max(top + cornerRadius, Math.min(bottom - cornerRadius, y));
      const distSq = (x - rx) * (x - rx) + (y - ry) * (y - ry);
      if (distSq > cornerRadius * cornerRadius) {
        return [0, 0, 0, 0];
      }
    }

    // HolyLink Cross / Radiance Symbol in center
    const dx = x - cx;
    const dy = y - cy;

    // Cross dimensions
    const beamThick = w * 0.11;
    const beamLen = w * 0.32;
    const crossTop = cy - beamLen * 1.05;
    const crossBottom = cy + beamLen * 1.15;
    const crossLeft = cx - beamLen * 0.75;
    const crossRight = cx + beamLen * 0.75;
    const barY = cy - beamLen * 0.15;

    // Vertical beam
    const inVertBeam = Math.abs(dx) <= beamThick / 2 && y >= crossTop && y <= crossBottom;
    // Horizontal beam
    const inHorizBeam = Math.abs(y - barY) <= beamThick / 2 && x >= crossLeft && x <= crossRight;

    // Glow rays (45 deg diagonal rays)
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const rayDist = Math.abs(Math.sin(angle * 4));
    const inGlow = distToCenter < w * 0.38 && rayDist > 0.82 && distToCenter > w * 0.14;

    if (inVertBeam || inHorizBeam) {
      // Gold / Amber gradient
      const grad = (y - crossTop) / (crossBottom - crossTop);
      const goldR = Math.round(251 - grad * 15);
      const goldG = Math.round(191 - grad * 35);
      const goldB = Math.round(36 + grad * 10);
      return [goldR, goldG, goldB, 255];
    }

    if (inGlow) {
      const alpha = Math.round((1 - (distToCenter / (w * 0.38))) * 120);
      return [245, 158, 11, alpha];
    }

    return [bgR, bgG, bgB, bgA];
  };
}

function drawTextIcon(theme = 'dark') {
  return function(x, y, w, h) {
    const fn = drawSymbolIcon(theme);
    return fn(x, y, w, h);
  };
}

function drawFullIcon(theme = 'dark') {
  return function(x, y, w, h) {
    const fn = drawSymbolIcon(theme);
    return fn(x, y, w, h);
  };
}

console.log('Generating valid PNG icons...');

// Generate root public icons
const iconsToGen = [
  { name: 'public/icon-192.png', size: 192, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/icon-512.png', size: 512, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/favicon.png', size: 64, theme: 'transparent', fn: drawSymbolIcon },
  { name: 'public/apple-touch-icon.png', size: 180, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/icon-192-bg.png', size: 192, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/icon-192-black.png', size: 192, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/icon-symbol-838.png', size: 512, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/logo-full-814.png', size: 512, theme: 'dark', fn: drawFullIcon },
  { name: 'public/logo-full.png', size: 512, theme: 'dark', fn: drawFullIcon },
  { name: 'public/logo-text-854.png', size: 512, theme: 'dark', fn: drawTextIcon },
  { name: 'public/logo-text.png', size: 512, theme: 'dark', fn: drawTextIcon },
  { name: 'public/logo-text-backup.png', size: 512, theme: 'dark', fn: drawTextIcon },

  // PWA subdirectory icons
  { name: 'public/pwa/symbol-dark-192.png', size: 192, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/pwa/symbol-dark-512.png', size: 512, theme: 'dark', fn: drawSymbolIcon },
  { name: 'public/pwa/symbol-light-192.png', size: 192, theme: 'light', fn: drawSymbolIcon },
  { name: 'public/pwa/symbol-light-512.png', size: 512, theme: 'light', fn: drawSymbolIcon },
  { name: 'public/pwa/symbol-transparent-192.png', size: 192, theme: 'transparent', fn: drawSymbolIcon },
  { name: 'public/pwa/symbol-transparent-512.png', size: 512, theme: 'transparent', fn: drawSymbolIcon },

  { name: 'public/pwa/full-dark-192.png', size: 192, theme: 'dark', fn: drawFullIcon },
  { name: 'public/pwa/full-dark-512.png', size: 512, theme: 'dark', fn: drawFullIcon },
  { name: 'public/pwa/full-light-192.png', size: 192, theme: 'light', fn: drawFullIcon },
  { name: 'public/pwa/full-light-512.png', size: 512, theme: 'light', fn: drawFullIcon },
  { name: 'public/pwa/full-transparent-192.png', size: 192, theme: 'transparent', fn: drawFullIcon },
  { name: 'public/pwa/full-transparent-512.png', size: 512, theme: 'transparent', fn: drawFullIcon },

  { name: 'public/pwa/text-dark-192.png', size: 192, theme: 'dark', fn: drawTextIcon },
  { name: 'public/pwa/text-dark-512.png', size: 512, theme: 'dark', fn: drawTextIcon },
  { name: 'public/pwa/text-light-192.png', size: 192, theme: 'light', fn: drawTextIcon },
  { name: 'public/pwa/text-light-512.png', size: 512, theme: 'light', fn: drawTextIcon },
  { name: 'public/pwa/text-transparent-192.png', size: 192, theme: 'transparent', fn: drawTextIcon },
  { name: 'public/pwa/text-transparent-512.png', size: 512, theme: 'transparent', fn: drawTextIcon },

  { name: 'public/pwa/base-symbol.png', size: 512, theme: 'transparent', fn: drawSymbolIcon },
  { name: 'public/pwa/base-full.png', size: 512, theme: 'transparent', fn: drawFullIcon },
  { name: 'public/pwa/base-text.png', size: 512, theme: 'transparent', fn: drawTextIcon }
];

iconsToGen.forEach(item => {
  const buf = generatePngBuffer(item.size, item.size, item.fn(item.theme));
  fs.writeFileSync(item.name, buf);
  console.log('Wrote', item.name, '(', buf.length, 'bytes,', item.size + 'x' + item.size, ')');
});

console.log('All PNG icons generated successfully!');
