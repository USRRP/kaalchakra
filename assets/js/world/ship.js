/* Kaalchakra 2.0 — procedural sailing ship (lofted plank hull, decks, masts, sails, rigging,
   lanterns, cannons, deck props). Used for the Kaalnaav (player ship) and the raider ship.
   Units ≈ metres. Ship faces +x; deck centred at the origin. */
(function () {
  "use strict";
  const T = window.THREE, X = window.KCTex;
  if (!T || !X) return;
  const col = X.col;

  const L = 30;                                   // length
  const beam = (u) => (u < 0.45 ? 2.9 + 1.25 * Math.sin((u / 0.45) * Math.PI / 2) : 4.15 * Math.max(0.02, 1 - Math.pow((u - 0.45) / 0.55, 2.1)));
  const keel = (u) => 3.0 - 1.3 * Math.pow(Math.max(0, u - 0.7) / 0.3, 1.6) - 0.5 * Math.pow(Math.max(0, 0.15 - u) / 0.15, 1.5);
  const sheer = (u) => 2.9 + 2.0 * Math.pow(Math.max(0, 0.22 - u) / 0.22, 1.3) + 1.1 * Math.pow(Math.max(0, u - 0.8) / 0.2, 1.4);
  const DECK = 1.9;                               // main deck height

  function hullGeometry() {
    const NS = 34, NP = 12, pos = [], uv = [], idx = [];
    for (let side = 0; side < 2; side++) {
      const sz = side ? -1 : 1, base = pos.length / 3;
      for (let i = 0; i <= NS; i++) {
        const u = i / NS, x = -L / 2 + u * L, w = beam(u), d = keel(u), h = sheer(u);
        for (let j = 0; j <= NP; j++) {
          const s = j / NP, a = Math.min(1, s * 1.18) * Math.PI / 2;
          const z = w * Math.pow(Math.sin(a), 0.75) * (1 - 0.07 * Math.max(0, s - 0.82) / 0.18);
          const y = -d + (d + h) * Math.pow(s, 1.25);
          pos.push(x, y, z * sz); uv.push(u * 6, s * 1.6);
        }
      }
      for (let i = 0; i < NS; i++) for (let j = 0; j < NP; j++) {
        const a = base + i * (NP + 1) + j, b = a + NP + 1;
        if (sz > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  function transomGeometry() { // flat stern
    const s = new T.Shape(), NP = 12, u = 0, w = beam(u), d = keel(u), h = sheer(u), pts = [];
    for (let j = 0; j <= NP; j++) { const t = j / NP, a = Math.min(1, t * 1.18) * Math.PI / 2; pts.push([w * Math.pow(Math.sin(a), 0.75), -d + (d + h) * Math.pow(t, 1.25)]); }
    s.moveTo(0, pts[0][1]); pts.forEach(([z, y]) => s.lineTo(z, y)); for (let j = NP; j >= 0; j--) s.lineTo(-pts[j][0], pts[j][1]);
    const g = new T.ShapeGeometry(s); g.rotateY(-Math.PI / 2); g.translate(-L / 2, 0, 0); return g;
  }
  function deckShape(inset, from = 0, to = 1) {
    const s = new T.Shape(), N = 30, pts = [];
    for (let i = 0; i <= N; i++) { const u = from + (to - from) * (i / N); pts.push([-L / 2 + u * L, beam(u) * inset]); }
    s.moveTo(pts[0][0], -pts[0][1]); pts.forEach(([x, z]) => s.lineTo(x, -z)); for (let i = N; i >= 0; i--) s.lineTo(pts[i][0], pts[i][1]);
    return s;
  }
  function railCurve(sz, h0) {
    const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push(new T.Vector3(-L / 2 + u * L, sheer(u) + h0, beam(u) * 0.93 * sz)); }
    return new T.CatmullRomCurve3(pts);
  }

  /**
   * opts: { dark: false (raider), detail: 'high'|'low', lights: true }
   */
  function build(opts = {}) {
    const dark = !!opts.dark, hi = opts.detail !== "low";
    const g = new T.Group();
    const hullT = dark ? X.hullDark() : X.hull(), deckT = X.deck();
    hullT.map.repeat.set(1, 1); hullT.bump.repeat.set(1, 1);
    const hullMat = new T.MeshStandardMaterial({ map: hullT.map, bumpMap: hullT.bump, bumpScale: 0.04, roughness: 0.78, metalness: 0.02, side: T.DoubleSide, color: col(dark ? "#9a9086" : "#ffffff") });
    const deckMap = deckT.map.clone(); deckMap.needsUpdate = true; deckMap.repeat.set(0.45, 0.45);
    const deckBump = deckT.bump.clone(); deckBump.needsUpdate = true; deckBump.repeat.set(0.45, 0.45);
    const deckMat = new T.MeshStandardMaterial({ map: deckMap, bumpMap: deckBump, bumpScale: 0.03, roughness: 0.72, color: col(dark ? "#8a8079" : "#ffffff") });
    const woodMat = new T.MeshStandardMaterial({ map: X.wood(), roughness: 0.7, color: col(dark ? "#5a4a3e" : "#c9a27a") });
    const darkWood = new T.MeshStandardMaterial({ map: X.wood(), roughness: 0.75, color: col(dark ? "#3a2c22" : "#7a5236") });
    const iron = new T.MeshStandardMaterial({ color: col("#2a2c30"), roughness: 0.45, metalness: 0.8 });
    const brass = new T.MeshStandardMaterial({ color: col("#b08a3c"), roughness: 0.32, metalness: 0.9 });
    const ropeMat = new T.MeshStandardMaterial({ color: col("#8a7350"), roughness: 0.95 });

    const hull = new T.Mesh(hullGeometry(), hullMat); hull.castShadow = hi; hull.receiveShadow = hi; g.add(hull);
    g.add(new T.Mesh(transomGeometry(), hullMat));
    // stern windows glow
    const wc = document.createElement("canvas"); wc.width = 64; wc.height = 52; const wx = wc.getContext("2d");
    const wg = wx.createRadialGradient(32, 30, 4, 32, 30, 40); wg.addColorStop(0, dark ? "#ff6a2a" : "#ffc06a"); wg.addColorStop(1, dark ? "#7a1408" : "#9a4a10");
    wx.fillStyle = "#1a0e06"; wx.fillRect(0, 0, 64, 52); wx.fillStyle = wg; wx.fillRect(5, 5, 54, 42);
    wx.fillStyle = "#1a0e06"; wx.fillRect(30, 5, 4, 42); wx.fillRect(5, 24, 54, 4); // mullions
    const winTex = new T.CanvasTexture(wc); winTex.encoding = T.sRGBEncoding;
    const winMat = new T.MeshBasicMaterial({ map: winTex, color: col("#b0b0b0") });
    for (let k = -1; k <= 1; k++) { const w = new T.Mesh(new T.PlaneGeometry(0.62, 0.5), winMat); w.position.set(-L / 2 - 0.02, 3.6, k * 1.2); w.rotation.y = -Math.PI / 2; g.add(w); }

    // decks
    const main = new T.Mesh(new T.ShapeGeometry(deckShape(0.94, 0.0, 1.0)), deckMat);
    main.rotation.x = -Math.PI / 2; main.position.y = DECK; main.receiveShadow = hi; g.add(main);
    const qd = new T.Mesh(new T.ShapeGeometry(deckShape(0.92, 0.0, 0.22)), deckMat); qd.rotation.x = -Math.PI / 2; qd.position.y = 3.55; qd.receiveShadow = hi; g.add(qd);
    const qdFront = new T.Mesh(new T.BoxGeometry(0.25, 1.65, beam(0.22) * 1.84), darkWood); qdFront.position.set(-L / 2 + 0.22 * L, DECK + 0.82, 0); g.add(qdFront);
    const fc = new T.Mesh(new T.ShapeGeometry(deckShape(0.9, 0.82, 0.97)), deckMat); fc.rotation.x = -Math.PI / 2; fc.position.y = 2.75; g.add(fc);

    // rails (cap rails along the bulwark tops) + balusters on the quarterdeck
    [1, -1].forEach((sz) => {
      const c = railCurve(sz, 0.08);
      g.add(new T.Mesh(new T.TubeGeometry(c, 60, 0.11, 6, false), darkWood));
      if (hi) for (let i = 1; i < 7; i++) { const p = c.getPoint(i / 34); const b = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 1.0, 8), woodMat); b.position.set(p.x, p.y - 0.55, p.z * 0.97); g.add(b); }
    });

    // masts, yards, sails
    const sails = [], flags = [];
    const masts = [[8.2, 21, 0], [0.2, 25.5, 1], [-8.4, 18, 2]];
    masts.forEach(([x, h, i]) => {
      const m = new T.Mesh(new T.CylinderGeometry(0.22, 0.38, h, 12), woodMat); m.position.set(x, DECK + h / 2, 0); m.castShadow = hi; g.add(m);
      const tiers = i === 1 ? 3 : 2;
      const brace = new T.Group(); brace.position.set(x, 0, 0); brace.rotation.y = 0.42 - i * 0.06; g.add(brace); // yards braced to the wind
      for (let t = i === 2 ? 1 : 0; t < tiers; t++) {
        const w = (i === 1 ? 10.5 : 9) - t * 2.4, sh = (i === 1 ? 5.6 : 5) - t * 1.1;
        const y = DECK + 6.5 + t * 5.4 + (i === 1 ? 0.8 : 0);
        const yard = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, w + 1, 8), woodMat); yard.rotation.x = Math.PI / 2; yard.position.set(0.25, y + sh / 2, 0); brace.add(yard);
        const geo = new T.PlaneGeometry(w, sh, 14, 10); geo.rotateY(Math.PI / 2);
        const tex = X.sail({ dark, tattered: dark, emblem: t === 0 && i === 1 });
        const mat = new T.MeshStandardMaterial({ map: tex, side: T.DoubleSide, roughness: 0.92, transparent: dark, alphaTest: dark ? 0.4 : 0, emissive: col(dark ? "#000000" : "#2a1a08"), emissiveIntensity: 0.25 });
        const sail = new T.Mesh(geo, mat); sail.position.set(0.45, y, 0); sail.castShadow = hi; brace.add(sail);
        sails.push({ mesh: sail, base: Float32Array.from(geo.attributes.position.array), w, h: sh, phase: Math.random() * 6 });
      }
      if (i === 1) { // crow's nest + pennant
        const nest = new T.Mesh(new T.CylinderGeometry(1.0, 0.8, 0.9, 14, 1, true), darkWood); nest.position.set(x, DECK + h - 4, 0); g.add(nest);
        const fg = new T.PlaneGeometry(3.2, 0.9, 10, 1); fg.translate(1.6, 0, 0);
        const fm = new T.MeshStandardMaterial({ color: col(dark ? "#141414" : "#a8261c"), side: T.DoubleSide, roughness: 0.9 });
        const flag = new T.Mesh(fg, fm); flag.position.set(x, DECK + h + 0.3, 0); flag.rotation.y = Math.PI; g.add(flag);
        flags.push({ mesh: flag, base: Float32Array.from(fg.attributes.position.array) });
      }
    });
    // bowsprit + jib
    const sprit = new T.Mesh(new T.CylinderGeometry(0.12, 0.22, 9, 8), woodMat); sprit.rotation.z = -1.2; sprit.position.set(L / 2 + 2.2, 4.2, 0); g.add(sprit);
    const jg = new T.BufferGeometry().setFromPoints([new T.Vector3(8.4, DECK + 19, 0), new T.Vector3(L / 2 + 5.8, 5.9, 0), new T.Vector3(9.4, DECK + 2.5, 0)]);
    jg.setAttribute("uv", new T.Float32BufferAttribute([0.5, 1, 1, 0, 0, 0], 2)); jg.computeVertexNormals();
    g.add(new T.Mesh(jg, new T.MeshStandardMaterial({ map: X.sail({ dark, tattered: dark }), side: T.DoubleSide, roughness: 0.92, transparent: dark, alphaTest: dark ? 0.4 : 0 })));

    // rigging (shrouds + stays)
    const rig = [];
    masts.forEach(([x, h]) => {
      for (let k = 0; k < 5; k++) [1, -1].forEach((sz) => { const u = (x + L / 2) / L; rig.push(x - 1.2 + k * 0.6, sheer(u) + 0.1, beam(u) * 0.9 * sz, x, DECK + h * 0.82, 0); });
    });
    rig.push(8.2, DECK + 20.5, 0, 0.2, DECK + 25, 0, 0.2, DECK + 25, 0, -8.4, DECK + 17.5, 0, 8.2, DECK + 20.5, 0, L / 2 + 5.8, 5.9, 0, -8.4, DECK + 17, 0, -L / 2, 5.4, 0);
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.Float32BufferAttribute(rig, 3));
    g.add(new T.LineSegments(rg, new T.LineBasicMaterial({ color: dark ? 0x1a1410 : 0x3a2a1a, transparent: true, opacity: 0.75 })));

    // cannons through gunports
    for (let k = 0; k < 5; k++) [1, -1].forEach((sz) => {
      const u = 0.3 + k * 0.1, x = -L / 2 + u * L, w = beam(u);
      const port = new T.Mesh(new T.PlaneGeometry(0.8, 0.7), new T.MeshBasicMaterial({ color: 0x0b0806 }));
      port.position.set(x, 1.15, (w + 0.03) * sz); port.rotation.y = sz > 0 ? 0 : Math.PI; g.add(port);
      const c = new T.Mesh(new T.CylinderGeometry(0.16, 0.2, 1.4, 10), iron); c.rotation.x = Math.PI / 2; c.position.set(x, 1.15, (w + 0.3) * sz); g.add(c);
    });

    // lanterns
    const lanterns = [];
    const lampSpots = dark ? [[-L / 2 - 0.4, 5.6, 1.6], [-L / 2 - 0.4, 5.6, -1.6], [0.2, DECK + 9, 0.6]] : [[-L / 2 + 0.6, 5.3, 2.2], [-L / 2 + 0.6, 5.3, -2.2], [0.4, DECK + 3.2, 0.5]];
    lampSpots.forEach(([x, y, z], i) => {
      const glass = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), new T.MeshBasicMaterial({ color: col(dark ? "#e0401c" : "#f0a040") }));
      glass.position.set(x, y, z); g.add(glass);
      // iron frame: cap, base and four bars, so the flame shows through
      const cap = new T.Mesh(new T.ConeGeometry(0.27, 0.2, 6), iron); cap.position.set(x, y + 0.33, z); g.add(cap);
      const base = new T.Mesh(new T.CylinderGeometry(0.24, 0.2, 0.08, 6), iron); base.position.set(x, y - 0.27, z); g.add(base);
      for (let b = 0; b < 4; b++) { const a = (b / 4) * Math.PI * 2 + 0.4, bar = new T.Mesh(new T.BoxGeometry(0.035, 0.52, 0.035), iron); bar.position.set(x + Math.cos(a) * 0.22, y, z + Math.sin(a) * 0.22); g.add(bar); }
      const halo = new T.Sprite(new T.SpriteMaterial({ map: X.soft(), color: dark ? 0xff4422 : 0xffb050, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
      halo.position.set(x, y, z); halo.scale.setScalar(dark ? 3 : 2.4); g.add(halo);
      let light = null;
      if (opts.lights && i < 2) { light = new T.PointLight(dark ? 0xff4422 : 0xffa04a, 1.6, 14, 2); light.position.set(x, y, z); g.add(light); }
      lanterns.push({ halo, light, phase: Math.random() * 10 });
    });

    // deck props (player ship): helm, barrels, crates, rope coils, a treasure chest
    if (!dark && hi) {
      const helm = new T.Group(); helm.position.set(-13.3, 3.55 + 1.2, 0); helm.rotation.y = Math.PI / 2; g.add(helm);
      helm.add(new T.Mesh(new T.TorusGeometry(0.72, 0.06, 8, 32), darkWood));
      for (let k = 0; k < 8; k++) { const sp = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.9, 6), darkWood); sp.rotation.z = (k / 8) * Math.PI; helm.add(sp); }
      helm.add(new T.Mesh(new T.CylinderGeometry(0.14, 0.14, 0.2, 12).rotateX(Math.PI / 2), brass));
      const ped = new T.Mesh(new T.BoxGeometry(0.4, 1.2, 0.4), darkWood); ped.position.set(-13.3, 3.55 + 0.6, 0); g.add(ped);
      const barrel = (x, y, z) => {
        const b = new T.Group(); b.position.set(x, y, z);
        b.add(new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 1.05, 16), woodMat));
        b.add(new T.Mesh(new T.CylinderGeometry(0.48, 0.48, 0.5, 16), woodMat));
        [0.38, -0.38, 0.12, -0.12].forEach((yy) => { const r = new T.Mesh(new T.TorusGeometry(0.47, 0.025, 6, 24), iron); r.rotation.x = Math.PI / 2; r.position.y = yy; b.add(r); });
        b.children.forEach((c) => (c.castShadow = true)); b.position.y += 0.53; g.add(b);
      };
      barrel(-4.5, DECK, 3.1); barrel(-5.3, DECK, 2.6); barrel(5.5, DECK, -3.2);
      const crate = (x, z, s, r) => { const c = new T.Mesh(new T.BoxGeometry(s, s, s), darkWood); c.position.set(x, DECK + s / 2, z); c.rotation.y = r; c.castShadow = true; g.add(c); };
      crate(-6.2, 3.2, 0.9, 0.3); crate(-6.4, 2.2, 0.7, -0.2); crate(4.4, -3.4, 0.8, 0.5);
      const coil = new T.Mesh(new T.TorusGeometry(0.4, 0.09, 8, 24), ropeMat); coil.rotation.x = Math.PI / 2; coil.position.set(-2.8, DECK + 0.1, -2.9); g.add(coil);
      const coil2 = coil.clone(); coil2.position.set(-2.8, DECK + 0.26, -2.9); coil2.scale.setScalar(0.85); g.add(coil2);
      const chest = new T.Group(); chest.position.set(-7.5, DECK, -2.4); chest.rotation.y = 0.4; g.add(chest);
      chest.add(new T.Mesh(new T.BoxGeometry(1.1, 0.6, 0.7), darkWood).translateY(0.3));
      chest.add(new T.Mesh(new T.CylinderGeometry(0.35, 0.35, 1.1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), darkWood).translateY(0.6));
      [-0.35, 0.35].forEach((x) => chest.add(new T.Mesh(new T.BoxGeometry(0.08, 0.95, 0.74), brass).translateX(x).translateY(0.46)));
    }

    function update(t, wind) {
      sails.forEach((s) => {
        const p = s.mesh.geometry.attributes.position, b = s.base, amp = 0.7 + wind * 1.6;
        for (let i = 0; i < p.count; i++) {
          const z = b[i * 3 + 2], y = b[i * 3 + 1], u = z / s.w + 0.5, v = y / s.h + 0.5;
          const billow = Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.85 + 0.25) * amp;
          const flutter = Math.sin(t * (3 + wind * 5) + u * 9 + s.phase) * 0.04 * (0.4 + wind) * (1 - v);
          p.setX(i, b[i * 3] + billow + flutter);
        }
        p.needsUpdate = true; s.mesh.geometry.computeVertexNormals();
      });
      flags.forEach((f) => {
        const p = f.mesh.geometry.attributes.position, b = f.base;
        for (let i = 0; i < p.count; i++) { const x = b[i * 3]; p.setZ(i, Math.sin(t * (5 + wind * 7) - x * 1.6) * 0.18 * (x / 3.2)); }
        p.needsUpdate = true;
      });
      lanterns.forEach((l) => {
        const f = 0.85 + Math.sin(t * 11 + l.phase) * 0.06 + Math.sin(t * 23 + l.phase * 2) * 0.05;
        l.halo.material.opacity = 0.75 * f;
        if (l.light) l.light.intensity = 1.6 * f * (1 + (window.KCW ? window.KCW.danger * 0.8 : 0));
      });
    }
    return { group: g, update, sails, lanterns, DECK, L };
  }

  window.KCShip = { build, DECK, L, beam, sheer };
})();
