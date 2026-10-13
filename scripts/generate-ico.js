const fs = require('fs');
const path = require('path');

// Generate a 32x32 ICO file with CloudVault shield logo
const width = 32;
const height = 32;
const bpp = 32;

// Buffer for BGRA pixels (bottom to top row)
const pixels = Buffer.alloc(width * height * 4);

// Helper to set pixel at (x, y) where (0,0) is top-left
// BMP stores rows bottom-to-top, so y_bmp = (height - 1 - y)
function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const y_bmp = height - 1 - y;
  const idx = (y_bmp * width + x) * 4;
  
  // Alpha blend over existing pixel
  const srcA = a / 255;
  const dstA = pixels[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  
  if (outA > 0) {
    const dstB = pixels[idx + 0];
    const dstG = pixels[idx + 1];
    const dstR = pixels[idx + 2];
    
    const outR = Math.round((r * srcA + dstR * dstA * (1 - srcA)) / outA);
    const outG = Math.round((g * srcA + dstG * dstA * (1 - srcA)) / outA);
    const outB = Math.round((b * srcA + dstB * dstA * (1 - srcA)) / outA);
    
    pixels[idx + 0] = outB;
    pixels[idx + 1] = outG;
    pixels[idx + 2] = outR;
    pixels[idx + 3] = Math.round(outA * 255);
  }
}

// 1. Draw rounded container: 32x32, box from (2,2) to (29,29), corner radius 6
const rCorner = 6;
const minX = 2, maxX = 29, minY = 2, maxY = 29;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    // Check distance to rounded corners
    let inside = false;
    let distToEdge = 999;
    
    // Corners
    const cx = x < 16 ? minX + rCorner : maxX - rCorner;
    const cy = y < 16 ? minY + rCorner : maxY - rCorner;
    
    const inCornerX = (x < minX + rCorner) || (x > maxX - rCorner);
    const inCornerY = (y < minY + rCorner) || (y > maxY - rCorner);
    
    if (inCornerX && inCornerY) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= rCorner) {
        inside = true;
        distToEdge = rCorner - d;
      } else if (d <= rCorner + 1) {
        // antialiased edge
        const alpha = Math.max(0, 1 - (d - rCorner));
        setPixel(x, y, 0x18, 0x18, 0x1c, Math.round(alpha * 240));
      }
    } else if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      inside = true;
      distToEdge = Math.min(x - minX, maxX - x, y - minY, maxY - y);
    }
    
    if (inside) {
      // Dark slate background: #131316 with subtle center glow
      const distFromCenter = Math.hypot(x - 15.5, y - 15.5);
      const glow = Math.max(0, 1 - distFromCenter / 14);
      
      const bgR = Math.round(0x13 + glow * 15);
      const bgG = Math.round(0x13 + glow * 10);
      const bgB = Math.round(0x16);
      
      setPixel(x, y, bgR, bgG, bgB, 255);
      
      // Border: amber #F09E4F
      if (distToEdge <= 1.2) {
        setPixel(x, y, 0xF0, 0x9E, 0x4F, Math.round(200 * (1.2 - distToEdge + 0.3)));
      }
    }
  }
}

// 2. Draw Shield inside container:
// Shield coordinates scaled to 32x32:
// Shield top: y=7. Top center: (15.5, 6.5)
// Top curves down to shoulders: (8, 8.5) and (23, 8.5)
// Sides go down: (8, 16.5) and (23, 16.5)
// Bottom tip: (15.5, 26)
// Function to check shield distance
function distToShieldOutline(px, py) {
  // Let's sample the shield polygon / outline
  // Outline segments:
  // S1: (15.5, 6.5) -> (8, 8.5)
  // S2: (15.5, 6.5) -> (23, 8.5)
  // S3: (8, 8.5) -> (8, 16.5)
  // S4: (23, 8.5) -> (23, 16.5)
  // S5: (8, 16.5) -> (15.5, 26)
  // S6: (23, 16.5) -> (15.5, 26)
  const segments = [
    [[15.5, 6.5], [8.0, 8.8]],
    [[15.5, 6.5], [23.0, 8.8]],
    [[8.0, 8.8], [8.0, 16.5]],
    [[23.0, 8.8], [23.0, 16.5]],
    [[8.0, 16.5], [11.5, 22.0]],
    [[11.5, 22.0], [15.5, 25.5]],
    [[23.0, 16.5], [19.5, 22.0]],
    [[19.5, 22.0], [15.5, 25.5]],
  ];
  
  let minDist = 999;
  for (const [[x1, y1], [x2, y2]] of segments) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const d = Math.hypot(px - projX, py - projY);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Draw shield outline with subpixel sampling
for (let y = 5; y < 28; y++) {
  for (let x = 6; x < 26; x++) {
    // 4x supersampling
    let count = 0;
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        const subX = x + (sx + 0.5) / 4;
        const subY = y + (sy + 0.5) / 4;
        const d = distToShieldOutline(subX, subY);
        if (d <= 0.85) {
          count++;
        }
      }
    }
    if (count > 0) {
      const alpha = Math.min(255, Math.round((count / 16) * 255));
      setPixel(x, y, 0xF0, 0x9E, 0x4F, alpha);
    }
  }
}

// BMP Info Header (40 bytes)
const biHeader = Buffer.alloc(40);
biHeader.writeUInt32LE(40, 0); // biSize
biHeader.writeInt32LE(width, 4); // biWidth
biHeader.writeInt32LE(height * 2, 8); // biHeight (doubled for ICO mask)
biHeader.writeUInt16LE(1, 12); // biPlanes
biHeader.writeUInt16LE(bpp, 14); // biBitCount
biHeader.writeUInt32LE(0, 16); // biCompression
biHeader.writeUInt32LE(pixels.length, 20); // biSizeImage
biHeader.writeInt32LE(0, 24); // biXPelsPerMeter
biHeader.writeInt32LE(0, 28); // biYPelsPerMeter
biHeader.writeUInt32LE(0, 32); // biClrUsed
biHeader.writeUInt32LE(0, 36); // biClrImportant

// AND Mask (1 bit per pixel, 32x32/8 = 128 bytes)
const andMask = Buffer.alloc((width * height) / 8, 0);

// Total image resource size = biHeader (40) + pixels (4096) + andMask (128) = 4264
const imageSize = biHeader.length + pixels.length + andMask.length;

// ICONDIRENTRY (16 bytes)
const dirEntry = Buffer.alloc(16);
dirEntry.writeUInt8(width, 0); // bWidth
dirEntry.writeUInt8(height, 1); // bHeight
dirEntry.writeUInt8(0, 2); // bColorCount
dirEntry.writeUInt8(0, 3); // bReserved
dirEntry.writeUInt16LE(1, 4); // wPlanes
dirEntry.writeUInt16LE(bpp, 6); // wBitCount
dirEntry.writeUInt32LE(imageSize, 8); // dwBytesInRes
dirEntry.writeUInt32LE(6 + 16, 12); // dwImageOffset (22)

// ICONDIR (6 bytes)
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0, 0); // idReserved
iconDir.writeUInt16LE(1, 2); // idType (1 = icon)
iconDir.writeUInt16LE(1, 4); // idCount (1 icon)

const icoBuffer = Buffer.concat([iconDir, dirEntry, biHeader, pixels, andMask]);

fs.writeFileSync('public/favicon.ico', icoBuffer);
fs.writeFileSync('app/favicon.ico', icoBuffer);
console.log('Successfully generated public/favicon.ico and app/favicon.ico! Size:', icoBuffer.length);
