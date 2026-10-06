/* Kaalchakra 2.0 — pose library + blending for PirateRig.
   A pose is { joint: [rx, ry, rz], body: [x, y, z, rx, ry, rz], face: {...} }.
   poses.compute(name, ctx) → target pose; poses.apply(rig, target, dt, rate) eases the rig toward it,
   so every transition (walk → fight → hide …) blends instead of snapping. */
(function () {
  "use strict";
  const JOINTS = ["pelvis", "spine", "chest", "neck", "head", "shL", "elL", "wrL", "shR", "elR", "wrR", "hipL", "knL", "anL", "hipR", "knR", "anR"];
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const sin = Math.sin, cos = Math.cos, max = Math.max;

  function blank() {
    const p = { body: [0, 0, 0, 0, 0, 0], face: { lid: 0.15, browL: 0, browR: 0, mouthW: 1, mouthY: 0, smirk: 0.5 } };
    JOINTS.forEach((j) => (p[j] = [0, 0, 0]));
    p.shL = [0.05, 0, 0.1]; p.shR = [0.05, 0, -0.1]; p.elL = [-0.18, 0, 0]; p.elR = [-0.18, 0, 0];
    return p;
  }
  function legsWalk(p, ph, A, knee) {
    p.hipL[0] = -sin(ph) * A; p.hipR[0] = sin(ph) * A;
    p.knL[0] = 0.08 + max(0, cos(ph)) * knee; p.knR[0] = 0.08 + max(0, -cos(ph)) * knee;
    p.anL[0] = -0.15 * cos(ph) - p.knL[0] * 0.25; p.anR[0] = 0.15 * cos(ph) - p.knR[0] * 0.25;
  }
  function stance(p, w = 0.18) { p.hipL[0] = -w; p.hipR[0] = w * 0.6; p.knL[0] = 0.25; p.knR[0] = 0.35; p.anR[0] = -0.2; p.body[1] = -0.03; }
  function handOnHip(p, side) { // knuckles on the hip, elbow out
    if (side === "L") { p.shL = [0.25, -0.35, 0.62]; p.elL = [-1.55, 0, 0]; p.wrL = [0, 0, 0.3]; }
    else { p.shR = [0.25, 0.35, -0.62]; p.elR = [-1.55, 0, 0]; p.wrR = [0, 0, -0.3]; }
  }
  function swordReady(p) { p.shR = [-1.05, 0.15, -0.45]; p.elR = [-1.15, 0, 0]; p.wrR = [0.3, 0, 0]; }

  const LIB = {
    idle(p, c) {
      const b = sin(c.t * 1.6);
      p.body[1] = b * 0.005; p.pelvis[2] = sin(c.t * 0.5) * 0.035; p.chest[0] = 0.02 + b * 0.012; p.spine[2] = -p.pelvis[2] * 0.6;
      p.hipL[0] = -0.04; p.hipR[0] = 0.06; p.knR[0] = 0.12;
      p.head[1] = sin(c.t * 0.37) * 0.25; p.head[0] = sin(c.t * 0.29) * 0.06;
      if (c.style === "captain") { handOnHip(p, "L"); p.shR = [-0.1, 0.1, -0.22]; p.elR = [-0.6, 0, 0]; p.pelvis[1] = 0.12; p.chest[1] = -0.1; }
      else { p.shL[2] = 0.12 + b * 0.02; p.shR[2] = -0.12 - b * 0.02; }
      p.face.smirk = 0.6;
    },
    look(p, c) { LIB.idle(p, c); p.head[1] = sin(c.t * 1.3) * 0.9; p.chest[1] = sin(c.t * 1.3) * 0.3; p.head[0] = -0.08; p.face.browL = 0.6; p.face.browR = 0.2; },
    walk(p, c) {
      const ph = c.phase; legsWalk(p, ph, 0.48, 0.95);
      p.shL[0] = sin(ph) * 0.42; p.shR[0] = -sin(ph) * 0.42; p.elL[0] = p.elR[0] = -0.35;
      p.body[1] = 0.018 * cos(2 * ph) - 0.015; p.pelvis[1] = sin(ph) * 0.1; p.chest[1] = -sin(ph) * 0.14; p.spine[0] = 0.05;
      p.head[1] = c.lookX * 0.4;
      if (c.style === "captain") { p.shR[0] *= 0.6; p.pelvis[2] = sin(ph) * 0.05; p.chest[2] = -sin(ph) * 0.06; } // a bit of swagger
    },
    run(p, c) {
      const ph = c.phase; legsWalk(p, ph, 0.85, 1.6);
      p.shL[0] = sin(ph) * 0.9; p.shR[0] = -sin(ph) * 0.9; p.elL[0] = p.elR[0] = -1.35;
      p.body[1] = 0.04 * cos(2 * ph) - 0.02; p.spine[0] = 0.22; p.chest[0] = 0.08; p.head[0] = -0.2; p.pelvis[1] = sin(ph) * 0.12;
      p.face.browL = p.face.browR = 0.4; p.face.mouthY = 0.4;
    },
    crouch(p, c) {
      p.body[1] = -0.3; p.hipL[0] = -1.35; p.hipR[0] = -0.9; p.knL[0] = 2.1; p.knR[0] = 1.9; p.anL[0] = -0.7; p.anR[0] = -0.5; p.hipR[2] = -0.25;
      p.spine[0] = 0.35; p.chest[0] = 0.25; p.head[0] = -0.4; p.head[1] = sin(c.t * 0.9) * 0.4;
      p.shL = [-0.6, 0, 0.3]; p.elL = [-1.1, 0, 0]; p.shR = [-0.8, 0, -0.3]; p.elR = [-0.9, 0, 0];
      p.face.browL = 0.5; p.face.browR = 0.5; p.face.lid = 0.05;
    },
    peek(p, c) { LIB.crouch(p, c); p.chest[2] = 0.35 * (c.dir || 1); p.head[2] = 0.25 * (c.dir || 1); p.body[1] = -0.22; },
    climb(p, c) {
      const ph = c.phase;
      p.shL = [-2.75 + sin(ph) * 0.35, 0, 0.25]; p.shR = [-2.75 - sin(ph) * 0.35, 0, -0.25]; p.elL[0] = -0.35 - max(0, -sin(ph)) * 0.8; p.elR[0] = -0.35 - max(0, sin(ph)) * 0.8;
      p.hipL[0] = -0.9 + sin(ph) * 0.55; p.hipR[0] = -0.9 - sin(ph) * 0.55; p.knL[0] = 1.3 - sin(ph) * 0.5; p.knR[0] = 1.3 + sin(ph) * 0.5;
      p.spine[0] = -0.1; p.head[0] = -0.35; p.body[2] = 0.05;
    },
    slide(p, c) { p.shL = [-2.9, 0, 0.2]; p.shR = [-2.9, 0, -0.2]; p.elL[0] = p.elR[0] = -0.3; p.hipL[0] = -0.4; p.hipR[0] = -0.25; p.knL[0] = 0.6; p.knR[0] = 0.4; p.head[0] = 0.2; },
    jump(p, c) {
      const u = c.u, crouch = u < 0.18 ? Math.sin((u / 0.18) * Math.PI) : 0, air = u >= 0.12 && u < 0.85 ? 1 : 0, land = u >= 0.85 ? Math.sin(((u - 0.85) / 0.15) * Math.PI) : 0;
      const k = max(crouch, land);
      p.body[1] = -0.2 * k; p.hipL[0] = -0.6 * k - 0.9 * air; p.hipR[0] = -0.5 * k - 0.3 * air; p.knL[0] = 1.2 * k + 1.5 * air; p.knR[0] = 1.1 * k + 0.9 * air;
      p.spine[0] = 0.25 * k + 0.1 * air; p.shL = [-0.6 * air, 0, 0.3 + 0.9 * air]; p.shR = [-0.6 * air, 0, -0.3 - 0.9 * air]; p.elL[0] = p.elR[0] = -0.6;
      p.face.mouthY = 0.5 * air; p.face.browL = p.face.browR = 0.6 * air;
    },
    fall(p, c) {
      const k = ease(clamp01(c.u));
      p.body = [0, -0.68 * k, -0.25 * k, -1.35 * k, 0, 0.1 * k];
      p.shL = [-0.6 * k, 0, 0.6 + 0.7 * k]; p.shR = [-0.4 * k, 0, -0.6 - 0.8 * k]; p.hipL[0] = -0.9 * k; p.knL[0] = 1.1 * k; p.hipR[0] = -0.4 * k; p.knR[0] = 0.4 * k;
      p.head[0] = 0.3 * k; p.face.lid = 0.6; p.face.mouthY = 0.7;
    },
    getup(p, c) { const k = 1 - ease(clamp01(c.u)); LIB.fall(p, Object.assign({}, c, { u: k })); },
    guard(p, c) {
      stance(p); swordReady(p); p.shL = [-0.35, 0, 0.45]; p.elL = [-0.7, 0, 0];
      p.spine[0] = 0.08; p.chest[1] = -0.15; p.body[1] = -0.04 + sin(c.t * 5) * 0.006; p.head[0] = -0.05;
      p.face.browL = -0.4; p.face.browR = -0.5; p.face.lid = 0.1; p.face.smirk = c.style === "captain" ? 0.8 : -0.2;
      if (c.weapon === "pistol") { p.shR = [-1.45, 0, -0.1]; p.elR = [-0.1, 0, 0]; }
      if (c.weapon === "greatsword") { p.shR = [-1.0, 0.4, -0.2]; p.elR = [-1.2, 0, 0]; p.shL = [-1.0, -0.4, 0.2]; p.elL = [-1.2, 0, 0]; }
      if (c.weapon === "bomb") { p.shR = [-0.4, 0, -0.6]; p.elR = [-1.6, 0, 0]; }
    },
    attack(p, c) { // u 0..1: wind-up → strike → recover
      const u = c.u, w = clamp01(u / 0.38), st = clamp01((u - 0.38) / 0.2), rc = clamp01((u - 0.7) / 0.3);
      stance(p, 0.25);
      if (c.weapon === "rapier") {
        p.shR = [-1.55, 0.05, -0.15]; p.elR = [-1.5 * (1 - st) - 0.6 * w * (1 - st) + 1.2 * rc * 0, 0, 0]; p.elR[0] = -1.4 + 1.4 * ease(st) - 1.0 * rc;
        p.body[2] = 0.32 * st * (1 - rc); p.hipL[0] = -0.25 - 0.55 * st * (1 - rc); p.knL[0] = 0.25 + 0.6 * st * (1 - rc);
        p.shL = [-0.2, 0, 0.9]; p.elL[0] = -1.4;
      } else if (c.weapon === "greatsword" || c.weapon === "axe") {
        const a = -2.9 * ease(w) + 3.3 * ease(st) - 0.4 * rc;
        p.shR = [a, 0.3, -0.15]; p.shL = [a, -0.3, 0.15]; p.elR[0] = p.elL[0] = -0.4 - 0.4 * w * (1 - st);
        p.spine[0] = -0.15 * w + 0.4 * st * (1 - rc); p.body[2] = 0.2 * st * (1 - rc); p.body[1] = -0.08 * st;
      } else {
        const a = -2.35 * ease(w) + (2.35 + 0.55) * ease(st) - 0.55 * rc;
        p.shR = [a, 0.1, -0.35 - 0.4 * w + 0.5 * st]; p.elR = [-0.9 * w + 0.8 * st - 0.6 * rc, 0, 0];
        p.chest[1] = -0.5 * w + 0.85 * st - 0.35 * rc; p.spine[0] = 0.25 * st * (1 - rc); p.body[2] = 0.22 * st * (1 - rc);
        p.shL = [-0.3, 0, 0.6 + 0.3 * w]; p.elL[0] = -0.8;
      }
      p.face.browL = -0.6; p.face.browR = -0.6; p.face.mouthY = 0.4 * st; p.face.smirk = 0;
    },
    parry(p, c) { LIB.guard(p, c); p.shR = [-1.75, 0.2, -0.85]; p.elR = [-1.0, 0, 0]; p.chest[0] = -0.12; p.body[2] = -0.06 * Math.sin(Math.PI * clamp01(c.u)); },
    hit(p, c) {
      const k = Math.sin(Math.PI * clamp01(c.u));
      LIB.guard(p, c); p.chest[0] = -0.35 * k; p.spine[0] = -0.2 * k; p.head[0] = -0.4 * k; p.body[2] = -0.2 * k; p.shL[2] = 0.45 + 0.6 * k; p.shR[2] = -0.45 - 0.5 * k;
      p.face.lid = 0.7 * k; p.face.mouthY = 0.6 * k;
    },
    shoot(p, c) {
      const u = clamp01(c.u), rec = u > 0.45 && u < 0.7 ? Math.sin(((u - 0.45) / 0.25) * Math.PI) : 0;
      stance(p); p.shR = [-1.55 - rec * 0.35, 0.05, -0.08]; p.elR = [-0.05 - rec * 0.3, 0, 0]; p.chest[1] = -0.3; p.head[1] = 0.2; p.shL = [0.2, 0, 0.2];
      p.face.lid = 0.45; p.face.browR = -0.6;
    },
    throw(p, c) {
      const u = clamp01(c.u), w = clamp01(u / 0.45), st = clamp01((u - 0.45) / 0.25);
      stance(p, 0.3); p.shR = [-2.6 * ease(w) + 3.0 * ease(st), 0, -0.3]; p.elR = [-1.2 * w + 1.1 * st, 0, 0]; p.chest[1] = -0.6 * w + 0.9 * st; p.spine[0] = -0.15 * w + 0.3 * st;
      p.face.mouthY = 0.6 * st; p.face.browL = 0.5;
    },
    draw(p, c) { // reach across to the left hip, then up into guard
      const u = clamp01(c.u);
      if (u < 0.45) { const k = ease(u / 0.45); p.shR = [-0.5 * k, 0.9 * k, 0.25 * k]; p.elR = [-1.3 * k, 0, 0]; p.chest[1] = 0.35 * k; }
      else { const k = ease((u - 0.45) / 0.55); LIB.guard(p, c); p.shR[0] = -0.5 + (p.shR[0] + 0.5) * k - 1.0 * Math.sin(Math.PI * k); }
      p.face.smirk = 0.9; p.face.browL = 0.5;
    },
    point(p, c) { // point toward c.pointX (-1 left .. 1 right, screen space) and up/down c.pointY
      LIB.idle(p, c); const up = c.pointY || 0;
      p.shR = [-1.45 - up * 0.6, 0, -0.25]; p.elR = [-0.05, 0, 0]; p.chest[1] = 0.15; p.head[0] = -up * 0.3;
      p.face.browL = 0.7; p.face.smirk = 0.8; p.face.mouthY = 0.2;
    },
    wave(p, c) { LIB.idle(p, c); p.shR = [-0.15, 0.1, -2.55]; p.elR = [-0.25, 0, -0.35 + sin(c.t * 9) * 0.45]; p.face.smirk = 0.9; p.face.browL = 0.5; p.face.browR = 0.5; p.face.mouthY = 0.2; },
    talk(p, c) {
      LIB.idle(p, c);
      p.shR = [-0.55 + sin(c.t * 2.3) * 0.32, 0.25, -0.35 - sin(c.t * 1.7) * 0.15]; p.elR = [-1.15 + sin(c.t * 3.1) * 0.35, 0, 0];
      if (c.style !== "captain") { p.shL = [-0.4 + cos(c.t * 1.9) * 0.25, -0.2, 0.4]; p.elL = [-1.0, 0, 0]; }
      p.head[0] = sin(c.t * 4.5) * 0.06; p.head[2] = sin(c.t * 1.3) * 0.08;
      p.face.mouthY = 0.25 + Math.abs(sin(c.t * 13)) * 0.6; p.face.browL = 0.3 + sin(c.t * 2) * 0.3; p.face.smirk = 0.7;
    },
    annoyed(p, c) {
      p.shL = [-0.85, -0.65, 0.2]; p.elL = [-1.95, 0, 0.0]; p.shR = [-0.85, 0.65, -0.2]; p.elR = [-1.95, 0, 0];
      p.hipR[0] = 0.08; p.anR[0] = -0.25 + Math.max(0, sin(c.t * 9)) * 0.35; p.head[2] = 0.12; p.head[0] = 0.08;
      p.face.browL = -0.7; p.face.browR = -0.3; p.face.lid = 0.45; p.face.smirk = -0.5;
    },
    laugh(p, c) { LIB.idle(p, c); p.chest[0] = -0.18 + sin(c.t * 14) * 0.05; p.head[0] = -0.35; p.shR = [-0.2, 0, -0.5]; p.elR[0] = -1.4; p.face.mouthY = 0.9; p.face.lid = 0.55; p.face.browL = p.face.browR = 0.6; },
    trapped(p, c) {
      p.shL = [-0.25, 0, 2.3]; p.shR = [-0.25, 0, -2.3]; p.elL = [-0.3, 0, 0.6]; p.elR = [-0.3, 0, -0.6];
      p.head[1] = sin(c.t * 2.2) * 0.7; p.chest[1] = sin(c.t * 2.2) * 0.2; p.knL[0] = p.knR[0] = 0.18;
      p.face.browL = 0.8; p.face.browR = 0.8; p.face.mouthY = 0.3; p.face.smirk = 0.4;
    },
    victory(p, c) { LIB.idle(p, c); p.shR = [-3.0, 0, -0.15]; p.elR = [-0.15, 0, 0]; handOnHip(p, "L"); p.chest[0] = -0.08; p.head[0] = -0.15; p.face.smirk = 1; p.face.mouthY = 0.35; p.body[1] = Math.abs(sin(c.t * 3)) * 0.01; },
    cheer(p, c) { const j = Math.abs(sin(c.t * 6)); p.body[1] = j * 0.12; p.knL[0] = p.knR[0] = (1 - j) * 0.6; p.hipL[0] = p.hipR[0] = -(1 - j) * 0.3; p.shL = [-0.2, 0, 2.6]; p.shR = [-0.2, 0, -2.6]; p.elL[0] = p.elR[0] = -0.3; p.face.mouthY = 0.8; p.face.browL = p.face.browR = 0.8; },
    dig(p, c) {
      const d = sin(c.t * 6.5);
      p.body[1] = -0.12; p.spine[0] = 0.45 + d * 0.18; p.chest[0] = 0.15; p.hipL[0] = -0.55; p.hipR[0] = -0.2; p.knL[0] = 0.8; p.knR[0] = 0.5;
      p.shR = [-0.9 + d * 0.5, 0, -0.15]; p.shL = [-1.1 + d * 0.5, 0, 0.15]; p.elR[0] = p.elL[0] = -0.45;
    },
    open(p, c) { const k = ease(clamp01(c.u)); p.body[1] = -0.1; p.spine[0] = 0.4 - 0.5 * k; p.shL = [-1.2 - 0.9 * k, 0, 0.3]; p.shR = [-1.2 - 0.9 * k, 0, -0.3]; p.elL[0] = p.elR[0] = -0.4; p.knL[0] = p.knR[0] = 0.4; p.face.mouthY = 0.6 * k; p.face.browL = p.face.browR = 0.8 * k; },
    carry(p, c) { LIB.walk(p, c); p.shR = [-1.0, 0, -0.2]; p.elR = [-1.2, 0, 0]; }, // holding a lantern / flag up front
    sneak(p, c) { const ph = c.phase; legsWalk(p, ph, 0.38, 1.1); p.body[1] = -0.12; p.spine[0] = 0.3; p.knL[0] += 0.4; p.knR[0] += 0.4; p.shL = [-0.6, 0, 0.3]; p.shR = [-0.7, 0, -0.3]; p.elL[0] = p.elR[0] = -1.2; p.head[1] = sin(c.t * 1.1) * 0.5; },
    retreat(p, c) { LIB.run(p, c); p.head[1] = (c.dir || 1) * -0.9; p.face.browL = p.face.browR = 0.9; p.face.mouthY = 0.6; }
  };

  function compute(name, c) {
    const p = blank();
    (LIB[name] || LIB.idle)(p, c);
    // blink
    const bt = (c.t + (c.seed || 0)) % 4.3;
    if (bt < 0.13) p.face.lid = 1;
    return p;
  }

  /** ease rig joints toward the target pose */
  function apply(rig, tp, dt, rate = 10) {
    const J = rig.J, cur = rig.cur || (rig.cur = blank());
    const k = 1 - Math.exp(-dt * rate);
    for (const j of JOINTS) {
      const a = cur[j], b = tp[j];
      a[0] += (b[0] - a[0]) * k; a[1] += (b[1] - a[1]) * k; a[2] += (b[2] - a[2]) * k;
      const o = J[j]; if (o) o.rotation.set(a[0], a[1], a[2]);
    }
    const cb = cur.body, tb = tp.body;
    for (let i = 0; i < 6; i++) cb[i] += (tb[i] - cb[i]) * k;
    J.body.position.set(cb[0], cb[1], cb[2]); J.body.rotation.set(cb[3], cb[4], cb[5]);
    // face (fast, so blinks read)
    const f = cur.face, tf = tp.face, kf = 1 - Math.exp(-dt * 22);
    for (const key in tf) f[key] += (tf[key] - f[key]) * kf;
    J.lids.forEach((l) => (l.rotation.x = -0.75 + f.lid * 2.05));
    if (J.browL) { J.browL.position.y = 0.156 + f.browL * 0.008; J.browL.rotation.z = -0.08 - f.browL * 0.12; }
    if (J.browR) { J.browR.position.y = 0.156 + f.browR * 0.008; J.browR.rotation.z = 0.08 + f.browR * 0.12; }
    if (J.mouth) { J.mouth.scale.set(f.mouthW, 1 + f.mouthY * 3.5, 1); J.mouth.rotation.z = f.smirk * 0.18; J.mouth.position.x = 0.004 + f.smirk * 0.004; }
  }

  /** secondary motion: coat skirt, ponytail and sash tails trail behind movement */
  function secondary(rig, vx, dt, t, wind) {
    const J = rig.J, s = rig.sec || (rig.sec = { skirt: 0, tail: 0 });
    const target = Math.max(-0.5, Math.min(0.5, -vx * 0.0025)) + Math.sin(t * 2.1) * 0.02 * (1 + wind * 2);
    s.skirt += (target - s.skirt) * (1 - Math.exp(-dt * 6));
    if (J.skirt) J.skirt.rotation.x = Math.abs(s.skirt) * 0.6 + Math.max(0, s.skirt) * 0.2;
    s.tail += (target * 1.6 - s.tail) * (1 - Math.exp(-dt * 4));
    if (J.tail) J.tail.forEach((seg, i) => { seg.rotation.x = (i === 0 ? 0.5 : 0) + Math.abs(s.tail) * (0.5 + i * 0.15) + Math.sin(t * 3 + i) * 0.04; seg.rotation.z = Math.sin(t * 1.7 + i) * 0.05 * (1 + wind); });
    if (J.sashTails) J.sashTails.rotation.x = Math.abs(s.skirt) * 0.8 + Math.sin(t * 2.6) * 0.06;
    if (J.knot) J.knot.rotation.x = Math.abs(s.tail) * 0.8 + Math.sin(t * 3.1) * 0.08 * (1 + wind);
  }

  window.KCPoses = { compute, apply, secondary, JOINTS, LIB };
})();
