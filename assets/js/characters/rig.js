/* Kaalchakra 2.0 — PirateRig: builds a detailed miniature human (≈1.85 m) from a style object.
   Skeleton of nested groups (pelvis → spine → chest → neck → head, arms, legs), layered clothing
   (shirt, vest, coat with swinging skirt, sash, belts, boots), a face with eyelids, brows and mouth,
   hair, hats, and weapons. Materials are PBR with procedural cloth/leather/skin textures.
   Character faces +z; its right side is −x. Requires three r128 + textures.js. */
(function () {
  "use strict";
  const T = window.THREE, X = window.KCTex;
  if (!T || !X) return;
  const col = X.col;

  /* ---------- materials ---------- */
  const mats = {};
  X.cloth().repeat.set(5, 5); X.leather().repeat.set(3, 3); X.hair().repeat.set(2, 2);
  function M(color, kind = "cloth", extra) {
    const key = color + kind + (extra ? JSON.stringify(extra) : "");
    if (mats[key]) return mats[key];
    const o = { color: col(color) };
    if (kind === "cloth") Object.assign(o, { map: X.cloth(), roughness: 0.92, metalness: 0 });
    else if (kind === "stripes") Object.assign(o, { map: X.stripes(), roughness: 0.9, color: col("#ffffff") });
    else if (kind === "leather") Object.assign(o, { map: X.leather(), roughness: 0.55, metalness: 0.05 });
    else if (kind === "skin") Object.assign(o, { map: X.skin(), roughness: 0.6, metalness: 0 });
    else if (kind === "hair") Object.assign(o, { map: X.hair(), roughness: 0.75, metalness: 0 });
    else if (kind === "metal") Object.assign(o, { roughness: 0.25, metalness: 1 });
    else if (kind === "brass") Object.assign(o, { roughness: 0.32, metalness: 1 });
    else if (kind === "wood") Object.assign(o, { map: X.wood(), roughness: 0.7 });
    else if (kind === "basic") return (mats[key] = new T.MeshBasicMaterial({ color: col(color) }));
    if (extra) Object.assign(o, extra);
    return (mats[key] = new T.MeshStandardMaterial(o));
  }

  /* ---------- geometry helpers ---------- */
  const gcache = {};
  const memo = (k, f) => gcache[k] || (gcache[k] = f());
  /** lathe from [r, y] pairs listed bottom → top (outward faces) */
  function lathe(pts, seg = 18, ps = 0, pl = Math.PI * 2) { return new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(Math.max(0.0005, r), y)), seg, ps, pl); }
  /** limb hanging from 0 to −len, radius rTop → rBot, rounded ends */
  function limb(rTop, rBot, len, seg = 14) {
    return memo(`l${rTop}:${rBot}:${len}`, () => lathe([[0.001, -len - rBot * 0.55], [rBot * 0.75, -len - rBot * 0.35], [rBot, -len], [(rTop + rBot) / 2 * 1.04, -len / 2], [rTop, -0.01], [rTop * 0.75, rTop * 0.4], [0.001, rTop * 0.6]], seg));
  }
  const sphere = (r, w = 18, h = 14) => memo(`s${r}:${w}:${h}`, () => new T.SphereGeometry(r, w, h));
  function mesh(geo, mat, o = {}) {
    const m = new T.Mesh(geo, mat);
    if (o.p) m.position.set(o.p[0], o.p[1], o.p[2]);
    if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
    if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]);
    return m;
  }
  const G = (x = 0, y = 0, z = 0) => { const g = new T.Group(); g.position.set(x, y, z); return g; };

  /* ---------- weapons & props ---------- */
  function cutlass() {
    const g = G();
    const s = new T.Shape(); s.moveTo(-0.018, 0); s.lineTo(0.022, 0); s.quadraticCurveTo(0.05, 0.36, 0.0, 0.66); s.lineTo(-0.012, 0.6); s.quadraticCurveTo(0.012, 0.34, -0.018, 0);
    const blade = new T.ExtrudeGeometry(s, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.003, bevelSegments: 1 }); blade.translate(0, 0.07, -0.002);
    g.add(mesh(blade, M("#d9dee4", "metal")));
    g.add(mesh(new T.CylinderGeometry(0.014, 0.016, 0.11, 8), M("#3a2214", "leather"), { p: [0, -0.01, 0] }));
    g.add(mesh(new T.TorusGeometry(0.05, 0.006, 6, 18, Math.PI * 1.2), M("#b8913f", "brass"), { p: [0.02, 0.0, 0], r: [0, Math.PI / 2, 2.2] }));
    g.add(mesh(new T.CylinderGeometry(0.035, 0.035, 0.008, 14), M("#b8913f", "brass"), { p: [0, 0.065, 0] }));
    g.add(mesh(sphere(0.018, 8, 6), M("#b8913f", "brass"), { p: [0, -0.07, 0] }));
    return g;
  }
  function greatsword() {
    const g = G();
    g.add(mesh(new T.BoxGeometry(0.06, 0.95, 0.012), M("#c9ced4", "metal"), { p: [0, 0.6, 0] }));
    g.add(mesh(new T.ConeGeometry(0.03, 0.08, 4), M("#c9ced4", "metal"), { p: [0, 1.11, 0], s: [1, 1, 0.3] }));
    g.add(mesh(new T.BoxGeometry(0.26, 0.03, 0.03), M("#6a6e74", "metal"), { p: [0, 0.12, 0] }));
    g.add(mesh(new T.CylinderGeometry(0.018, 0.02, 0.24, 8), M("#2e1a10", "leather"), { p: [0, 0, 0] }));
    g.add(mesh(sphere(0.026, 8, 6), M("#6a6e74", "metal"), { p: [0, -0.13, 0] }));
    return g;
  }
  function rapier() {
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.003, 0.008, 0.82, 6), M("#dfe3e8", "metal"), { p: [0, 0.48, 0] }));
    g.add(mesh(sphere(0.045, 14, 8), M("#a98a3a", "brass", { side: T.DoubleSide }), { p: [0, 0.07, 0], s: [1, 0.45, 1] }));
    g.add(mesh(new T.BoxGeometry(0.16, 0.012, 0.012), M("#a98a3a", "brass"), { p: [0, 0.075, 0] }));
    g.add(mesh(new T.CylinderGeometry(0.012, 0.014, 0.1, 8), M("#1f1a18", "leather"), { p: [0, 0.01, 0] }));
    return g;
  }
  function pistol() {
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.012, 0.014, 0.3, 10), M("#3a3d42", "metal"), { p: [0, 0.2, 0] }));
    const stock = mesh(new T.BoxGeometry(0.036, 0.16, 0.05), M("#6a3f22", "wood"), { p: [0, 0.03, -0.02], r: [0.5, 0, 0] }); g.add(stock);
    g.add(mesh(new T.BoxGeometry(0.03, 0.05, 0.025), M("#b8913f", "brass"), { p: [0.012, 0.07, 0] }));
    const muzzle = G(0, 0.36, 0); g.add(muzzle); g.userData.muzzle = muzzle;
    return g;
  }
  function dagger() {
    const g = G();
    g.add(mesh(new T.ConeGeometry(0.018, 0.22, 4), M("#cfd4da", "metal"), { p: [0, 0.16, 0], s: [1, 1, 0.25] }));
    g.add(mesh(new T.BoxGeometry(0.07, 0.012, 0.016), M("#5a5e64", "metal"), { p: [0, 0.05, 0] }));
    g.add(mesh(new T.CylinderGeometry(0.011, 0.012, 0.08, 8), M("#2b1d14", "leather"), { p: [0, 0.0, 0] }));
    return g;
  }
  function axe() {
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.014, 0.017, 0.58, 8), M("#7a5130", "wood"), { p: [0, 0.2, 0] }));
    const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0.11, -0.05); s.quadraticCurveTo(0.14, 0.04, 0.11, 0.12); s.lineTo(0, 0.07); s.closePath();
    const head = new T.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }); head.translate(0.012, 0.38, -0.006);
    g.add(mesh(head, M("#8c9097", "metal")));
    return g;
  }
  function bomb() {
    const g = G();
    g.add(mesh(sphere(0.075, 16, 12), M("#141518", "metal", { roughness: 0.5 }), { p: [0, 0.07, 0.02] }));
    g.add(mesh(new T.CylinderGeometry(0.02, 0.02, 0.03, 10), M("#3a3d42", "metal"), { p: [0, 0.15, 0.02] }));
    g.add(mesh(new T.CylinderGeometry(0.003, 0.003, 0.06, 4), M("#c8b28a", "cloth"), { p: [0.01, 0.18, 0.02], r: [0, 0, -0.4] }));
    const spark = new T.Sprite(new T.SpriteMaterial({ map: X.flame(), color: 0xffcf7a, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    spark.position.set(0.025, 0.215, 0.02); spark.scale.setScalar(0.07); g.add(spark); g.userData.spark = spark;
    return g;
  }
  function shovel() {
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.014, 0.014, 0.85, 8), M("#7a5130", "wood"), { p: [0, 0.18, 0] }));
    g.add(mesh(new T.BoxGeometry(0.14, 0.18, 0.012), M("#7d8288", "metal"), { p: [0, 0.68, 0] }));
    return g;
  }
  function lantern() {
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.004, 0.004, 0.08, 4), M("#2a2c30", "metal"), { p: [0, -0.04, 0] }));
    g.add(mesh(new T.CylinderGeometry(0.04, 0.045, 0.11, 6, 1, true), M("#2a2c30", "metal", { side: T.DoubleSide }), { p: [0, -0.14, 0] }));
    const glass = mesh(sphere(0.03, 10, 8), M("#ffd08a", "basic"), { p: [0, -0.14, 0] }); g.add(glass);
    const halo = new T.Sprite(new T.SpriteMaterial({ map: X.soft(), color: 0xffb35a, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending }));
    halo.position.set(0, -0.14, 0); halo.scale.setScalar(0.45); g.add(halo); g.userData.halo = halo;
    return g;
  }
  function flagProp() { // a captured CTF flag on a short pole
    const g = G();
    g.add(mesh(new T.CylinderGeometry(0.008, 0.008, 0.6, 6), M("#5a3a22", "wood"), { p: [0, 0.2, 0] }));
    const f = mesh(new T.PlaneGeometry(0.24, 0.15, 6, 1), M("#c8261e", "cloth", { side: T.DoubleSide }), { p: [0.12, 0.42, 0] }); g.add(f); g.userData.cloth = f;
    return g;
  }
  const WEAPONS = { cutlass, greatsword, rapier, pistol, dagger, axe, bomb, shovel, lantern, flag: flagProp };

  /* ---------- the builder ---------- */
  function build(st) {
    const s = Object.assign({ build: { w: 1, h: 1, belly: 0, limb: 1 }, skin: "#b9875f", eye: "#3b2414" }, st);
    const B = Object.assign({ w: 1, h: 1, belly: 0, limb: 1 }, s.build);
    const root = new T.Group();
    const body = G(); root.add(body);
    const J = { root, body };
    const skin = M(s.skin, "skin");
    const shirtM = s.shirtTex === "stripes" ? M("#ffffff", "stripes") : M(s.shirt || "#e6dcc6", "cloth");
    const trouserM = M(s.trousers || "#3a2f26", "cloth");
    const bootM = M(s.boots || "#3b2416", "leather");
    const hairM = s.hair ? M(s.hair, "hair") : null;
    const beardM = M(s.beardColor || s.hair || "#2b1d14", "hair");
    const sleeveM = s.coat ? M(s.coat.color, "cloth") : s.sleeves === "bare" ? skin : shirtM;
    const cast = (o) => { o.traverse((c) => { if (c.isMesh) c.castShadow = false; }); };

    /* pelvis + legs */
    const pelvis = G(0, 0.95 * B.h, 0); body.add(pelvis); J.pelvis = pelvis;
    pelvis.add(mesh(lathe([[0.12 * B.w, -0.1], [0.155 * B.w, -0.02], [0.16 * B.w, 0.06], [0.15 * B.w, 0.1]]), trouserM, { s: [1, 1, 0.78] }));
    ["L", "R"].forEach((side) => {
      const sx = side === "L" ? 1 : -1;
      const hip = G(0.095 * B.w * sx, -0.05, 0); pelvis.add(hip);
      const knee = G(0, -0.43 * B.h * B.limb, 0); hip.add(knee);
      const ankle = G(0, -0.42 * B.h * B.limb, 0); knee.add(ankle);
      hip.add(mesh(limb(0.088 * B.w, 0.064, 0.42 * B.h * B.limb), trouserM));
      const peg = s.pegLeg === side;
      if (peg) {
        knee.add(mesh(sphere(0.07, 12, 10), trouserM, { s: [1, 0.8, 1] }));
        knee.add(mesh(limb(0.042, 0.026, 0.44 * B.h * B.limb), M("#7a5130", "wood")));
      } else {
        const tall = s.bootStyle !== "short";
        knee.add(mesh(limb(0.064, 0.05, 0.4 * B.h * B.limb), tall ? bootM : trouserM));
        if (tall) knee.add(mesh(lathe([[0.066, -0.11], [0.078, -0.03], [0.086, 0.04]], 16), bootM, { p: [0, -0.02, 0], s: [1, 1, 0.92] })); // folded cuff
        else knee.add(mesh(lathe([[0.055, -0.4 * B.h], [0.062, -0.3 * B.h], [0.058, -0.26 * B.h]], 14), bootM));
        ankle.add(mesh(sphere(0.06, 14, 10), bootM, { p: [0, -0.03, 0.05], s: [0.95, 0.72, 2.2] }));
        ankle.add(mesh(new T.BoxGeometry(0.105, 0.018, 0.27), M("#1c120b", "leather"), { p: [0, -0.068, 0.055] }));
      }
      J["hip" + side] = hip; J["kn" + side] = knee; J["an" + side] = ankle;
    });

    /* spine + chest */
    const spine = G(0, 0.06, 0); pelvis.add(spine); J.spine = spine;
    const belly = B.belly;
    spine.add(mesh(lathe([[0.15 * B.w, -0.02], [(0.155 + belly * 0.06) * B.w, 0.08], [(0.16 + belly * 0.05) * B.w, 0.16], [0.165 * B.w, 0.27]]), s.vest ? M(s.vest, "cloth") : shirtM, { s: [1, 1, 0.8 + belly * 0.15], p: [0, 0, belly * 0.02] }));
    const chest = G(0, 0.26, 0); spine.add(chest); J.chest = chest;
    const chestGeo = lathe([[0.165 * B.w, -0.02], [0.19 * B.w, 0.1], [0.2 * B.w, 0.17], [0.17 * B.w, 0.23], [0.075, 0.27]], 20, Math.PI, Math.PI * 2);
    chest.add(mesh(chestGeo, shirtM, { s: [1.14, 1, 0.76] }));
    if (s.vest) { // waistcoat over the shirt, open at the throat
      chest.add(mesh(lathe([[0.17 * B.w, -0.02], [0.196 * B.w, 0.1], [0.205 * B.w, 0.16], [0.17 * B.w, 0.22]], 20, 0.32, Math.PI * 2 - 0.64), M(s.vest, "cloth", { side: T.DoubleSide }), { s: [1.15, 1, 0.8] }));
      for (let i = 0; i < 4; i++) chest.add(mesh(sphere(0.008, 6, 4), M("#c9a24a", "brass"), { p: [0.03 * B.w, 0.02 + i * 0.045, 0.158 * B.w * 0.8 + 0.004] }));
    }
    // neck + collar
    const neck = G(0, 0.25, 0); chest.add(neck); J.neck = neck;
    neck.add(mesh(limb(0.052, 0.058, 0.09), skin, { r: [Math.PI, 0, 0], p: [0, 0, 0] }));
    if (s.collar !== false) chest.add(mesh(new T.TorusGeometry(0.07, 0.018, 6, 18, Math.PI * 1.3), shirtM, { p: [0, 0.25, -0.005], r: [Math.PI / 2 + 0.25, 0, Math.PI * 0.35] }));

    /* coat: upper shell on the chest + a skirt on the pelvis that swings */
    if (s.coat) {
      const cm = M(s.coat.color, "cloth", { side: T.DoubleSide }), lm = M(s.coat.lining || s.coat.color, "cloth", { side: T.DoubleSide });
      const gap = 0.55;
      chest.add(mesh(lathe([[0.18 * B.w, -0.3], [0.2 * B.w, 0.08], [0.215 * B.w, 0.17], [0.19 * B.w, 0.225], [0.1, 0.26]], 22, gap, Math.PI * 2 - gap * 2), cm, { s: [1.16, 1, 0.82] }));
      // lapels
      [-1, 1].forEach((sx) => chest.add(mesh(new T.BoxGeometry(0.05, 0.2, 0.012), cm, { p: [0.075 * sx, 0.12, 0.165 * B.w], r: [-0.1, 0.35 * sx, 0.25 * sx] })));
      chest.add(mesh(new T.TorusGeometry(0.105, 0.025, 6, 20, Math.PI), cm, { p: [0, 0.235, -0.02], r: [Math.PI / 2 - 0.35, 0, Math.PI] }));
      if (s.coat.trim) for (let i = 0; i < 3; i++) [-1, 1].forEach((sx) => chest.add(mesh(sphere(0.011, 6, 4), M(s.coat.trim, "brass"), { p: [0.1 * sx * B.w, 0.0 + i * 0.06, 0.17 * B.w] })));
      const len = s.coat.length === "ankle" ? 0.82 : s.coat.length === "hip" ? 0.22 : 0.55;
      const skirt = G(0, 0.12, 0); pelvis.add(skirt); J.skirt = skirt;
      skirt.add(mesh(lathe([[0.27 * B.w + len * 0.12, -len], [0.22 * B.w + len * 0.06, -len * 0.5], [0.185 * B.w, -0.05], [0.18 * B.w, 0.06]], 22, gap * 1.2, Math.PI * 2 - gap * 2.4), cm, { s: [1.1, 1, 0.85 + B.belly * 0.15] }));
      skirt.add(mesh(lathe([[0.275 * B.w + len * 0.12, -len], [0.27 * B.w + len * 0.12, -len + 0.04]], 22, gap * 1.2, Math.PI * 2 - gap * 2.4), lm, { s: [1.1, 1, 0.85 + B.belly * 0.15] }));
    }
    /* sash, belt, baldric */
    if (s.sash) {
      pelvis.add(mesh(new T.TorusGeometry(0.162 * B.w, 0.03, 8, 24), M(s.sash, "cloth"), { p: [0, 0.07, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.8 + B.belly * 0.15, 1] }));
      const tails = G(0.13 * B.w, 0.05, 0.07); pelvis.add(tails); J.sashTails = tails;
      tails.add(mesh(limb(0.022, 0.014, 0.16), M(s.sash, "cloth"), { r: [0, 0, 0.12] }));
      tails.add(mesh(limb(0.02, 0.012, 0.13), M(s.sash, "cloth"), { p: [0.02, 0, 0], r: [0, 0, -0.08] }));
    }
    if (s.belt !== false) {
      pelvis.add(mesh(new T.TorusGeometry(0.158 * B.w, 0.014, 6, 24), M("#3e2414", "leather"), { p: [0, 0.0, 0], r: [Math.PI / 2, 0, 0], s: [1, 0.8 + B.belly * 0.15, 1] }));
      pelvis.add(mesh(new T.BoxGeometry(0.045, 0.035, 0.012), M("#b8913f", "brass"), { p: [0, 0.0, 0.128 * B.w + B.belly * 0.03] }));
    }
    if (s.baldric) chest.add(mesh(new T.TorusGeometry(0.23 * B.w, 0.014, 6, 30), M("#43281a", "leather"), { p: [0, 0.03, 0], r: [0.0, 0, 0.62], s: [1, 1, 0.66] }));
    if (s.spyglass) pelvis.add(mesh(new T.CylinderGeometry(0.017, 0.022, 0.2, 10), M("#b8913f", "brass"), { p: [-0.15 * B.w, -0.02, 0.06], r: [0.15, 0, 0.25] }));
    if (s.compass) chest.add(mesh(new T.CylinderGeometry(0.022, 0.022, 0.008, 14), M("#c9a24a", "brass"), { p: [0, 0.13, 0.155 * B.w], r: [Math.PI / 2, 0, 0] }));

    /* arms */
    ["L", "R"].forEach((side) => {
      const sx = side === "L" ? 1 : -1;
      const sh = G(0.205 * B.w * sx, 0.2, 0); chest.add(sh);
      const el = G(0, -0.29 * B.limb, 0); sh.add(el);
      const wr = G(0, -0.265 * B.limb, 0); el.add(wr);
      sh.add(mesh(sphere(0.068 * B.w, 14, 10), sleeveM, { s: [1, 1, 0.95] }));
      sh.add(mesh(limb(0.064 * Math.max(1, B.w * 0.95), 0.052, 0.27 * B.limb), sleeveM));
      el.add(mesh(limb(0.054, 0.042, 0.24 * B.limb), s.sleeves === "rolled" ? skin : sleeveM));
      if (s.coat && s.coat.cuff !== false) el.add(mesh(lathe([[0.072, -0.25 * B.limb], [0.068, -0.19 * B.limb], [0.06, -0.16 * B.limb]], 14), M(s.coat.lining || s.coat.color, "cloth", { side: T.DoubleSide })));
      else if (s.sleeves !== "bare" && s.sleeves !== "rolled") el.add(mesh(lathe([[0.05, -0.25 * B.limb], [0.054, -0.2 * B.limb]], 12), shirtM));
      // hand: palm, fingers, thumb
      const hand = G(); wr.add(hand);
      hand.add(mesh(sphere(0.042, 12, 10), skin, { p: [0, -0.04, 0], s: [0.85, 1.15, 0.6] }));
      hand.add(mesh(sphere(0.032, 10, 8), skin, { p: [0, -0.085, 0.012], s: [0.95, 1.1, 0.75] }));
      hand.add(mesh(limb(0.012, 0.01, 0.045), skin, { p: [-0.03 * sx, -0.03, 0.02], r: [0.4, 0, 0.7 * sx] }));
      const item = G(0, -0.075, 0.012); wr.add(item);
      J["sh" + side] = sh; J["el" + side] = el; J["wr" + side] = wr; J["item" + side] = item;
    });

    /* head + face */
    const head = G(0, 0.085, 0); neck.add(head); J.head = head;
    head.add(mesh(sphere(0.105, 24, 18), skin, { p: [0, 0.115, -0.004], s: [1, 1.12, 1.07] }));
    head.add(mesh(sphere(0.08, 18, 12), skin, { p: [0, 0.05, 0.03], s: [1.02, 0.85, 1] })); // jaw
    head.add(mesh(sphere(0.019, 10, 8), skin, { p: [0, 0.1, 0.112], s: [0.8, 1.4, 1.1], r: [0.3, 0, 0] })); // nose
    head.add(mesh(sphere(0.012, 8, 6), skin, { p: [0, 0.075, 0.122], s: [1.4, 0.8, 1] }));
    [-1, 1].forEach((sx) => head.add(mesh(sphere(0.024, 10, 8), skin, { p: [0.105 * sx, 0.1, -0.005], s: [0.45, 1, 0.8] })));
    // eyes with lids
    const lids = [], eyes = [];
    [-1, 1].forEach((sx) => {
      const e = G(0.04 * sx, 0.124, 0.088); head.add(e); eyes.push(e);
      e.add(mesh(sphere(0.019, 12, 10), M("#f1ebe0", "basic"), { s: [1, 0.9, 0.62] }));
      e.add(mesh(new T.CircleGeometry(0.0105, 14), M(s.eye, "basic"), { p: [0, 0, 0.0122] }));
      e.add(mesh(new T.CircleGeometry(0.005, 10), M("#0b0705", "basic"), { p: [0, 0, 0.0126] }));
      e.add(mesh(new T.CircleGeometry(0.0028, 8), M("#ffffff", "basic"), { p: [0.003, 0.004, 0.013] }));
      const lid = G(0, 0, 0); e.add(lid);
      lid.add(mesh(sphere(0.0215, 12, 8, 0), skin, { s: [1.04, 0.95, 0.7], p: [0, 0.0, 0.0] }));
      lids.push(lid);
      const brow = mesh(new T.BoxGeometry(0.042, 0.009, 0.012), hairM || beardM, { p: [0.04 * sx, 0.156, 0.103], r: [0.2, 0, -0.08 * sx] });
      head.add(brow); J["brow" + (sx > 0 ? "L" : "R")] = brow;
    });
    // eyelid trick: a skin sphere slice that scales to cover the eye
    lids.forEach((l) => { l.children[0].geometry = memo("lid", () => new T.SphereGeometry(0.0215, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)); });
    J.lids = lids; J.eyes = eyes;
    const mouth = mesh(new T.BoxGeometry(0.04, 0.007, 0.01), M("#4a1f16", "basic"), { p: [0.004, 0.06, 0.112] }); head.add(mouth); J.mouth = mouth;
    // beard
    if (s.beard === "full" || s.beard === "trim") {
      head.add(mesh(sphere(0.088, 16, 12), beardM, { p: [0, 0.04, 0.035], s: [1.02, 0.8, 0.95] }));
      [-1, 1].forEach((sx) => head.add(mesh(limb(0.008, 0.005, 0.045), beardM, { p: [0.01 * sx, 0.076, 0.118], r: [0.2, 0, 1.9 * sx] })));
    } else if (s.beard === "goatee") {
      head.add(mesh(sphere(0.035, 10, 8), beardM, { p: [0, 0.018, 0.085], s: [0.9, 1.3, 0.8] }));
      [-1, 1].forEach((sx) => head.add(mesh(limb(0.008, 0.005, 0.04), beardM, { p: [0.01 * sx, 0.076, 0.118], r: [0.1, 0, 1.6 * sx] })));
    } else if (s.beard === "moustache") {
      [-1, 1].forEach((sx) => head.add(mesh(limb(0.016, 0.006, 0.08), beardM, { p: [0.012 * sx, 0.077, 0.118], r: [0.3, 0, 1.25 * sx] })));
    } else if (s.beard === "stubble") {
      head.add(mesh(sphere(0.083, 16, 12), M(s.beardColor || "#3a2a20", "hair", { transparent: true, opacity: 0.45 }), { p: [0, 0.045, 0.033], s: [1.03, 0.82, 0.98] }));
    } else if (s.beard === "thin") {
      [-1, 1].forEach((sx) => head.add(mesh(limb(0.006, 0.004, 0.04), beardM, { p: [0.01 * sx, 0.077, 0.118], r: [0.2, 0, 1.5 * sx] })));
    }
    if (s.mask) head.add(mesh(sphere(0.098, 18, 12, 0), M(s.mask, "cloth"), { p: [0, 0.06, 0.012], s: [1.06, 0.62, 1.08] }));

    // hair
    if (hairM && s.hairStyle !== "bald") {
      head.add(mesh(new T.SphereGeometry(0.11, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), hairM, { p: [0, 0.13, -0.022], s: [1.03, 1.06, 1.08], r: [-0.62, 0, 0] }));
      if (s.hairStyle === "tied") { // tied-back mane on a leather cord + loose locks at the temples
        const tail = G(0, 0.12, -0.11); head.add(tail); J.tail = [tail];
        let prev = tail;
        for (let i = 0; i < 4; i++) {
          const seg = G(0, i === 0 ? 0 : -0.07, 0); prev.add(seg); seg.add(mesh(limb(0.032 - i * 0.005, 0.026 - i * 0.005, 0.075), hairM));
          if (i === 0) seg.add(mesh(new T.TorusGeometry(0.03, 0.007, 6, 14), M("#3e2414", "leather"), { p: [0, -0.01, 0], r: [Math.PI / 2, 0, 0] }));
          if (i > 0) J.tail.push(seg); prev = seg;
        }
        tail.rotation.x = 0.5;
        [-1, 1].forEach((sx) => head.add(mesh(limb(0.011, 0.006, 0.09), hairM, { p: [0.088 * sx, 0.12, 0.05], r: [0.1, 0, -0.12 * sx] })));
      } else if (s.hairStyle === "long") {
        head.add(mesh(lathe([[0.12, -0.08], [0.122, 0.04], [0.112, 0.12]], 18, 1.2, Math.PI * 2 - 2.4), M(s.hair, "hair", { side: T.DoubleSide }), { p: [0, 0.07, -0.01] }));
      }
    }
    // hats
    const hatC = s.hatColor || "#22180f";
    if (s.hat === "tricorn" || s.hat === "bicorne") {
      const hat = G(0, 0.215, -0.004); head.add(hat); J.hat = hat;
      const k = s.hat === "tricorn" ? 3 : 2;
      const g = lathe([[0.215, 0], [0.17, 0.004], [0.112, 0.006]], 72);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z), a = Math.atan2(x, z);
        const t = Math.max(0, (r - 0.11) / 0.105), up = k === 3 ? 0.5 - 0.5 * Math.cos(3 * a) : 0.5 + 0.5 * Math.cos(2 * a);
        p.setY(i, p.getY(i) + Math.pow(t, 1.2) * (k === 3 ? 0.11 : 0.12) * up - t * 0.012);
        if (k === 2) { p.setZ(i, z * (0.55 + 0.45 * Math.abs(Math.sin(a)))); }
      }
      g.computeVertexNormals();
      hat.add(mesh(g, M(hatC, "leather", { side: T.DoubleSide })));
      hat.add(mesh(lathe([[0.112, 0.0], [0.108, 0.06], [0.095, 0.1], [0.001, 0.112]], 24), M(hatC, "leather")));
      // braid along the brim edge
      const edge = []; for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2, up = k === 3 ? 0.5 - 0.5 * Math.cos(3 * a) : 0.5 + 0.5 * Math.cos(2 * a); edge.push(new T.Vector3(Math.sin(a) * 0.215, (k === 3 ? 0.11 : 0.12) * up - 0.012, Math.cos(a) * 0.215 * (k === 2 ? 0.55 + 0.45 * Math.abs(Math.sin(a)) : 1))); }
      hat.add(mesh(new T.TubeGeometry(new T.CatmullRomCurve3(edge, true), 96, 0.006, 5, true), M(s.hatTrim || "#a8843a", "brass", { roughness: 0.5 })));
      if (s.badge) { // the Kaalnaav's wheel badge on the cocked brim
        const b = G(0.085, 0.07, 0.085); b.rotation.set(-0.5, 0.7, 0); hat.add(b);
        b.add(mesh(new T.TorusGeometry(0.022, 0.004, 6, 18), M("#c9a24a", "brass")));
        for (let i = 0; i < 4; i++) b.add(mesh(new T.BoxGeometry(0.054, 0.004, 0.004), M("#c9a24a", "brass"), { r: [0, 0, (i * Math.PI) / 4] }));
      }
      if (s.feather) hat.add(mesh(sphere(0.03, 10, 6), M(s.feather, "cloth"), { p: [-0.09, 0.09, -0.04], s: [0.5, 3.2, 0.6], r: [-0.6, 0, 0.5] }));
    } else if (s.hat === "widebrim") {
      const hat = G(0, 0.21, 0); head.add(hat); J.hat = hat;
      const g = lathe([[0.3, -0.03], [0.2, 0.0], [0.11, 0.004]], 48); hat.add(mesh(g, M(hatC, "leather", { side: T.DoubleSide })));
      hat.add(mesh(lathe([[0.11, 0.0], [0.105, 0.09], [0.09, 0.13], [0.001, 0.14]], 24), M(hatC, "leather")));
      hat.add(mesh(new T.TorusGeometry(0.108, 0.012, 6, 24), M("#5a1a14", "cloth"), { p: [0, 0.02, 0], r: [Math.PI / 2, 0, 0] }));
      if (s.feather) hat.add(mesh(sphere(0.03, 10, 6), M(s.feather, "cloth"), { p: [-0.11, 0.08, -0.03], s: [0.45, 3.5, 0.6], r: [-0.7, 0, 0.6] }));
    } else if (s.hat === "bandana") {
      head.add(mesh(new T.SphereGeometry(0.114, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), M(s.hatColor, "cloth"), { p: [0, 0.135, -0.005], s: [1.02, 0.95, 1.07], r: [-0.12, 0, 0] }));
      const knot = G(0.02, 0.12, -0.11); head.add(knot); J.knot = knot;
      knot.add(mesh(limb(0.02, 0.012, 0.12), M(s.hatColor, "cloth"), { r: [0.4, 0, 0.2] }));
      knot.add(mesh(limb(0.018, 0.01, 0.1), M(s.hatColor, "cloth"), { r: [0.3, 0, -0.25] }));
    } else if (s.hat === "cap") {
      head.add(mesh(lathe([[0.118, 0.0], [0.116, 0.05], [0.1, 0.12], [0.04, 0.16], [0.001, 0.165]], 20), M(s.hatColor, "cloth"), { p: [0, 0.135, -0.01], r: [-0.15, 0, 0] }));
      head.add(mesh(new T.TorusGeometry(0.115, 0.018, 6, 24), M(s.hatColor, "cloth"), { p: [0, 0.14, -0.01], r: [Math.PI / 2 - 0.15, 0, 0] }));
    } else if (s.hat === "hood") {
      head.add(mesh(lathe([[0.2, -0.1], [0.15, 0.0], [0.135, 0.12], [0.1, 0.2], [0.001, 0.24]], 22, 0.9, Math.PI * 2 - 1.8), M(s.hatColor, "cloth", { side: T.DoubleSide }), { p: [0, 0.03, -0.015] }));
    }
    if (s.earring) head.add(mesh(new T.TorusGeometry(0.01, 0.0025, 6, 12), M("#d8b45a", "brass"), { p: [-0.108, 0.075, 0], r: [0, Math.PI / 2, 0] }));

    /* weapons */
    const held = { R: null, L: null };
    const cacheW = {};
    function setItem(side, name) {
      const slot = J["item" + side];
      if (held[side] && held[side].name === name) return held[side].obj;
      if (held[side]) slot.remove(held[side].obj);
      held[side] = null;
      if (!name) return null;
      const key = side + name, obj = cacheW[key] || (cacheW[key] = WEAPONS[name]());
      obj.rotation.set(Math.PI / 2 + 0.15, 0, 0); obj.position.set(0, 0, 0);
      if (name === "lantern" || name === "flag") obj.rotation.set(0, 0, 0);
      if (name === "lantern") obj.position.set(0, 0.03, 0);
      if (name === "bomb") obj.rotation.set(Math.PI, 0, 0);
      if (name === "shovel") obj.rotation.set(Math.PI / 2, 0, 0);
      slot.add(obj); held[side] = { name, obj }; return obj;
    }
    // scabbard on the left hip for the sheathed sword
    let scabbard = null;
    if (s.weapon === "cutlass" || s.weapon === "rapier") {
      scabbard = G(0.15 * B.w, -0.02, 0.02); scabbard.rotation.set(0.3, 0, 0.25); pelvis.add(scabbard);
      scabbard.add(mesh(limb(0.024, 0.014, 0.6), M("#2a1a10", "leather")));
      const hilt = s.weapon === "cutlass" ? cutlass() : rapier(); hilt.scale.setScalar(1); hilt.position.set(0, 0.06, 0); hilt.rotation.set(Math.PI, 0, 0); scabbard.add(hilt);
      J.sheathed = hilt;
    }

    root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return { root, J, style: s, B, setItem, held };
  }

  window.KCRig = { build, M, WEAPONS };
})();
