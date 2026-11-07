/* Carnet de Tir Cible — générateur de QR code (hors ligne, sans bibliothèque).
   Mode octets, correction d'erreur M, versions 1 à 6 (jusqu'à 106 caractères : largement assez pour l'adresse de l'appli).
   Script classique : partage ses variables avec les autres fichiers de js/ (voir l'ordre dans index.html). */
'use strict';

/* Par version 1..6 : [mots de code de données, mots de correction par bloc, blocs du groupe 1, mots par bloc du groupe 1, blocs du groupe 2, mots par bloc du groupe 2] (niveau M) */
const QR_M = [null, [16, 10, 1, 16, 0, 0], [28, 16, 1, 28, 0, 0], [44, 26, 1, 44, 0, 0], [64, 18, 2, 32, 0, 0], [86, 24, 2, 43, 0, 0],
  [108, 16, 4, 27, 0, 0]];
const QR_ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

const qrExp = new Array(512), qrLog = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { qrExp[i] = x; qrLog[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) qrExp[i] = qrExp[i - 255]; })();
const qrMul = (a, b) => (a && b ? qrExp[qrLog[a] + qrLog[b]] : 0);

function qrEcc(data, n) {
  let gen = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= qrMul(c, qrExp[i]); });
    gen = next;
  }
  const rem = new Array(n).fill(0);
  data.forEach(b => {
    const f = b ^ rem.shift();
    rem.push(0);
    if (f) gen.slice(1).forEach((c, j) => { rem[j] ^= qrMul(c, f); });
  });
  return rem;
}

/* Renvoie la matrice (tableau de lignes de 0/1) du QR code de `text`, ou null si le texte est trop long. */
function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let ver = 0;
  for (let v = 1; v <= 6; v++) if (bytes.length + 2 <= QR_M[v][0]) { ver = v; break; }
  if (!ver) return null;
  const [cap, eccLen, b1, w1, b2, w2] = QR_M[ver];

  // Flux de bits : mode octets (0100), longueur, données, fin, remplissage
  const bits = [];
  const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < cap; pad ^= 0xec ^ 0x11) data.push(pad);

  // Blocs + correction d'erreur, puis entrelacement
  const blocks = [];
  let pos = 0;
  [[b1, w1], [b2, w2]].forEach(([nb, w]) => { for (let i = 0; i < nb; i++) { const d = data.slice(pos, pos + w); pos += w; blocks.push({ d, e: qrEcc(d, eccLen) }); } });
  const seq = [];
  for (let i = 0; i < Math.max(w1, w2); i++) blocks.forEach(b => { if (i < b.d.length) seq.push(b.d[i]); });
  for (let i = 0; i < eccLen; i++) blocks.forEach(b => seq.push(b.e[i]));

  // Matrice : motifs fixes
  const N = 17 + ver * 4;
  const m = Array.from({ length: N }, () => new Array(N).fill(0));
  const fn = Array.from({ length: N }, () => new Array(N).fill(false));
  const set = (r, c, v) => { if (r >= 0 && r < N && c >= 0 && c < N) { m[r][c] = v ? 1 : 0; fn[r][c] = true; } };
  const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) set(r + i, c + j, i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))); };
  finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
  for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = QR_ALIGN[ver];
  al.forEach(r => al.forEach(c => {
    if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (r === al[al.length - 1] && c === 6)) return;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) set(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
  }));
  set(N - 8, 8, true);                                   // module sombre fixe
  for (let i = 0; i < 9; i++) { if (!fn[8][i]) set(8, i, 0); if (!fn[i][8]) set(i, 8, 0); }   // zones de format (réservées)
  for (let i = 0; i < 8; i++) { set(8, N - 1 - i, 0); set(N - 1 - i, 8, 0); }

  // Placement des données en zigzag
  const dbits = [];
  seq.forEach(b => { for (let i = 7; i >= 0; i--) dbits.push((b >> i) & 1); });
  let k = 0, up = true;
  for (let c = N - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let i = 0; i < N; i++) {
      const r = up ? N - 1 - i : i;
      for (let j = 0; j < 2; j++) { const cc = c - j; if (!fn[r][cc]) { m[r][cc] = k < dbits.length ? dbits[k] : 0; k++; } }
    }
    up = !up;
  }

  // Masque : on essaie les 8 et on garde le meilleur (pénalité de la norme)
  const MASKS = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  const formatBits = mask => {
    let d = (0 << 3 | mask) << 10, rem = d;                // niveau M = 00
    for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    return ((d | rem) ^ 0x5412);
  };
  const build = mask => {
    const g = m.map((row, r) => row.map((v, c) => (fn[r][c] ? v : v ^ (MASKS[mask](r, c) ? 1 : 0))));
    const f = formatBits(mask), bit = i => (f >> i) & 1;
    for (let i = 0; i <= 5; i++) g[i][8] = bit(i);
    g[7][8] = bit(6); g[8][8] = bit(7); g[8][7] = bit(8);
    for (let i = 9; i < 15; i++) g[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) g[8][N - 1 - i] = bit(i);
    for (let i = 8; i < 15; i++) g[N - 15 + i][8] = bit(i);
    g[N - 8][8] = 1;
    return g;
  };
  const penalty = g => {
    let p = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let a = 0; a < N; a++) {
        let run = 1;
        for (let b = 1; b < N; b++) {
          const cur = pass ? g[b][a] : g[a][b], prev = pass ? g[b - 1][a] : g[a][b - 1];
          if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
    }
    for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
    const pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], rev = [...pat].reverse();
    const hit = (get, a, b) => pat.every((v, i) => get(a, b + i) === v) || rev.every((v, i) => get(a, b + i) === v);
    for (let a = 0; a < N; a++) for (let b = 0; b <= N - 11; b++) { if (hit((x, y) => g[x][y], a, b)) p += 40; if (hit((x, y) => g[y][x], a, b)) p += 40; }
    const dark = g.flat().reduce((s, v) => s + v, 0);
    p += Math.floor(Math.abs(dark * 100 / (N * N) - 50) / 5) * 10;
    return p;
  };
  let best = null, bestP = Infinity;
  for (let mask = 0; mask < 8; mask++) { const g = build(mask), p = penalty(g); if (p < bestP) { bestP = p; best = g; } }
  return best;
}

/* QR code en SVG (modules noirs sur fond blanc, avec marge de 4 modules). */
function qrSvg(text, size) {
  const g = qrMatrix(text);
  if (!g) return '';
  const N = g.length, q = 4;
  let d = '';
  g.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${c + q} ${r + q}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N + q * 2} ${N + q * 2}" width="${size || 260}" height="${size || 260}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* Fenêtre « QR code de l'application » (Réglages) : l'adresse de la version en ligne. */
function qrOpen() {
  if (!/^https?:$/.test(location.protocol)) { toast("Le QR code n'est disponible que depuis la version en ligne de l'application."); return; }
  const url = new URL('./', location.href).href;
  $('#qr-box').innerHTML = qrSvg(url, 280) || '<p class="muted" style="margin:0">Adresse trop longue pour un QR code.</p>';
  $('#qr-url').textContent = url;
  $('#dlg-qr').showModal();
}
