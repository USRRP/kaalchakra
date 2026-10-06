/* Kaalchakra 2.0 — procedural textures (canvas, generated once and cached).
   Wood planks, hull, sail cloth, weave, leather, stripes, soft sprites, smoke and fog.
   Real texture files can replace any of these later: see KC.assets in data.js. */
(function () {
  "use strict";
  const T = window.THREE;
  if (!T) return;
  const small = window.KCW ? window.KCW.small : false;
  const cache = {};
  const X = {};

  function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  /** tileable value-noise field 0..1 */
  function noise(w, h, cx, cy, oct, seed, persist = 0.5) {
    const out = new Float32Array(w * h), r = mulberry(seed);
    let amp = 1, total = 0;
    for (let o = 0; o < oct; o++) {
      const gx = cx << o, gy = cy << o, g = new Float32Array(gx * gy);
      for (let i = 0; i < g.length; i++) g[i] = r();
      for (let y = 0; y < h; y++) {
        const fy = (y / h) * gy, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty);
        const r0 = (iy % gy) * gx, r1 = ((iy + 1) % gy) * gx;
        for (let x = 0; x < w; x++) {
          const fx = (x / w) * gx, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx);
          const x0 = ix % gx, x1 = (ix + 1) % gx;
          const a = g[r0 + x0] + (g[r0 + x1] - g[r0 + x0]) * sx;
          const b = g[r1 + x0] + (g[r1 + x1] - g[r1 + x0]) * sx;
          out[y * w + x] += (a + (b - a) * sy) * amp;
        }
      }
      total += amp; amp *= persist;
    }
    for (let i = 0; i < out.length; i++) out[i] /= total;
    return out;
  }
  X.noise = noise;
  const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function tex(c, srgb = true, repeat = true) {
    const t = new T.CanvasTexture(c);
    if (srgb) t.encoding = T.sRGBEncoding;
    if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  }
  function memo(key, fn) { return cache[key] || (cache[key] = fn()); }

  /* ---------- planks: deck & hull ---------- */
  function planks(key, opts) {
    return memo(key, () => {
      const S = small ? 512 : 1024, rows = opts.rows, c = canvas(S, S), g = c.getContext("2d");
      const b = canvas(S, S), bg = b.getContext("2d");
      const img = g.createImageData(S, S), bump = bg.createImageData(S, S);
      const grain = noise(S, S, 3, 48, 4, opts.seed);           // streaks along x
      const wear = noise(S, S, 4, 4, 3, opts.seed + 7);
      const r = mulberry(opts.seed + 3), rowH = S / rows;
      const tones = opts.tones.map(hex);
      const plankOf = []; // per row: joint positions + tone index
      for (let i = 0; i < rows; i++) {
        const joints = []; let x = -r() * S * 0.6;
        while (x < S) { joints.push({ x, tone: Math.floor(r() * tones.length), shift: (r() - 0.5) * 0.08 }); x += S * (0.7 + r() * 0.6); }
        plankOf.push(joints);
      }
      for (let y = 0; y < S; y++) {
        const row = Math.floor(y / rowH), ry = y - row * rowH, joints = plankOf[row];
        const edge = Math.min(ry, rowH - ry);
        for (let x = 0; x < S; x++) {
          let j = joints[0]; for (let k = 0; k < joints.length; k++) if (joints[k].x <= x) j = joints[k];
          const base = tones[j.tone], n = grain[y * S + x], w = wear[y * S + x];
          let shade = 0.74 + n * 0.5 + j.shift + (w - 0.5) * opts.wear;
          let gap = 1;
          if (edge < 1.6) gap = 0.25; else if (edge < 3) gap = 0.7;
          let joint = 1; for (let k = 0; k < joints.length; k++) if (Math.abs(x - joints[k].x) < 1.5) joint = 0.35;
          shade *= gap * joint;
          const i = (y * S + x) * 4;
          img.data[i] = Math.min(255, base[0] * shade); img.data[i + 1] = Math.min(255, base[1] * shade); img.data[i + 2] = Math.min(255, base[2] * shade); img.data[i + 3] = 255;
          const bv = Math.max(0, Math.min(255, (0.55 + n * 0.3) * 255 * gap * joint));
          bump.data[i] = bump.data[i + 1] = bump.data[i + 2] = bv; bump.data[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0); bg.putImageData(bump, 0, 0);
      // nails at plank joints
      g.fillStyle = "rgba(20,14,10,.85)";
      plankOf.forEach((joints, row) => joints.forEach((j) => { [0.28, 0.72].forEach((f) => { g.beginPath(); g.arc(j.x + 6, row * rowH + rowH * f, S / 512, 0, 6.3); g.fill(); }); }));
      if (opts.stripe) { // painted band (hull)
        g.globalAlpha = 0.85; g.fillStyle = opts.stripe; g.fillRect(0, rowH * opts.stripeRow, S, rowH); g.globalAlpha = 1;
        g.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 40; i++) g.fillRect(r() * S, rowH * opts.stripeRow + r() * rowH, r() * 60, 2);
      }
      return { map: tex(c), bump: tex(b, false) };
    });
  }
  X.deck = () => planks("deck", { rows: 8, seed: 11, tones: ["#6a4a30", "#634429", "#6f4e31"], wear: 0.45 });
  X.hull = () => planks("hull", { rows: 10, seed: 29, tones: ["#3d2717", "#45301c", "#352213"], wear: 0.6, stripe: "#8a5a1e", stripeRow: 3 });
  X.hullDark = () => planks("hullDark", { rows: 10, seed: 41, tones: ["#1c1714", "#221b16", "#18130f"], wear: 0.7, stripe: "#5a1414", stripeRow: 3 });

  /* ---------- grain wood (masts, barrels, crates) ---------- */
  X.wood = () => memo("wood", () => {
    const S = small ? 256 : 512, c = canvas(S, S), g = c.getContext("2d"), img = g.createImageData(S, S);
    const n = noise(S, S, 2, 40, 4, 5), base = hex("#7a5434");
    for (let i = 0; i < S * S; i++) { const s = 0.7 + n[i] * 0.5; img.data[i * 4] = base[0] * s; img.data[i * 4 + 1] = base[1] * s; img.data[i * 4 + 2] = base[2] * s; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    return tex(c);
  });

  /* ---------- fabric weave / leather / skin / stripes (grey, tinted by material colour) ---------- */
  function grey(key, S, fn) {
    return memo(key, () => {
      const c = canvas(S, S), g = c.getContext("2d"), img = g.createImageData(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = Math.max(0, Math.min(255, fn(x, y) * 255)), i = (y * S + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0);
      return tex(c);
    });
  }
  X.cloth = () => { const n = noise(256, 256, 8, 8, 4, 77); return grey("cloth", 256, (x, y) => 0.82 + (n[y * 256 + x] - 0.5) * 0.22 + ((x % 4 < 2) ^ (y % 4 < 2) ? 0.05 : -0.03)); };
  X.leather = () => { const n = noise(256, 256, 6, 6, 5, 91), m = noise(256, 256, 24, 24, 2, 92); return grey("leather", 256, (x, y) => 0.7 + (n[y * 256 + x] - 0.5) * 0.45 + (m[y * 256 + x] > 0.72 ? -0.18 : 0)); };
  X.skin = () => { const n = noise(128, 128, 8, 8, 3, 13); return grey("skin", 128, (x, y) => 0.92 + (n[y * 128 + x] - 0.5) * 0.12); };
  X.hair = () => { const n = noise(256, 256, 2, 64, 3, 17); return grey("hair", 256, (x, y) => 0.6 + n[y * 256 + x] * 0.55); };
  X.stripes = () => memo("stripes", () => {
    const c = canvas(128, 128), g = c.getContext("2d");
    g.fillStyle = "#e9e1cf"; g.fillRect(0, 0, 128, 128); g.fillStyle = "#1f2c48";
    for (let y = 0; y < 128; y += 32) g.fillRect(0, y, 128, 14);
    return tex(c);
  });

  /* ---------- sail cloth ---------- */
  X.sail = (opts = {}) => memo("sail" + JSON.stringify(opts), () => {
    const S = small ? 256 : 512, c = canvas(S, S), g = c.getContext("2d");
    const n = noise(S, S, 4, 4, 5, opts.dark ? 51 : 52), img = g.createImageData(S, S);
    const base = hex(opts.dark ? "#3a3530" : "#e6d6b4");
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4, v = n[y * S + x], edge = Math.min(x, S - x, y, S - y) / S;
      let s = 0.82 + (v - 0.5) * 0.35 - (edge < 0.04 ? 0.12 : 0) - Math.max(0, 0.3 - y / S) * 0.15;
      if (x % (S / 6) < 2) s -= 0.12; // panel seams
      img.data[i] = base[0] * s; img.data[i + 1] = base[1] * s; img.data[i + 2] = base[2] * s; img.data[i + 3] = 255;
      if (opts.tattered) { // holes and ragged hem
        const hole = v > 0.74 && ((x * 7 + y * 3) % 5 !== 0);
        const hem = y > S * (0.86 + 0.08 * Math.sin(x * 0.11) + (v - 0.5) * 0.2);
        if (hole || hem) img.data[i + 3] = 0;
      }
    }
    g.putImageData(img, 0, 0);
    if (opts.emblem) { // painted ship's-wheel mark (a supporting mark, not the official logo)
      g.save(); g.translate(S / 2, S * 0.46); g.globalAlpha = 0.72;
      g.strokeStyle = opts.dark ? "#7d1f1a" : "#9b2f22"; g.fillStyle = g.strokeStyle; g.lineWidth = S * 0.028;
      g.beginPath(); g.arc(0, 0, S * 0.15, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(0, 0, S * 0.045, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillRect(-S * 0.012, S * 0.05, S * 0.024, S * 0.16); g.beginPath(); g.arc(0, S * 0.235, S * 0.026, 0, 6.3); g.fill(); }
      g.restore();
    }
    const t = tex(c, true, false);
    return t;
  });

  /* ---------- sprites ---------- */
  X.soft = () => memo("soft", () => {
    const c = canvas(128, 128), g = c.getContext("2d"), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.25, "rgba(255,255,255,.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return tex(c, false, false);
  });
  X.smoke = () => memo("smoke", () => {
    const S = 128, c = canvas(S, S), g = c.getContext("2d"), img = g.createImageData(S, S), n = noise(S, S, 4, 4, 4, 33);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - S / 2, y - S / 2) / (S / 2), i = (y * S + x) * 4, a = Math.max(0, 1 - d) * (0.45 + n[y * S + x] * 0.8);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, a * a * 255);
    }
    g.putImageData(img, 0, 0); return tex(c, false, false);
  });
  X.fog = () => memo("fog", () => {
    const W = 512, H = 256, c = canvas(W, H), g = c.getContext("2d"), img = g.createImageData(W, H), n = noise(W, H, 4, 2, 5, 61);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, v = Math.max(0, n[y * W + x] - 0.32) * 1.6, fall = Math.sin((y / H) * Math.PI);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.min(255, v * fall * 255);
    }
    g.putImageData(img, 0, 0); const t = tex(c, false, true); t.wrapT = T.ClampToEdgeWrapping; return t;
  });
  X.flame = () => memo("flame", () => {
    const c = canvas(128, 128), g = c.getContext("2d"), grd = g.createRadialGradient(64, 76, 4, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,250,220,1)"); grd.addColorStop(0.25, "rgba(255,190,80,.9)"); grd.addColorStop(0.6, "rgba(230,80,20,.45)"); grd.addColorStop(1, "rgba(120,20,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128); return tex(c, false, false);
  });
  /** colour helper: authored sRGB hex → linear THREE.Color */
  X.col = (h) => new T.Color(h).convertSRGBToLinear();

  window.KCTex = X;
})();
