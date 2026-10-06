/* Kaalchakra 2.0 — AmbientWorld: the realistic sea behind every page.
   Fixed full-screen WebGL layer: physically-flavoured sky with lit clouds, sun/moon/stars,
   Gerstner ocean with sky reflections + sun glitter + foam, the Kaalnaav (player ship),
   a raider ship for events, mist, rain, lightning, gulls, distant islands.
   Scroll drives a cinematic camera path and sunset → dusk → night. Danger Mode turns the
   sea into a storm. Requires three r128, world-state.js, textures.js, ship.js. */
(function () {
  "use strict";
  const T = window.THREE, W = window.KCW, X = window.KCTex, S = window.KCShip;
  const canvas = document.getElementById("world");
  const fail = () => document.documentElement.classList.add("no-webgl");
  if (!canvas || !T || !W || !X || !S || !W.webgl) return fail();
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: !W.small, powerPreference: "high-performance" }); } catch (e) { return fail(); }
  if (!renderer.getContext()) return fail();

  const page = W.page, small = W.small, reduce = W.reduce;
  const MAX_DPR = small ? 1.25 : 1.6;
  let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(dpr);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 0.3, 4000);
  scene.fog = new T.FogExp2(0x000000, 0.0022);
  const lin = X.col;

  /* ---------------- palettes: time of day + storm ---------------- */
  const P = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? lin(v) : v]));
  const SUNSET = P({ zen: "#1c2b55", hor: "#f2925a", sunCol: "#ffcf8c", fog: "#d49676", key: "#ffbf8a", keyI: 2.6, sky: "#8a98bd", ground: "#4a3326", ambI: 0.75, deep: "#0a2133", scatter: "#1d6a73", cLit: "#ffc49a", cDark: "#6a5878", sunVis: 1, night: 0, exposure: 1.0 });
  const DUSK = P({ zen: "#121c3c", hor: "#b4644c", sunCol: "#ff9058", fog: "#4c4250", key: "#e0a07e", keyI: 1.1, sky: "#56607e", ground: "#2a2026", ambI: 0.6, deep: "#071624", scatter: "#163e52", cLit: "#d48a6c", cDark: "#2a2a44", sunVis: 0.45, night: 0.35, exposure: 1.05 });
  const NIGHT = P({ zen: "#02070f", hor: "#10263a", sunCol: "#9fb6ff", fog: "#0c1a28", key: "#a8bce8", keyI: 0.75, sky: "#3c5070", ground: "#0c1016", ambI: 0.55, deep: "#020a12", scatter: "#0b2a3a", cLit: "#5d6c88", cDark: "#0c121c", sunVis: 0, night: 1, exposure: 1.25 });
  const STORM = P({ zen: "#07090e", hor: "#41231b", sunCol: "#ff6a36", fog: "#1d1719", key: "#ff8a5a", keyI: 0.45, sky: "#2b3040", ground: "#140d0c", ambI: 0.45, deep: "#01060a", scatter: "#0b1e24", cLit: "#4c3a38", cDark: "#07080b", sunVis: 0.15, night: 0.6, exposure: 1.15 });
  const KEYS = Object.keys(SUNSET);
  const pal = {}; KEYS.forEach((k) => (pal[k] = typeof SUNSET[k] === "number" ? 0 : new T.Color()));
  function mixPal(a, b, t, out) { KEYS.forEach((k) => { if (typeof a[k] === "number") out[k] = a[k] + (b[k] - a[k]) * t; else out[k].copy(a[k]).lerp(b[k], t); }); }
  const tmpPal = {}; KEYS.forEach((k) => (tmpPal[k] = typeof SUNSET[k] === "number" ? 0 : new T.Color()));
  function computePalette(tod, danger) {
    if (tod < 0.5) mixPal(SUNSET, DUSK, tod / 0.5, tmpPal); else mixPal(DUSK, NIGHT, (tod - 0.5) / 0.5, tmpPal);
    mixPal(tmpPal, STORM, danger * 0.92, pal);
  }

  /* sun + moon directions */
  const sunDir = new T.Vector3(), moonDir = new T.Vector3(-0.45, 0.42, -0.78).normalize();
  function setSun(tod) {
    const e = 0.075 - tod * 0.3; // elevation (rad): low sunset → below horizon
    sunDir.set(0.88 * Math.cos(e), Math.sin(e), -0.47 * Math.cos(e)).normalize();
  }

  /* ---------------- shared GLSL ---------------- */
  const NOISE = `
    float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<OCT;i++){ v+=a*vn(p); p=p*2.02+vec2(17.1,9.3); a*=0.5; } return v; }`;
  const SKY = `
    uniform vec3 uZen, uHor, uSunCol, uSun, uMoon; uniform float uNight, uSunVis;
    vec3 skyBase(vec3 d){
      float h = max(d.y, 0.0);
      vec3 c = mix(uHor, uZen, pow(h, 0.42));
      float s = max(dot(d, uSun), 0.0);
      c += uSunCol * (pow(s, 6.0) * 0.32 + pow(s, 48.0) * 0.7) * uSunVis;
      c += uSunCol * exp(-abs(d.y) * 12.0) * 0.22 * uSunVis * (0.35 + 0.65 * pow(s, 2.0));
      float m = max(dot(d, uMoon), 0.0);
      c += vec3(0.55, 0.65, 0.9) * (pow(m, 30.0) * 0.18 + pow(m, 4.0) * 0.03) * uNight;
      if (d.y < 0.0) c = mix(uHor, uHor * 0.55, clamp(-d.y * 4.0, 0.0, 1.0));
      return c;
    }`;
  const OCT = small ? 3 : 5;

  /* ---------------- sky dome ---------------- */
  const skyU = {
    uZen: { value: pal.zen }, uHor: { value: pal.hor }, uSunCol: { value: pal.sunCol }, uSun: { value: sunDir }, uMoon: { value: moonDir },
    uNight: { value: 0 }, uSunVis: { value: 1 }, uTime: { value: 0 }, uWindT: { value: 0 }, uCover: { value: 0.3 },
    uCLit: { value: pal.cLit }, uCDark: { value: pal.cDark }, uFlash: { value: 0 }
  };
  const sky = new T.Mesh(new T.SphereGeometry(2000, 48, 24), new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    defines: { OCT },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }",
    fragmentShader: `uniform float uTime, uWindT, uCover, uFlash; uniform vec3 uCLit, uCDark; varying vec3 vD;
      ${NOISE} ${SKY}
      void main(){
        vec3 d = normalize(vD);
        vec3 c = skyBase(d);
        float s = max(dot(d, uSun), 0.0);
        c += uSunCol * 3.0 * smoothstep(0.99955, 0.99975, s) * uSunVis;                   // sun disc
        float m = dot(d, uMoon);
        c += vec3(0.85, 0.9, 1.0) * 1.6 * smoothstep(0.99935, 0.9995, m) * uNight;         // moon disc
        if (d.y > 0.0) {
          vec2 sp = d.xz / max(d.y, 0.02) * 220.0;                                          // stars
          float st = step(0.996, h21(floor(sp))) * smoothstep(0.08, 0.5, d.y);
          c += st * (0.5 + 0.5 * sin(uTime * 2.0 + h21(floor(sp)) * 40.0)) * uNight * 0.9;
          vec2 uv = d.xz / (d.y + 0.07) * 0.9 + vec2(uWindT * 0.025, uWindT * 0.008);
          float n = fbm(uv * 0.55) * 0.68 + fbm(uv * 1.9 + 3.1) * 0.32;
          float thr = mix(0.6, 0.3, uCover);
          float cl = smoothstep(thr, thr + 0.22, n);
          vec2 toSun = normalize(uSun.xz + 1e-4) * 0.12;
          float nl = fbm((uv + toSun) * 0.55) * 0.68 + fbm((uv + toSun) * 1.9 + 3.1) * 0.32;
          float lit = clamp((n - nl) * 4.0 + 0.55, 0.0, 1.0);
          vec3 cc = mix(uCDark, uCLit, lit);
          cc += uSunCol * pow(s, 10.0) * 0.8 * uSunVis * (1.0 - cl * 0.6);                 // silver lining
          c = mix(c, cc, cl * smoothstep(0.0, 0.16, d.y) * 0.96);
        }
        c += vec3(0.55, 0.62, 0.85) * uFlash * (0.35 + 0.65 * smoothstep(-0.05, 0.6, d.y));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  sky.frustumCulled = false;
  scene.add(sky);

  /* ---------------- ocean ---------------- */
  const WAVES = [[1.0, 0.3, 0.13, 62], [0.6, 1.0, 0.11, 33], [-0.4, 0.9, 0.09, 19], [0.9, -0.5, 0.07, 11], [-0.7, -0.6, 0.05, 6.3], [0.2, -1.0, 0.04, 3.4]];
  const seaU = {
    uTime: { value: 0 }, uChop: { value: 1 }, uWaves: { value: WAVES.map((w) => new T.Vector4(w[0], w[1], w[2], w[3])) },
    uCam: { value: new T.Vector3() }, uZen: skyU.uZen, uHor: skyU.uHor, uSunCol: skyU.uSunCol, uSun: skyU.uSun, uMoon: skyU.uMoon,
    uNight: skyU.uNight, uSunVis: skyU.uSunVis, uDeep: { value: pal.deep }, uScatter: { value: pal.scatter }, uFog: { value: pal.fog },
    uFogD: { value: 0.0022 }, uFlash: skyU.uFlash, uCover: skyU.uCover, uFoam: { value: 0.2 }
  };
  const SEG = small ? 180 : 300;
  const seaGeo = new T.PlaneGeometry(2, 2, SEG, SEG); seaGeo.rotateX(-Math.PI / 2);
  const sp = seaGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), z = sp.getZ(i); sp.setX(i, Math.sign(x) * Math.pow(Math.abs(x), 2.3) * 1800); sp.setZ(i, Math.sign(z) * Math.pow(Math.abs(z), 2.3) * 1800); }
  const sea = new T.Mesh(seaGeo, new T.ShaderMaterial({
    uniforms: seaU, defines: { OCT: 2 },
    vertexShader: `uniform float uTime, uChop; uniform vec4 uWaves[6]; varying vec3 vW; varying vec3 vN; varying float vH;
      vec3 gw(vec4 w, vec3 p, inout vec3 T, inout vec3 B){
        float st = w.z * uChop; float k = 6.2831853 / w.w; float c = sqrt(9.8 / k); vec2 d = normalize(w.xy);
        float f = k * (dot(d, p.xz) - c * uTime); float a = st / k; float s = sin(f), co = cos(f);
        T += vec3(-d.x*d.x*(st*s), d.x*(st*co), -d.x*d.y*(st*s));
        B += vec3(-d.x*d.y*(st*s), d.y*(st*co), -d.y*d.y*(st*s));
        return vec3(d.x*(a*co), a*s, d.y*(a*co));
      }
      void main(){
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0), q = p;
        for (int i = 0; i < 6; i++) q += gw(uWaves[i], p, T, B);
        vN = normalize(cross(B, T)); vH = q.y; vW = q;
        gl_Position = projectionMatrix * viewMatrix * vec4(q, 1.0);
      }`,
    fragmentShader: `uniform float uTime, uFogD, uFlash, uCover, uFoam; uniform vec3 uCam, uDeep, uScatter, uFog;
      varying vec3 vW; varying vec3 vN; varying float vH;
      ${NOISE} ${SKY}
      void main(){
        float dist = length(vW - uCam);
        vec3 N = normalize(vN);
        vec2 q = vW.xz;
        float r1 = vn(q * 0.9 + uTime * vec2(0.7, 0.4)), r2 = vn(q * 2.3 - uTime * vec2(0.5, 0.9));
        vec2 g = vec2(vn(q * 0.9 + vec2(0.05, 0.0) + uTime * vec2(0.7, 0.4)) - r1, vn(q * 0.9 + vec2(0.0, 0.05) + uTime * vec2(0.7, 0.4)) - r1) * 20.0
               + vec2(vn(q * 2.3 + vec2(0.05, 0.0) - uTime * vec2(0.5, 0.9)) - r2, vn(q * 2.3 + vec2(0.0, 0.05) - uTime * vec2(0.5, 0.9)) - r2) * 9.0;
        N = normalize(N + vec3(-g.x, 0.0, -g.y) * 0.07 * exp(-dist * 0.012));
        vec3 V = normalize(uCam - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 refl = skyBase(R) * (1.0 - uCover * 0.45);
        float lightAmt = 0.25 + 0.75 * uSunVis;
        vec3 body = uDeep + uScatter * clamp(vH * 0.35 + 0.35, 0.0, 1.0) * (0.35 + 0.65 * max(dot(V, -uSun) * 0.5 + 0.5, 0.0)) * lightAmt;
        vec3 col = mix(body, refl, fres);
        float sp = max(dot(R, uSun), 0.0);
        col += uSunCol * (pow(sp, 700.0) * 14.0 + pow(sp, 60.0) * 0.6 + pow(sp, 9.0) * 0.06) * uSunVis * (1.0 - uCover * 0.7);
        float mp = max(dot(R, uMoon), 0.0);
        col += vec3(0.75, 0.82, 1.0) * (pow(mp, 600.0) * 6.0 + pow(mp, 40.0) * 0.25) * uNight * (1.0 - uCover * 0.6);
        float streak = vn(q * vec2(0.9, 2.6) + uTime * 0.3) * vn(q * 1.7 - uTime * 0.2);
        float foam = smoothstep(1.0, 2.3, vH) * (0.6 + 0.4 * vn(q * 1.5 + uTime)) + uFoam * smoothstep(0.42, 0.62, streak) * 0.5 * smoothstep(0.3, 1.4, vH + 0.6);
        col = mix(col, vec3(0.78, 0.82, 0.86) * (0.35 + 0.65 * lightAmt), clamp(foam, 0.0, 1.0) * exp(-dist * 0.004));
        col += vec3(0.5, 0.56, 0.75) * uFlash * 0.35 * fres;
        float fog = 1.0 - exp(-pow(dist * uFogD, 1.35));
        col = mix(col, mix(uFog, skyBase(normalize(vec3(-V.x, 0.02, -V.z))), 0.55), clamp(fog, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  sea.frustumCulled = false;
  scene.add(sea);

  function waveAt(x, z, t, chop) {
    let px = x, py = 0, pz = z;
    for (const w of WAVES) {
      const st = w[2] * chop, k = (Math.PI * 2) / w[3], c = Math.sqrt(9.8 / k), l = Math.hypot(w[0], w[1]);
      const dx = w[0] / l, dz = w[1] / l, f = k * (dx * x + dz * z - c * t), a = st / k;
      py += a * Math.sin(f); px += dx * a * Math.cos(f); pz += dz * a * Math.cos(f);
    }
    return py;
  }

  /* ---------------- lights ---------------- */
  const hemi = new T.HemisphereLight(0xffffff, 0x444444, 0.8); scene.add(hemi);
  const key = new T.DirectionalLight(0xffffff, 2); key.castShadow = !small;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 140 });
  key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
  scene.add(key); scene.add(key.target);

  /* environment map for metals (regenerated when the light changes a lot) */
  const pmrem = new T.PMREMGenerator(renderer);
  const envScene = new T.Scene();
  const envGeo = new T.SphereGeometry(50, 24, 12);
  const envCols = new Float32Array(envGeo.attributes.position.count * 3);
  envGeo.setAttribute("color", new T.BufferAttribute(envCols, 3));
  envScene.add(new T.Mesh(envGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  let envKey = -1, envRT = null;
  function updateEnv() {
    const k = Math.round(W.timeOfDay * 6) + Math.round(W.danger * 3) * 10;
    if (k === envKey) return; envKey = k;
    const p = envGeo.attributes.position, c = new T.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 50; c.copy(pal.hor).lerp(pal.zen, Math.max(0, y));
      if (y < 0) c.copy(pal.deep).multiplyScalar(2);
      const s = Math.max(0, (p.getX(i) * sunDir.x + p.getY(i) * sunDir.y + p.getZ(i) * sunDir.z) / 50);
      c.add(new T.Color().copy(pal.sunCol).multiplyScalar(Math.pow(s, 8) * 2 * pal.sunVis));
      envCols[i * 3] = c.r; envCols[i * 3 + 1] = c.g; envCols[i * 3 + 2] = c.b;
    }
    envGeo.attributes.color.needsUpdate = true;
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(envScene, 0.035); scene.environment = envRT.texture;
  }

  /* ---------------- ships ---------------- */
  const hero = S.build({ detail: small ? "low" : "high", lights: true });
  scene.add(hero.group);
  const raider = S.build({ dark: true, detail: "low", lights: false });
  raider.group.visible = false; scene.add(raider.group);
  const raiderState = { from: new T.Vector3(), to: new T.Vector3(), rotFrom: 0, rotTo: 0, t: 1, dur: 1, fade: 1, fadeTo: 1 };
  raider.group.position.set(420, 0, -520);
  raider.group.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; } });
  function raiderGo(x, z, rot, dur) {
    raider.group.visible = true;
    raiderState.from.copy(raider.group.position); raiderState.to.set(x, 0, z);
    raiderState.rotFrom = raider.group.rotation.y; raiderState.rotTo = rot; raiderState.t = 0; raiderState.dur = reduce ? 0.01 : dur;
  }
  W.on("ship:arrive", () => { raiderState.fadeTo = 1; if (!raider.group.visible) { raider.group.position.set(260, 0, -330); raider.group.rotation.y = 2.6; } raiderGo(115, -88, 2.45, small ? 5 : 8); });
  W.on("ship:alongside", () => { raiderState.fadeTo = 1; if (!raider.group.visible) { raider.group.position.set(160, 0, -120); raider.group.rotation.y = 2.5; } raiderGo(4, -17, Math.PI, small ? 5 : 8); });
  W.on("ship:leave", () => { raiderGo(raider.group.position.x + 180, raider.group.position.z - 260, 0.9, 12); raiderState.fadeTo = 0; });

  /* cannon fire: muzzle flashes + smoke from the raider */
  const fx = [];
  const flashMat = new T.SpriteMaterial({ map: X.flame(), color: 0xffd38a, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  const smokeMat = new T.SpriteMaterial({ map: X.smoke(), color: 0x8a8580, transparent: true, depthWrite: false });
  W.on("ship:cannon", () => {
    if (!raider.group.visible) return;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const local = new T.Vector3(-4 + i * 3, 1.2, 4.6), wp = raider.group.localToWorld(local.clone());
      const f = new T.Sprite(flashMat.clone()); f.position.copy(wp); f.scale.setScalar(5); scene.add(f); fx.push({ o: f, life: 0.25, max: 0.25, kind: "flash", delay: i * 0.18 });
      for (let k = 0; k < 4; k++) { const s = new T.Sprite(smokeMat.clone()); s.position.copy(wp); s.scale.setScalar(3); scene.add(s); fx.push({ o: s, life: 3.5, max: 3.5, kind: "smoke", vx: 1 + Math.random(), vy: 1.2 + Math.random(), delay: i * 0.18 }); }
    }
    W.shakeIt(0.35);
  });
  function updateFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      if (f.delay > 0) { f.delay -= dt; f.o.visible = false; continue; }
      f.o.visible = true; f.life -= dt; const k = Math.max(0, f.life / f.max);
      if (f.kind === "flash") { f.o.material.opacity = k; f.o.scale.setScalar(5 + (1 - k) * 4); }
      else { f.o.position.x += f.vx * dt; f.o.position.y += f.vy * dt; f.o.scale.multiplyScalar(1 + dt * 0.6); f.o.material.opacity = k * 0.7; }
      if (f.life <= 0) { scene.remove(f.o); f.o.material.dispose(); fx.splice(i, 1); }
    }
  }

  /* ---------------- distant islands, mist, gulls ---------------- */
  const islandMat = new T.MeshStandardMaterial({ color: lin("#2c2a2e"), roughness: 1, flatShading: true });
  [[-260, -520, 70, 28], [380, -640, 110, 36], [-560, -300, 50, 18], [640, -160, 60, 22]].forEach(([x, z, r, h]) => {
    const g = new T.ConeGeometry(r, h, 9, 3); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > -h / 2 + 0.1) { p.setX(i, p.getX(i) * (0.8 + Math.random() * 0.4)); p.setY(i, p.getY(i) * (0.85 + Math.random() * 0.3)); }
    g.computeVertexNormals(); const m = new T.Mesh(g, islandMat); m.position.set(x, h / 2 - 3, z); scene.add(m);
  });
  const mists = [];
  const mistMat = new T.MeshBasicMaterial({ map: X.fog(), transparent: true, depthWrite: false, opacity: 0.3, color: 0xffffff });
  for (let i = 0; i < (small ? 4 : 7); i++) {
    const m = new T.Mesh(new T.PlaneGeometry(260, 34), mistMat.clone()); m.material.map = X.fog().clone(); m.material.map.needsUpdate = true;
    m.position.set(-200 + i * 70, 10 + (i % 3) * 4, -120 - (i % 4) * 70); m.lookAt(0, m.position.y, 40); scene.add(m);
    mists.push({ m, speed: 2 + Math.random() * 3, base: m.position.x });
  }
  const gulls = [];
  const gullMat = new T.MeshBasicMaterial({ color: 0x1b1612, side: T.DoubleSide });
  for (let i = 0; i < (small ? 3 : 6); i++) {
    const g = new T.Group(); const wing = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, -0.18), new T.Vector3(0, 0, 0.18), new T.Vector3(1.3, 0.25, 0)]);
    const l = new T.Mesh(wing, gullMat), r = new T.Mesh(wing, gullMat); r.scale.x = -1; g.add(l, r);
    g.userData = { l, r, rad: 22 + Math.random() * 28, h: 22 + Math.random() * 14, sp: 0.1 + Math.random() * 0.08, ph: Math.random() * 6, cx: 20 + Math.random() * 30 };
    scene.add(g); gulls.push(g);
  }

  /* ---------------- rain + lightning ---------------- */
  const RAIN = small ? 450 : 1600;
  const rainGeo = new T.BufferGeometry(), rainPos = new Float32Array(RAIN * 6), rainSeed = new Float32Array(RAIN * 3);
  for (let i = 0; i < RAIN; i++) { rainSeed[i * 3] = Math.random() * 60 - 30; rainSeed[i * 3 + 1] = Math.random() * 40; rainSeed[i * 3 + 2] = Math.random() * 60 - 30; }
  rainGeo.setAttribute("position", new T.BufferAttribute(rainPos, 3));
  const rainMat = new T.LineBasicMaterial({ color: 0xaab6c4, transparent: true, opacity: 0, depthWrite: false });
  const rain = new T.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; scene.add(rain);
  const boltMat = new T.LineBasicMaterial({ color: 0xe8efff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false });
  const bolt = new T.LineSegments(new T.BufferGeometry(), boltMat); bolt.frustumCulled = false; scene.add(bolt);
  W.on("lightning", () => {
    const pts = []; let x = (Math.random() - 0.3) * 600, y = 260, z = -380 - Math.random() * 200;
    while (y > 0) { const nx = x + (Math.random() - 0.5) * 26, ny = y - 12 - Math.random() * 18; pts.push(x, y, z, nx, ny, z); if (Math.random() < 0.18) pts.push(nx, ny, z, nx + (Math.random() - 0.5) * 60, ny - 30, z); x = nx; y = ny; }
    bolt.geometry.dispose(); bolt.geometry = new T.BufferGeometry(); bolt.geometry.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
    boltMat.opacity = 1;
  });

  /* ---------------- camera director ---------------- */
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  // [progress, position, look-at, onShip(1=rides the deck)]
  const PATHS = {
    home: [[0, V3(-12.4, 5.75, -2.6), V3(12, 3.6, -15), 1], [0.12, V3(-10, 10, 1.5), V3(12, 5, -11), 1], [0.32, V3(-14, 16, 22), V3(4, 6, -2), 0.4],
      [0.55, V3(2, 7, 38), V3(0, 8, 0), 0], [0.78, V3(36, 9, 30), V3(-2, 9, -4), 0], [1, V3(70, 26, -60), V3(0, 7, 0), 0]],
    logbook: [[0, V3(-24, 6.5, 9), V3(-6, 5, -2), 0], [1, V3(-30, 9, 18), V3(-4, 6, -4), 0]],
    crew: [[0, V3(-4, 4.2, 6.5), V3(12, 6, -5), 1], [1, V3(-7, 8, 14), V3(10, 7, -6), 0.6]]
  };
  const path = PATHS[page] || PATHS.home;
  const look = new T.Vector3(), camLocal = new T.Vector3(), lookLocal = new T.Vector3(), tmpA = new T.Vector3(), tmpB = new T.Vector3();
  function samplePath(p) {
    let i = 0; while (i < path.length - 2 && p > path[i + 1][0]) i++;
    const a = path[i], b = path[i + 1], t = Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0] || 1))), e = t * t * (3 - 2 * t);
    camLocal.copy(a[1]).lerp(b[1], e); lookLocal.copy(a[2]).lerp(b[2], e);
    return a[3] + (b[3] - a[3]) * e;
  }
  let scrollP = 0, pointerX = 0, pointerY = 0, px = 0, py = 0;
  const readScroll = () => { const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); scrollP = Math.min(1, Math.max(0, window.scrollY / max)); };
  window.addEventListener("scroll", () => { readScroll(); if (reduce) dirty = true; }, { passive: true });
  window.addEventListener("pointermove", (e) => { pointerX = e.clientX / window.innerWidth - 0.5; pointerY = e.clientY / window.innerHeight - 0.5; }, { passive: true });

  /* ---------------- frame ---------------- */
  const shipTilt = { pitch: 0, roll: 0, y: 0 };
  let dirty = true, avg = 16, frames = 0;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 66 : 50; camera.updateProjectionMatrix(); readScroll(); dirty = true;
  }
  function frame(dt, t) {
    if (reduce && !dirty) return;
    dirty = false;
    const tod = page === "home" ? Math.min(1, scrollP * 1.1) : page === "logbook" ? 0.92 : 0.55;
    W.timeOfDay = tod;
    setSun(tod);
    computePalette(tod, W.danger);
    const dz = W.danger;
    // sky + sea uniforms
    skyU.uNight.value = pal.night; skyU.uSunVis.value = pal.sunVis * (sunDir.y > -0.06 ? 1 : 0.3);
    skyU.uTime.value = t; skyU.uWindT.value += dt * (0.6 + W.wind * 3.2);
    skyU.uCover.value = 0.28 + dz * 0.7 + W.fog * 0.2; skyU.uFlash.value = W.lightning;
    seaU.uTime.value = t; seaU.uChop.value = 0.8 + dz * 0.9; seaU.uFoam.value = 0.05 + dz * 0.9;
    seaU.uFogD.value = 0.0016 + dz * 0.0035 + W.fog * 0.004 + (page === "logbook" ? 0.0014 : 0);
    scene.fog.color.copy(pal.fog); scene.fog.density = seaU.uFogD.value * 1.1;
    renderer.toneMappingExposure = pal.exposure * (1 + W.lightning * 0.5);
    // lights
    hemi.color.copy(pal.sky); hemi.groundColor.copy(pal.ground); hemi.intensity = pal.ambI * (1 + W.lightning * 1.5);
    key.color.copy(pal.key); key.intensity = pal.keyI;
    const lightDir = pal.night > 0.6 ? moonDir : sunDir;
    key.position.copy(hero.group.position).addScaledVector(lightDir.y > 0.08 ? lightDir : tmpA.set(lightDir.x, 0.12, lightDir.z).normalize(), 80);
    key.target.position.copy(hero.group.position);
    updateEnv();
    // ship on the swell
    const chop = seaU.uChop.value, h0 = waveAt(0, 0, t, chop), hf = waveAt(10, 0, t, chop), hb = waveAt(-10, 0, t, chop), hs = waveAt(0, 4, t, chop), hp = waveAt(0, -4, t, chop);
    const k = 1 - Math.exp(-dt * 2.5);
    shipTilt.y += (h0 * 0.55 - 0.35 - shipTilt.y) * k;
    shipTilt.pitch += (Math.atan2(hf - hb, 20) * 0.7 - shipTilt.pitch) * k;
    shipTilt.roll += (Math.atan2(hs - hp, 8) * 0.6 + Math.sin(t * 0.5) * 0.012 * (1 + dz) - shipTilt.roll) * k;
    hero.group.position.y = shipTilt.y; hero.group.rotation.set(shipTilt.roll, 0, shipTilt.pitch);
    hero.update(t, W.wind);
    // raider
    if (raider.group.visible) {
      if (raiderState.t < 1) { raiderState.t = Math.min(1, raiderState.t + dt / raiderState.dur); const e = raiderState.t * raiderState.t * (3 - 2 * raiderState.t);
        raider.group.position.lerpVectors(raiderState.from, raiderState.to, e); raider.group.rotation.y = raiderState.rotFrom + (raiderState.rotTo - raiderState.rotFrom) * e; }
      const rp = raider.group.position, rh = waveAt(rp.x, rp.z, t, chop);
      raider.group.position.y = rh * 0.5 - 0.3; raider.group.rotation.z = Math.sin(t * 0.8) * 0.03 * (1 + dz);
      raider.update(t, W.wind);
      raiderState.fade += (raiderState.fadeTo - raiderState.fade) * (1 - Math.exp(-dt * 0.6));
      raider.group.traverse((o) => { if (o.material && o.material.opacity !== undefined) o.material.opacity = Math.max(0, Math.min(1, raiderState.fade)); });
      if (raiderState.fadeTo === 0 && raiderState.fade < 0.02) { raider.group.visible = false; raider.group.position.set(420, 0, -520); }
    }
    updateFx(dt);
    // mist + gulls
    mists.forEach((m, i) => { m.m.position.x = m.base + Math.sin(t * 0.02 * m.speed + i) * 40; m.m.material.opacity = (0.14 + dz * 0.4 + W.fog * 0.5) * (page === "logbook" ? 1.4 : 1); m.m.material.color.copy(pal.fog).multiplyScalar(1.6); m.m.material.map.offset.x = t * 0.004 * m.speed; });
    const birds = pal.night < 0.6 && dz < 0.4;
    gulls.forEach((g) => { g.visible = birds; if (!birds) return; const u = g.userData, a = t * u.sp + u.ph;
      g.position.set(Math.cos(a) * u.rad + u.cx, u.h + Math.sin(a * 2.3) * 2, Math.sin(a) * u.rad * 0.7 - 10); g.rotation.y = -a; const f = Math.sin(t * 6 + u.ph) * 0.45; u.l.rotation.x = f; u.r.rotation.x = f; });
    // rain
    rainMat.opacity = W.rain * 0.55;
    if (W.rain > 0.02) {
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z, slant = 4 + W.wind * 10;
      for (let i = 0; i < RAIN; i++) {
        let y = (rainSeed[i * 3 + 1] - t * 34) % 40; if (y < 0) y += 40;
        const x = cx + rainSeed[i * 3] + (40 - y) * slant * 0.05, z = cz + rainSeed[i * 3 + 2], yy = cy - 12 + y;
        rainPos.set([x, yy, z, x - slant * 0.06, yy + 1.4, z], i * 6);
      }
      rainGeo.attributes.position.needsUpdate = true;
    }
    boltMat.opacity *= Math.exp(-dt * 14);
    // camera
    const onShip = samplePath(scrollP);
    px += (pointerX - px) * 0.03; py += (pointerY - py) * 0.03;
    if (onShip > 0) {
      hero.group.updateMatrixWorld();
      tmpA.copy(camLocal).applyMatrix4(hero.group.matrixWorld); tmpB.copy(lookLocal).applyMatrix4(hero.group.matrixWorld);
      camLocal.lerp(tmpA, onShip); lookLocal.lerp(tmpB, onShip);
    }
    const mot = reduce ? 0 : 1;
    camera.position.copy(camLocal); camera.position.x += px * 1.6 * mot; camera.position.y -= py * 0.8 * mot;
    camera.position.y += Math.sin(t * 0.21) * 0.15 * mot;
    look.copy(lookLocal);
    if (W.shake > 0.01) { camera.position.x += (Math.random() - 0.5) * W.shake * 0.5; camera.position.y += (Math.random() - 0.5) * W.shake * 0.4; }
    camera.lookAt(look);
    const zoom = 1 - dz * 0.06; // gentle push-in during danger
    if (Math.abs(camera.zoom - zoom) > 0.002) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    seaU.uCam.value.copy(camera.position);
    sky.position.copy(camera.position);
    sea.position.set(Math.round(camera.position.x / 20) * 20, 0, Math.round(camera.position.z / 20) * 20);
    // share lighting with the actor layer
    const L = W.light; L.key = [pal.key.r, pal.key.g, pal.key.b]; L.keyI = pal.keyI; L.sky = [pal.sky.r, pal.sky.g, pal.sky.b];
    L.ground = [pal.ground.r, pal.ground.g, pal.ground.b]; L.ambI = pal.ambI; L.rim = dz > 0.3 ? [1, 0.35, 0.15] : [pal.sunCol.r, pal.sunCol.g, pal.sunCol.b]; L.rimI = 1 + dz * 1.5;
    renderer.render(scene, camera);
    // adaptive resolution
    avg = avg * 0.95 + dt * 1000 * 0.05; frames++;
    if (frames > 90 && avg > 25 && dpr > 0.7) { dpr = Math.max(0.7, dpr - 0.15); renderer.setPixelRatio(dpr); frames = 0; }
  }

  resize();
  window.addEventListener("resize", resize);
  W.addTick(frame, 0);
  W.ready = true;
  requestAnimationFrame(() => canvas.classList.add("ready"));
  window.KCWorld = { waveAt, scene, camera, hero, raider };
})();
