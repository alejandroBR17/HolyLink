const fs = require('fs');
const zlib = require('zlib');

// CRC32 helper
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

// Decode uncompressed RGBA from standard PNG
function decodePngRgba(buf) {
  let offset = 8; // skip signature
  let width = 0, height = 0;
  const idatChunks = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.slice(offset + 4, offset + 8).toString('ascii');
    const data = buf.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    }
    offset += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressed);
  const stride = width * 4;
  const rgba = Buffer.alloc(width * height * 4);

  // Scanline unfiltering (support filter 0, 1, 2, 3, 4)
  let prevRow = Buffer.alloc(stride);
  let srcOffset = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcOffset++];
    const currentRow = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const raw = decompressed[srcOffset++];
      const a = (x >= 4) ? currentRow[x - 4] : 0;
      const b = prevRow[x];
      const c = (x >= 4) ? prevRow[x - 4] : 0;
      let val = 0;
      if (filterType === 0) val = raw;
      else if (filterType === 1) val = (raw + a) & 0xFF;
      else if (filterType === 2) val = (raw + b) & 0xFF;
      else if (filterType === 3) val = (raw + Math.floor((a + b) / 2)) & 0xFF;
      else if (filterType === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (raw + pr) & 0xFF;
      }
      currentRow[x] = val;
    }
    currentRow.copy(rgba, y * stride);
    prevRow = currentRow;
  }

  return { width, height, rgba };
}

function encodePngRgba(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdrData);

  const stride = width * 4;
  const rawData = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (stride + 1);
    rawData[rowOffset] = 0; // None filter
    rgba.copy(rawData, rowOffset + 1, y * stride, (y + 1) * stride);
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function cropTransparent(filePath, destPath, padding = 4) {
  console.log('Processing crop for:', filePath);
  const buf = fs.readFileSync(filePath);
  const { width, height, rgba } = decodePngRgba(buf);

  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = rgba[idx + 3];
      if (alpha > 10) { // non-transparent pixel
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    console.log('Image is completely transparent!');
    return;
  }

  console.log('Bounding box:', { minX, maxX, minY, maxY, originalWidth: width, originalHeight: height });

  // Apply tight padding
  minX = Math.max(0, minX - padding);
  maxX = Math.min(width - 1, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log('Cropped dimensions:', cropW, 'x', cropH);

  const croppedRgba = Buffer.alloc(cropW * cropH * 4);
  for (let cy = 0; cy < cropH; cy++) {
    const srcY = minY + cy;
    for (let cx = 0; cx < cropW; cx++) {
      const srcX = minX + cx;
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = (cy * cropW + cx) * 4;
      rgba.copy(croppedRgba, dstIdx, srcIdx, srcIdx + 4);
    }
  }

  const croppedPng = encodePngRgba(cropW, cropH, croppedRgba);
  fs.writeFileSync(destPath, croppedPng);
  console.log('Saved cropped image to', destPath, '(', croppedPng.length, 'bytes )');
}

// Crop logo text
cropTransparent('public/logo-text.png', 'public/logo-text.png', 8);
cropTransparent('public/logo-text.png', 'public/logo-text-854.png', 8);
cropTransparent('public/logo-text.png', 'public/logo-text-backup.png', 8);
cropTransparent('public/logo-text.png', 'public/pwa/text-dark-192.png', 8);
cropTransparent('public/logo-text.png', 'public/pwa/text-dark-512.png', 8);
cropTransparent('public/logo-text.png', 'public/pwa/base-text.png', 8);
