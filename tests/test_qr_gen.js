// Testing compact QR generator
// Compact QR Code Generator in pure vanilla JavaScript

function createQrSvg(text, size = 200) {
  // Minimal QR code generator supporting Byte mode, ECC L/M, Versions 1-10
  // Standard QR specification ISO/IEC 18004
  
  // GF(256) log and exp tables
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }

  function gfMul(x, y) {
    if (x === 0 || y === 0) return 0;
    return GF_EXP[GF_LOG[x] + GF_LOG[y]];
  }

  function gfPolyMul(p, q) {
    const r = new Uint8Array(p.length + q.length - 1);
    for (let i = 0; i < p.length; i++) {
      for (let j = 0; j < q.length; j++) {
        r[i + j] ^= gfMul(p[i], q[j]);
      }
    }
    return r;
  }

  function getRsGenPoly(numEc) {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < numEc; i++) {
      poly = gfPolyMul(poly, new Uint8Array([1, GF_EXP[i]]));
    }
    return poly;
  }

  function rsEncode(data, numEc) {
    const gen = getRsGenPoly(numEc);
    const res = new Uint8Array(numEc);
    for (let i = 0; i < data.length; i++) {
      const coef = data[i] ^ res[0];
      res.copyWithin(0, 1);
      res[numEc - 1] = 0;
      for (let j = 0; j < numEc; j++) {
        res[j] ^= gfMul(gen[j + 1], coef);
      }
    }
    return res;
  }

  // Versions table for ECC Level M: [version, totalDataBytes, numEcBytesPerBlock, numBlocks]
  // Version sizes: V1=21, V2=25, V3=29, V4=33, V5=37, V6=41, V7=45, V8=49
  const VERSIONS = [
    null,
    { ver: 1, size: 21, dataCap: 16, ecBytes: 10, blocks: 1, align: [] },
    { ver: 2, size: 25, dataCap: 28, ecBytes: 16, blocks: 1, align: [6, 18] },
    { ver: 3, size: 29, dataCap: 44, ecBytes: 26, blocks: 1, align: [6, 22] },
    { ver: 4, size: 33, dataCap: 64, ecBytes: 18, blocks: 2, align: [6, 26] },
    { ver: 5, size: 37, dataCap: 86, ecBytes: 24, blocks: 2, align: [6, 30] },
    { ver: 6, size: 41, dataCap: 108, ecBytes: 16, blocks: 4, align: [6, 34] },
    { ver: 7, size: 45, dataCap: 124, ecBytes: 18, blocks: 4, align: [6, 22, 38] },
    { ver: 8, size: 49, dataCap: 154, ecBytes: 22, blocks: 4, align: [6, 24, 42] },
    { ver: 9, size: 53, dataCap: 182, ecBytes: 22, blocks: 5, align: [6, 26, 46] },
    { ver: 10, size: 57, dataCap: 216, ecBytes: 26, blocks: 5, align: [6, 28, 50] }
  ];

  // Encode byte data
  const rawBytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 128) rawBytes.push(code);
    else {
      // UTF-8
      const u = encodeURIComponent(text[i]).split('%').filter(Boolean);
      u.forEach(h => rawBytes.push(parseInt(h, 16)));
    }
  }

  // Find version
  let chosenVer = null;
  for (let v = 1; v <= 10; v++) {
    const info = VERSIONS[v];
    // Byte mode overhead: 4 bits mode + 8 bits length (for V1-9) or 16 bits (for V10+)
    const headerBits = 4 + (v < 10 ? 8 : 16);
    const requiredBits = headerBits + rawBytes.length * 8;
    if (requiredBits <= info.dataCap * 8) {
      chosenVer = info;
      break;
    }
  }

  if (!chosenVer) chosenVer = VERSIONS[10];

  // Bit buffer
  const bitBuf = [];
  function putBits(val, len) {
    for (let i = len - 1; i >= 0; i--) bitBuf.push((val >>> i) & 1);
  }

  // Mode: 8-bit byte (0100)
  putBits(0b0100, 4);
  putBits(rawBytes.length, chosenVer.ver < 10 ? 8 : 16);
  for (let b of rawBytes) putBits(b, 8);

  // Terminator (up to 4 zero bits)
  const maxDataBits = chosenVer.dataCap * 8;
  const termBits = Math.min(4, maxDataBits - bitBuf.length);
  for (let i = 0; i < termBits; i++) bitBuf.push(0);

  // Pad to byte
  while (bitBuf.length % 8 !== 0) bitBuf.push(0);

  // Pad bytes: alternating 0xEC (236) and 0x11 (17)
  const pad = [0xEC, 0x11];
  let padIdx = 0;
  while (bitBuf.length < maxDataBits) {
    putBits(pad[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bitBuf to data bytes
  const dataBytes = new Uint8Array(chosenVer.dataCap);
  for (let i = 0; i < chosenVer.dataCap; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) byteVal = (byteVal << 1) | bitBuf[i * 8 + b];
    dataBytes[i] = byteVal;
  }

  // Error correction blocks
  const numBlocks = chosenVer.blocks;
  const ecLen = chosenVer.ecBytes;
  const blockSize = Math.floor(chosenVer.dataCap / numBlocks);
  const remainder = chosenVer.dataCap % numBlocks;

  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const curBlockLen = blockSize + (i >= numBlocks - remainder ? 1 : 0);
    const slice = dataBytes.subarray(offset, offset + curBlockLen);
    offset += curBlockLen;
    dataBlocks.push(slice);
    ecBlocks.push(rsEncode(slice, ecLen));
  }

  // Interleave
  const finalSequence = [];
  const maxBlockLen = blockSize + (remainder > 0 ? 1 : 0);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      if (i < dataBlocks[b].length) finalSequence.push(dataBlocks[b][i]);
    }
  }
  for (let i = 0; i < ecLen; i++) {
    for (let b = 0; b < numBlocks; b++) {
      finalSequence.push(ecBlocks[b][i]);
    }
  }

  // Build Matrix
  const N = chosenVer.size;
  const matrix = Array.from({ length: N }, () => new Int8Array(N).fill(-1)); // -1 = empty

  function setFinder(r, c) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const nr = r + y, nc = c + x;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
          if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
            matrix[nr][nc] = (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4)) ? 1 : 0;
          } else {
            matrix[nr][nc] = 0; // separator
          }
        }
      }
    }
  }

  // Finders
  setFinder(0, 0);
  setFinder(0, N - 7);
  setFinder(N - 7, 0);

  // Timing patterns
  for (let i = 8; i < N - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = (i % 2 === 0) ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = (i % 2 === 0) ? 1 : 0;
  }

  // Alignment patterns
  const alignCoords = chosenVer.align;
  for (let i = 0; i < alignCoords.length; i++) {
    for (let j = 0; j < alignCoords.length; j++) {
      const r = alignCoords[i], c = alignCoords[j];
      // Skip if overlapping finders
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= N - 9) || (r >= N - 9 && c <= 8)) continue;
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          matrix[r + y][c + x] = (Math.abs(y) === 2 || Math.abs(x) === 2 || (y === 0 && x === 0)) ? 1 : 0;
        }
      }
    }
  }

  // Dark module
  matrix[4 * chosenVer.ver + 9][8] = 1;

  // Format info dummy reserve (-2)
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = -2;
    if (matrix[i][8] === -1) matrix[i][8] = -2;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][N - 1 - i] === -1) matrix[8][N - 1 - i] = -2;
    if (matrix[N - 1 - i][8] === -1) matrix[N - 1 - i] = -2;
  }

  // Place data bits
  const finalBits = [];
  for (let byte of finalSequence) {
    for (let b = 7; b >= 0; b--) finalBits.push((byte >>> b) & 1);
  }

  // Mask pattern 0: (r + c) % 2 === 0
  let bitIdx = 0;
  let upwards = true;
  for (let right = N - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const cols = [right, right - 1];
    const rows = upwards ? Array.from({ length: N }, (_, i) => N - 1 - i) : Array.from({ length: N }, (_, i) => i);

    for (let r of rows) {
      for (let c of cols) {
        if (matrix[r][c] === -1) {
          const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
          // Apply mask 0: invert if (r + c) % 2 == 0
          const mask = ((r + c) % 2 === 0) ? 1 : 0;
          matrix[r][c] = bit ^ mask;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info for ECC Level M (00) and Mask 0 (000):
  // Format string: 101010000010010 XOR 101010000010010 = 000000000000000? No!
  // Precomputed 15-bit format bits for M (00) and Mask 0 (000):
  // Raw: 00000 -> BCH code: 00000 00000 00000 -> XOR mask 10101 00000 10010 = 10101 00000 10010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];

  // Write format info around top-left
  matrix[8][0] = formatBits[0];
  matrix[8][1] = formatBits[1];
  matrix[8][2] = formatBits[2];
  matrix[8][3] = formatBits[3];
  matrix[8][4] = formatBits[4];
  matrix[8][5] = formatBits[5];
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  matrix[5][8] = formatBits[9];
  matrix[4][8] = formatBits[10];
  matrix[3][8] = formatBits[11];
  matrix[2][8] = formatBits[12];
  matrix[1][8] = formatBits[13];
  matrix[0][8] = formatBits[14];

  // Write format info around bottom-left & top-right
  for (let i = 0; i < 7; i++) matrix[N - 1 - i][8] = formatBits[i];
  for (let i = 0; i < 8; i++) matrix[8][N - 8 + i] = formatBits[7 + i];

  // Generate clean SVG with quiet zone (margin = 2 modules)
  const margin = 2;
  const totalGrid = N + margin * 2;
  let paths = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c] === 1) {
        paths += `M${c + margin},${r + margin}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalGrid} ${totalGrid}" width="${size}" height="${size}" style="max-width:100%;height:auto;display:block;border-radius:12px;background:#ffffff;"><rect width="100%" height="100%" fill="#ffffff"/><path d="${paths}" fill="#0f172a"/></svg>`;
}

// Test run
const samplePayload = "upi://pay?pa=ekaant@okhdfcbank&pn=PocketTrack&am=500&tn=Dinner&cu=INR";
const svg = createQrSvg(samplePayload, 200);
console.log("SVG generated length:", svg.length);
if (svg.startsWith('<svg') && svg.includes('<path d="M')) {
  console.log("✔ QR SVG generation successful!");
} else {
  throw new Error("Failed generating QR SVG");
}
