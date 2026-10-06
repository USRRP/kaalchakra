/* Kaalchakra 2.0 — AudioManager.
   Off by default; turned on from the HUD (a user gesture), and then quiet. Every sound is synthesised
   with WebAudio, so nothing needs downloading. To use real recordings instead, list files in
   KC.audio.files (data.js) — e.g. { clash: "assets/audio/clash.mp3" } — they replace the synth. */
(function () {
  "use strict";
  const W = window.KCW, KC = window.KC || {};
  const A = { on: false, volume: (KC.audio && KC.audio.volume) || 0.22 };
  let ctx = null, master = null, noise = null, ocean = null, creakT = 0;
  const buffers = {};

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = A.volume; master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const files = (KC.audio && KC.audio.files) || {};
    Object.keys(files).forEach((k) => fetch(files[k]).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => (buffers[k] = buf)).catch(() => {}));
    return true;
  }
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, dcy) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy); }
  function noiseSrc(filterType, freq, q) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.loopStart = Math.random();
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; if (q) f.Q.value = q;
    s.connect(f); return { s, f };
  }
  function tone(type, freq, t, dur, peak, dest) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    o.connect(g); g.connect(dest || master); env(g, t, 0.005, peak, dur); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  const SYNTH = {
    clash() { const t = now(); [1230, 1755, 2480, 3310].forEach((f, i) => tone("triangle", f * (0.97 + Math.random() * 0.06), t, 0.45 - i * 0.07, 0.16 / (i + 1)));
      const n = noiseSrc("highpass", 3000), g = ctx.createGain(); n.f.connect(g); g.connect(master); env(g, t, 0.002, 0.25, 0.06); n.s.start(t); n.s.stop(t + 0.1); },
    hit() { const t = now(), n = noiseSrc("lowpass", 700), g = ctx.createGain(); n.f.connect(g); g.connect(master); env(g, t, 0.004, 0.35, 0.12); n.s.start(t); n.s.stop(t + 0.2); },
    whoosh() { const t = now(), n = noiseSrc("bandpass", 600, 1.2), g = ctx.createGain(); n.f.frequency.setValueAtTime(400, t); n.f.frequency.exponentialRampToValueAtTime(2200, t + 0.22); n.f.connect(g); g.connect(master); env(g, t, 0.06, 0.18, 0.18); n.s.start(t); n.s.stop(t + 0.35); },
    step() { const t = now(), n = noiseSrc("lowpass", 380), g = ctx.createGain(); n.f.connect(g); g.connect(master); env(g, t, 0.003, 0.08, 0.06); n.s.start(t); n.s.stop(t + 0.1); },
    pistol() { const t = now(), n = noiseSrc("bandpass", 1800, 0.7), g = ctx.createGain(); n.f.connect(g); g.connect(master); env(g, t, 0.002, 0.6, 0.25); n.s.start(t); n.s.stop(t + 0.35); tone("sine", 90, t, 0.2, 0.25); },
    cannon() { const t = now(), n = noiseSrc("lowpass", 300), g = ctx.createGain(); n.f.frequency.exponentialRampToValueAtTime(80, t + 1.2); n.f.connect(g); g.connect(master); env(g, t, 0.01, 0.9, 1.4); n.s.start(t); n.s.stop(t + 1.6);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(32, t + 0.6); o.connect(og); og.connect(master); env(og, t, 0.005, 0.8, 0.7); o.start(t); o.stop(t + 0.9); },
    thunder() { const t = now(), n = noiseSrc("lowpass", 520), g = ctx.createGain(); n.f.frequency.exponentialRampToValueAtTime(90, t + 2.8); n.f.connect(g); g.connect(master); env(g, t, 0.05, 0.7, 3.0); n.s.start(t); n.s.stop(t + 3.2); },
    treasure() { const t = now(); [1046, 1318, 1568, 2093, 2637].forEach((f, i) => tone("triangle", f, t + i * 0.07, 0.6, 0.09)); },
    arrive() { const t = now(), o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(196, t); o.frequency.linearRampToValueAtTime(174, t + 1.4);
      f.type = "lowpass"; f.frequency.value = 900; o.connect(f); f.connect(g); g.connect(master); env(g, t, 0.25, 0.22, 1.3); o.start(t); o.stop(t + 1.8); },
    creak() { const t = now(), o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(70 + Math.random() * 30, t); o.frequency.linearRampToValueAtTime(55, t + 0.7);
      f.type = "bandpass"; f.frequency.value = 650; f.Q.value = 8; o.connect(f); f.connect(g); g.connect(master); env(g, t, 0.15, 0.06, 0.6); o.start(t); o.stop(t + 0.9); }
  };
  function play(name) {
    if (!A.on || !ctx) return;
    if (buffers[name]) { const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buffers[name]; g.gain.value = 0.8; s.connect(g); g.connect(master); s.start(); return; }
    if (SYNTH[name]) SYNTH[name]();
  }
  function startOcean() {
    if (ocean) return;
    const n = noiseSrc("lowpass", 420), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    g.gain.value = 0.05; lfo.frequency.value = 0.12; lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain);
    n.f.connect(g); g.connect(master); n.s.start(); lfo.start(); ocean = { n, g, lfo };
  }
  function stopOcean() { if (!ocean) return; try { ocean.n.s.stop(); ocean.lfo.stop(); } catch (e) { /* already stopped */ } ocean = null; }

  A.enable = (on) => {
    A.on = !!on;
    if (A.on) { if (!init()) { A.on = false; return; } ctx.resume && ctx.resume(); startOcean(); }
    else if (ctx) { stopOcean(); }
  };
  A.play = play;
  if (W) {
    W.on("sfx", play);
    W.on("lightning", () => setTimeout(() => play("thunder"), 400 + Math.random() * 600));
    W.addTick((dt) => { if (!A.on || !ctx) return; creakT -= dt; if (creakT <= 0) { creakT = 9 + Math.random() * 14; play("creak"); }
      if (ocean) ocean.g.gain.value = 0.05 + (W.danger || 0) * 0.07; }, 20);
  }
  window.KCAudio = A;
})();
