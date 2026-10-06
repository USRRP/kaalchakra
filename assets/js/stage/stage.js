/* Kaalchakra 2.0 — the actor stage.
   A transparent full-viewport WebGL layer that sits above section backgrounds but *below* page
   content, so Captain Kaal and the raiders can roam anywhere on screen, stand on cards, climb their
   sides and slip behind them — while text and buttons always stay on top and clickable.
   Also owns particles (sparks, smoke, fire, gold, coins, dust), speech bubbles and the captain's
   click target. Requires three r128, world-state, textures, rig, poses, roster, movement. */
(function () {
  "use strict";
  const T = window.THREE, W = window.KCW, X = window.KCTex, R = window.KCRig, C = window.KCRoster, M = window.KCMove;
  if (!T || !W || !X || !R || !C || !M || !W.webgl) return;
  const reduce = W.reduce, small = W.small;

  const canvas = document.createElement("canvas");
  canvas.className = "stage-layer"; canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true }); } catch (e) { canvas.remove(); return; }
  if (!renderer.getContext()) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.4 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;

  const scene = new T.Scene();
  const FOV = 20;
  const camera = new T.PerspectiveCamera(FOV, 1, 1, 10000);
  const hemi = new T.HemisphereLight(0xffffff, 0x333333, 1); scene.add(hemi);
  const key = new T.DirectionalLight(0xffffff, 2); key.position.set(-0.6, 0.8, 1); scene.add(key);
  const rim = new T.DirectionalLight(0xff9050, 1.2); rim.position.set(0.8, 0.5, -1); scene.add(rim);
  const glowLight = new T.PointLight(0xffc060, 0, 600, 2); scene.add(glowLight);
  // a soft studio environment so metal and leather read
  const pm = new T.PMREMGenerator(renderer), envS = new T.Scene();
  const eg = new T.SphereGeometry(10, 16, 8), ec = new Float32Array(eg.attributes.position.count * 3);
  for (let i = 0; i < eg.attributes.position.count; i++) { const y = eg.attributes.position.getY(i) / 10; ec.set([0.25 + y * 0.35, 0.24 + y * 0.32, 0.26 + y * 0.4], i * 3); }
  eg.setAttribute("color", new T.BufferAttribute(ec, 3));
  envS.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  scene.environment = pm.fromScene(envS, 0.035).texture;

  /* ---------------- layout ---------------- */
  let vw = 0, vh = 0;
  function layout() {
    vw = window.innerWidth; vh = window.innerHeight;
    M.vw = vw; M.vh = vh;
    M.S = small ? Math.max(44, Math.min(58, vh * 0.072)) : Math.max(64, Math.min(92, vh * 0.098));
    const hd = document.querySelector(".site-header"); M.headerH = (hd ? hd.offsetHeight : 70) + 6;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    const dist = vh / 2 / Math.tan((FOV / 2) * Math.PI / 180);
    camera.position.set(vw / 2, vh / 2, dist); camera.near = dist * 0.3; camera.far = dist * 3;
    camera.lookAt(vw / 2, vh / 2, 0); camera.updateProjectionMatrix();
    actors.forEach((a) => a.rig.root.scale.setScalar(M.S));
    perchesDirty = true;
  }

  /* ---------------- actors ---------------- */
  const actors = [];
  const blobTex = X.soft();
  function addActor(def) {
    const rig = R.build(def.rig);
    rig.root.scale.setScalar(M.S || 80);
    scene.add(rig.root);
    const a = new M.Actor(def, rig);
    const sh = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: blobTex, color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }));
    scene.add(sh); a.shadow = sh;
    a.bubble = null;
    actors.push(a);
    return a;
  }
  const captain = addActor(C.CAPTAIN);
  captain.rig.setItem("R", null);
  const pool = {};
  const maxEnemies = small ? 2 : 4;
  function spawn(id, opts = {}) {
    const active = actors.filter((a) => a !== captain && a.alive);
    if (active.length >= maxEnemies) return null;
    const def = C.PIRATES.find((p) => p.id === id) || C.PIRATES[Math.floor(Math.random() * C.PIRATES.length)];
    let a = (pool[def.id] || []).find((x) => !x.alive);
    if (!a) { a = addActor(def); (pool[def.id] = pool[def.id] || []).push(a); }
    a.alive = true; a.rig.root.visible = true; a.shadow.visible = true; a.offscreenOk = true; a.stop(); a.anim = "idle"; a.dur = 0; a.hp = def.hp || 1;
    a.weapon = def.weapon;
    a.rig.setItem("R", def.weapon === "dagger" ? "dagger" : def.weapon); a.rig.setItem("L", def.dual ? "dagger" : null);
    const side = opts.side || (Math.random() < 0.5 ? -1 : 1);
    a.surf = { type: "floor" }; a.sx = side < 0 ? -M.S * 1.2 : vw + M.S * 1.2; a.sy = M.floorY(); a.face = -side; a.ry = a.face * 1.15;
    a.depth = -10 - active.length * 6;
    if (opts.x != null) a.sx = opts.x;
    return a;
  }
  function despawn(a) { if (!a || a === captain) return; a.alive = false; a.stop(); a.rig.root.visible = false; a.shadow.visible = false; hideBubble(a); }
  const enemies = () => actors.filter((a) => a !== captain && a.alive);

  /* ---------------- speech bubbles ---------------- */
  function bubbleFor(a) {
    if (a.bubble) return a.bubble;
    const b = document.createElement("div"); b.className = "speech" + (a === captain ? " captain" : " rival"); b.setAttribute("aria-hidden", "true");
    b.innerHTML = '<b class="who"></b><span class="txt"></span>';
    document.body.appendChild(b); a.bubble = b; return b;
  }
  function say(a, text, ms) {
    if (!a) return 0;
    const b = bubbleFor(a);
    clearTimeout(a._bt); clearInterval(a._ti);
    b.classList.add("show");
    // name the speaker when it's a rival, or when the captain is standing behind a card
    const who = b.firstChild, txt = b.lastChild;
    who.textContent = a !== captain || M.occluded(a) ? (a.def && a.def.name) || "" : "";
    if (reduce) txt.textContent = text;
    else { let i = 0; txt.textContent = ""; a._ti = setInterval(() => { i += 2; txt.textContent = text.slice(0, i); if (i >= text.length) clearInterval(a._ti); }, 26); }
    const dur = ms || Math.min(9000, 2000 + text.length * 50);
    a._bt = setTimeout(() => hideBubble(a), dur);
    a.talkingUntil = W.time + dur / 1000;
    return dur;
  }
  function hideBubble(a) { if (a.bubble) a.bubble.classList.remove("show"); clearInterval(a._ti); }
  function placeBubble(a) {
    const b = a.bubble; if (!b || !b.classList.contains("show")) return;
    const head = a.sy - M.S * (a.curAnim === "crouch" || a.curAnim === "peek" ? 1.45 : 2.05);
    const bw = b.offsetWidth || 220, bh = b.offsetHeight || 60;
    let x = Math.max(10, Math.min(vw - bw - 10, a.sx - bw / 2)), y = head - bh - 10;
    const below = y < M.headerH + 6; if (below) y = Math.min(vh - bh - 8, a.sy + 8);
    y = Math.max(M.headerH + 6, y);
    // a speaker who is off screen (up the rigging, past the edge) speaks only to the live region
    b.classList.toggle("off", a.sy < M.headerH - M.S * 0.5 || a.sx < -M.S * 0.6 || a.sx > vw + M.S * 0.6);
    b.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    b.style.setProperty("--tail", Math.max(16, Math.min(bw - 16, a.sx - x)) + "px");
    b.classList.toggle("below", below);
  }

  /* ---------------- particles ---------------- */
  const glowTex = X.soft();
  function pointsSystem(n, size, additive) {
    const g = new T.BufferGeometry(), pos = new Float32Array(n * 3), colr = new Float32Array(n * 3);
    g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("color", new T.BufferAttribute(colr, 3));
    const m = new T.PointsMaterial({ size, sizeAttenuation: false, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending });
    const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 5; scene.add(p);
    const parts = Array.from({ length: n }, () => ({ life: 0 }));
    return { g, pos, colr, parts, n };
  }
  const sparks = pointsSystem(small ? 90 : 180, small ? 4 : 5, true);
  const motes = pointsSystem(small ? 60 : 140, small ? 7 : 10, true);
  let dustT = 0;
  function emit(sys, x, y, n, o) {
    for (let k = 0, i = 0; k < n && i < sys.n; i++) {
      const p = sys.parts[i]; if (p.life > 0) continue; k++;
      p.x = x + (Math.random() - 0.5) * (o.spread || 10); p.y = y + (Math.random() - 0.5) * (o.spreadY || 6);
      const a = (o.angle != null ? o.angle : Math.PI / 2) + (Math.random() - 0.5) * (o.cone || Math.PI * 2);
      const v = (o.speed || 300) * (0.5 + Math.random() * 0.7);
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.g = o.g != null ? o.g : -900; p.life = p.max = (o.life || 0.6) * (0.6 + Math.random() * 0.6);
      p.c = o.color || [1, 0.85, 0.5]; p.drag = o.drag || 0;
    }
  }
  function stepPoints(sys, dt) {
    for (let i = 0; i < sys.n; i++) {
      const p = sys.parts[i];
      if (p.life > 0) {
        p.life -= dt; p.vy += p.g * dt; p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        const k = Math.max(0, p.life / p.max);
        sys.pos.set([p.x, p.y, 40], i * 3); sys.colr.set([p.c[0] * k, p.c[1] * k, p.c[2] * k], i * 3);
      } else { sys.pos.set([0, -9999, 0], i * 3); }
    }
    sys.g.attributes.position.needsUpdate = true; sys.g.attributes.color.needsUpdate = true;
  }
  // smoke + flame sprites
  const sprites = [];
  function puff(kind, x, y, scale, life, vx = 0, vy = 40) {
    const mat = new T.SpriteMaterial({ map: kind === "flame" ? X.flame() : X.smoke(), color: kind === "flame" ? 0xffd08a : kind === "fog" ? 0xc8d0d8 : 0x8c8784, transparent: true, depthWrite: false, opacity: kind === "flame" ? 1 : 0.7, blending: kind === "flame" ? T.AdditiveBlending : T.NormalBlending });
    const s = new T.Sprite(mat); s.position.set(x, y, 50); s.scale.setScalar(scale); s.renderOrder = 6; scene.add(s);
    sprites.push({ s, kind, life, max: life, vx, vy, grow: kind === "flame" ? 1.8 : 0.9, base: scale });
  }
  function stepSprites(dt) {
    for (let i = sprites.length - 1; i >= 0; i--) {
      const p = sprites[i]; p.life -= dt; const k = Math.max(0, p.life / p.max);
      p.s.position.x += p.vx * dt; p.s.position.y += p.vy * dt; p.s.scale.setScalar(p.base * (1 + (1 - k) * p.grow));
      p.s.material.opacity = (p.kind === "flame" ? 1 : p.kind === "fog" ? 0.55 : 0.6) * (p.kind === "flame" ? k : Math.min(1, k * 1.6));
      if (p.life <= 0) { scene.remove(p.s); p.s.material.dispose(); sprites.splice(i, 1); }
    }
  }
  // coins
  const coinGeo = new T.CylinderGeometry(0.11, 0.11, 0.025, 16);
  const coinMat = new T.MeshStandardMaterial({ color: X.col("#e8b84a"), metalness: 1, roughness: 0.25, emissive: X.col("#3a2300") });
  const coins = [];
  function coinBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(coinGeo, coinMat); m.scale.setScalar(M.S); m.position.set(x, y, 30); scene.add(m);
      coins.push({ m, vx: (Math.random() - 0.5) * 340, vy: 300 + Math.random() * 380, life: 1.6, spin: (Math.random() - 0.5) * 18, floor: vh - M.floorY() + 4 });
    }
  }
  function stepCoins(dt) {
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]; c.life -= dt; c.vy -= 1500 * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt;
      if (c.m.position.y < c.floor) { c.m.position.y = c.floor; c.vy *= -0.35; c.vx *= 0.6; }
      c.m.rotation.x += c.spin * dt; c.m.rotation.z += c.spin * 0.6 * dt;
      if (c.life <= 0) { scene.remove(c.m); coins.splice(i, 1); }
    }
  }
  // treasure chest (one, reused)
  const chest = new T.Group(); chest.visible = false; scene.add(chest);
  (function buildChest() {
    const wood = new T.MeshStandardMaterial({ map: X.wood(), color: X.col("#7a4a26"), roughness: 0.7 });
    const iron = new T.MeshStandardMaterial({ color: X.col("#b08a3c"), metalness: 1, roughness: 0.35 });
    const body = new T.Mesh(new T.BoxGeometry(0.9, 0.5, 0.56), wood); body.position.y = 0.25; chest.add(body);
    [-0.3, 0.3].forEach((x) => { const b = new T.Mesh(new T.BoxGeometry(0.07, 0.54, 0.6), iron); b.position.set(x, 0.27, 0); chest.add(b); });
    const lid = new T.Group(); lid.position.set(0, 0.5, -0.28); chest.add(lid);
    const lm = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.9, 16, 1, false, 0, Math.PI), wood); lm.rotation.z = Math.PI / 2; lm.position.z = 0.28; lid.add(lm);
    const gold = new T.Mesh(new T.BoxGeometry(0.78, 0.06, 0.44), new T.MeshBasicMaterial({ color: 0xffd46a })); gold.position.y = 0.49; chest.add(gold);
    chest.userData = { lid, gold };
  })();
  // bomb projectile
  const bombObj = R.WEAPONS.bomb(); bombObj.visible = false; scene.add(bombObj);
  // flag prop (for raids/recoveries rendered on the floor)
  // fog banks that actors can vanish into
  const fogs = [];
  for (let i = 0; i < (small ? 2 : 4); i++) {
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: X.fog().clone(), transparent: true, opacity: 0, depthWrite: false, color: 0xd8dde4 }));
    m.material.map.needsUpdate = true; m.renderOrder = 8; scene.add(m); fogs.push({ m, sp: 8 + i * 5, off: i * 0.31 });
  }
  let localFog = 0; // extra fog an event can raise briefly

  const fx = {
    sparks: (x, y, n = 14) => emit(sparks, x, vh - y, n, { speed: 380, life: 0.35, color: [1, 0.9, 0.55], g: -600 }),
    gold: (x, y, n = 30) => emit(motes, x, vh - y, n, { speed: 120, life: 1.8, color: [1, 0.8, 0.35], g: 60, angle: Math.PI / 2, cone: 1.2, spread: 40, drag: 0.6 }),
    embers: (x, y, n = 12) => emit(motes, x, vh - y, n, { speed: 90, life: 1.6, color: [1, 0.45, 0.15], g: 50, cone: 1.4, spread: 30 }),
    smoke: (x, y, n = 4, s = 1) => { for (let i = 0; i < n; i++) puff("smoke", x + (Math.random() - 0.5) * 30, vh - y + Math.random() * 10, M.S * (0.8 + Math.random() * 0.6) * s, 1.4 + Math.random(), (Math.random() - 0.5) * 30, 30 + Math.random() * 30); },
    fog: (x, y) => { for (let i = 0; i < 5; i++) puff("fog", x + (Math.random() - 0.5) * M.S * 2, vh - y + M.S * (0.3 + Math.random() * 1.2), M.S * 2.4, 2.6, (Math.random() - 0.5) * 20, 6); },
    flash: (x, y) => { puff("flame", x, vh - y, M.S * 0.7, 0.18, 0, 0); },
    explosion: (x, y) => {
      for (let i = 0; i < 6; i++) puff("flame", x + (Math.random() - 0.5) * M.S * 0.8, vh - y + Math.random() * M.S * 0.6, M.S * (0.9 + Math.random() * 0.8), 0.45 + Math.random() * 0.3, (Math.random() - 0.5) * 60, 60);
      fx.smoke(x, y - M.S * 0.3, 6, 1.6); emit(sparks, x, vh - y, 30, { speed: 520, life: 0.6, color: [1, 0.6, 0.25] }); W.shakeIt(0.9); W.emit("sfx", "cannon");
    },
    coins: (x, y, n = 10) => coinBurst(x, vh - y, n),
    fogBurst: (v = 1, ms = 3000) => { localFog = Math.max(localFog, v); setTimeout(() => (localFog = 0), ms); }
  };

  /* ---------------- chest + bomb helpers for events ---------------- */
  const props = {
    showChest(x, y) { chest.visible = true; chest.position.set(x, vh - y, -5); chest.scale.setScalar(M.S * 0.9); chest.userData.lid.rotation.x = 0; chest.userData.y = y; chest.userData.x = x; },
    openChest(k) { chest.userData.lid.rotation.x = -1.6 * k; },
    hideChest() { chest.visible = false; },
    throwBomb(from, to, dur = 0.9) {
      return new Promise((res) => { bombObj.visible = true; bombObj.scale.setScalar(M.S); const t0 = W.time;
        const step = () => { const u = Math.min(1, (W.time - t0) / dur); const x = from.x + (to.x - from.x) * u, y = from.y + (to.y - from.y) * u - Math.sin(Math.PI * u) * M.S * 2.2;
          bombObj.position.set(x, vh - y, 20); bombObj.rotation.z += 0.3; if (u < 1) bombTick = step; else { bombObj.visible = false; bombTick = null; res(); } };
        bombTick = step; });
    }
  };
  let bombTick = null;
  // grappling ropes hanging from the top of the screen (boarding / capture)
  const ropeMat = new T.MeshStandardMaterial({ color: X.col("#8a7350"), roughness: 0.95 });
  const ropes = [];
  props.rope = (x) => {
    const m = new T.Mesh(new T.CylinderGeometry(1, 1, 1, 6), ropeMat); m.renderOrder = 1; scene.add(m);
    const hook = new T.Mesh(new T.TorusGeometry(1, 0.25, 6, 12, Math.PI * 1.3), new T.MeshStandardMaterial({ color: X.col("#5a5e64"), metalness: 1, roughness: 0.4 })); scene.add(hook);
    const r = { m, hook, x, remove() { scene.remove(m); scene.remove(hook); ropes.splice(ropes.indexOf(r), 1); } };
    ropes.push(r); return r;
  };
  function stepRopes() {
    ropes.forEach((r) => {
      const top = vh + 20, bot = vh - M.floorY() + M.S * 0.2, h = top - bot, sway = Math.sin(W.time * 2 + r.x) * 4;
      r.m.scale.set(M.S * 0.025, h, M.S * 0.025); r.m.position.set(r.x + sway, bot + h / 2, -20); r.m.rotation.z = sway * 0.002;
      r.hook.scale.setScalar(M.S * 0.08); r.hook.position.set(r.x + sway, top - 6, -20);
    });
  }

  /* ---------------- captain click target (only when nothing interactive is underneath) ---------------- */
  const hit = document.createElement("button");
  hit.className = "cap-hit"; hit.type = "button"; hit.tabIndex = -1; hit.setAttribute("aria-label", "Talk to Captain Kaal");
  document.body.appendChild(hit);
  let hitCheckT = 0;
  function placeHit() {
    const w = M.S * 0.9, h = M.S * 2.0;
    hit.style.transform = `translate(${Math.round(captain.sx - w / 2)}px, ${Math.round(captain.sy - h)}px)`;
    hit.style.width = w + "px"; hit.style.height = h + "px";
    if (W.time - hitCheckT > 0.25) {
      hitCheckT = W.time;
      hit.style.pointerEvents = "none";
      // clickable only over empty background — never on top of text, cards, links or buttons
      const open = M.isOpenAt(captain.sx, captain.sy - h * 0.55);
      hit.style.pointerEvents = open && captain.rig.root.visible ? "auto" : "none";
    }
  }

  /* ---------------- frame ---------------- */
  let perchesDirty = true, lastScroll = window.scrollY, scrollSpeed = 0, visible = true;
  window.addEventListener("scroll", () => { perchesDirty = true; }, { passive: true });
  function tick(dt) {
    if (!visible) return;
    if (window.innerWidth !== vw || window.innerHeight !== vh) layout();
    const sy = window.scrollY; scrollSpeed = scrollSpeed * 0.8 + ((sy - lastScroll) / Math.max(dt, 0.001)) * 0.2; lastScroll = sy;
    if (Math.abs(scrollSpeed) > 3200) W.emit("scroll:fast", scrollSpeed);
    if (perchesDirty) { M.perches(true); perchesDirty = false; }
    // light from the world behind
    const L = W.light, dark = W.danger;
    key.color.setRGB(L.key[0], L.key[1], L.key[2]); key.intensity = (0.55 + L.keyI * 0.55) * (1 - dark * 0.55);
    hemi.color.setRGB(L.sky[0], L.sky[1], L.sky[2]); hemi.groundColor.setRGB(L.ground[0], L.ground[1], L.ground[2]);
    hemi.intensity = Math.max(0.55, L.ambI * 1.1) * (1 - dark * 0.45) + W.lightning * 2;
    rim.color.setRGB(L.rim[0], L.rim[1], L.rim[2]); rim.intensity = L.rimI * (1 + dark);
    renderer.toneMappingExposure = 1.05 + W.lightning * 0.6;
    glowLight.intensity = W.glow * 3.5; if (chest.visible) glowLight.position.set(chest.position.x, chest.position.y + M.S * 0.8, 120);
    // actors
    for (const a of actors) {
      if (!a.alive) continue;
      a.update(dt);
      const r = a.rig.root;
      r.position.set(a.sx, vh - a.sy, a.depth);
      r.rotation.y = a.ry;
      // contact shadow on the surface under the feet
      const groundY = a.surf.type === "perch" ? a.sy : a.surf.type === "floor" ? M.floorY() : (a.lastGround || M.floorY());
      if (a.surf.type !== "air") a.lastGround = a.sy;
      const air = Math.max(0, groundY - a.sy);
      a.shadow.position.set(a.sx, vh - groundY + 2, a.depth - 1);
      a.shadow.scale.set(M.S * 0.95 * (1 - Math.min(0.5, air / (M.S * 4))), M.S * 0.16, 1);
      a.shadow.material.opacity = (a.curAnim === "climb" || a.curAnim === "slide" ? 0 : 0.42) * (1 - Math.min(1, air / (M.S * 3)));
      placeBubble(a);
      const held = a.rig.held.R; if (held && held.name === "lantern" && held.obj.userData.halo) held.obj.userData.halo.material.opacity = 0.7 + Math.sin(W.time * 12) * 0.08;
      if (held && held.name === "bomb" && held.obj.userData.spark) held.obj.userData.spark.scale.setScalar(0.06 + Math.random() * 0.03);
    }
    if (bombTick) bombTick();
    stepRopes();
    if (chest.visible) chest.position.y = vh - chest.userData.y;
    // Hall of Legends: slow dust drifting through lantern light (a few motes at a time, from the shared pool)
    if (W.page === "logbook" && !reduce) { dustT -= dt; if (dustT <= 0) { dustT = small ? 0.6 : 0.3; emit(motes, Math.random() * vw, Math.random() * vh, 1, { speed: 8, life: 7, color: [0.55, 0.44, 0.3], g: 2, cone: Math.PI * 2, spread: 0, drag: 0.05 }); } }
    stepPoints(sparks, dt); stepPoints(motes, dt); stepSprites(dt); stepCoins(dt);
    // fog banks drifting along the deck line
    const fogAmt = Math.min(1, W.fog * 0.8 + W.danger * 0.35 + localFog * 0.9);
    fogs.forEach((f, i) => {
      f.m.material.opacity += (fogAmt * 0.7 - f.m.material.opacity) * (1 - Math.exp(-dt * 1.5));
      f.m.visible = f.m.material.opacity > 0.01;
      f.m.scale.set(vw * 0.9, M.S * 3.2, 1); f.m.position.set(((W.time * f.sp + i * vw * 0.45) % (vw * 1.6)) - vw * 0.3, vh - M.floorY() + M.S * (0.9 + (i % 2) * 0.6), 60 + i);
      f.m.material.map.offset.x = W.time * 0.01 + f.off;
    });
    // shake the stage with the camera (never the page text)
    if (W.shake > 0.02) { canvas.style.transform = `translate(${(Math.random() - 0.5) * W.shake * 8}px, ${(Math.random() - 0.5) * W.shake * 6}px)`; }
    else if (canvas.style.transform) canvas.style.transform = "";
    placeHit();
    renderer.render(scene, camera);
  }

  function setVisible(on) {
    visible = on; canvas.hidden = !on; hit.hidden = !on;
    actors.forEach((a) => { if (!on) hideBubble(a); });
    if (on) renderer.render(scene, camera);
  }

  layout();
  captain.sx = vw * (small ? 0.76 : 0.84); captain.sy = M.floorY(); captain.face = -1; captain.ry = -1.15;
  W.addTick(tick, 5);

  window.KCStage = { scene, camera, captain, actors, spawn, despawn, enemies, say, hideBubble, fx, props, hit, setVisible, layout, get visible() { return visible; }, get scrollSpeed() { return scrollSpeed; } };
  W.emit("stage:ready");
})();
