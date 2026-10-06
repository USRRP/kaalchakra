/* Kaalchakra 2.0 — WorldState
   Shared state + event bus + master animation loop for every system on the page:
   the 3D sea (environment.js), the actor stage (stage.js), cinematic events and Danger Mode.
   Nothing here touches the DOM except the --danger CSS variable and the flash overlay. */
(function () {
  "use strict";
  const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
  const reduce = mq("(prefers-reduced-motion: reduce)");
  const small = Math.min(window.innerWidth, window.innerHeight) < 700 || /Mobi|Android/i.test(navigator.userAgent);
  const listeners = {};
  const ticks = [];

  const W = {
    maxDt: 0.05,  // longest step a slow frame may take (keeps physics stable)
    webgl: (() => { try { const c = document.createElement("canvas"), g = window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")); const x = g && g.getExtension("WEBGL_lose_context"); if (x) x.loseContext(); return !!g; } catch (e) { return false; } })(),  // can this browser draw the 3D world at all?
    reduce, small,
    page: (document.body && document.body.dataset.page) || "home",
    time: 0,              // seconds since start (pauses when tab hidden)
    timeOfDay: 0,         // 0 sunset · 0.5 dusk · 1 night   (set by environment from scroll/page)
    danger: 0,            // eased 0..1
    dangerTarget: 0,
    fog: 0, fogTarget: 0, // extra fog on top of danger
    rain: 0, rainTarget: 0,
    wind: 0.35,           // 0 calm .. 1 storm (derived)
    lightning: 0,         // flash intensity, decays fast
    shake: 0,             // camera shake amount, decays
    glow: 0,              // treasure glow
    // lighting the actor layer copies so characters match the sea behind them
    light: { key: [1, 0.78, 0.55], keyI: 2.2, keyDir: [0.6, 0.55, 0.6], sky: [0.55, 0.6, 0.75], ground: [0.18, 0.12, 0.1], ambI: 0.85, rim: [1, 0.55, 0.3], rimI: 1.2 },

    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return () => W.off(ev, fn); },
    off(ev, fn) { const l = listeners[ev]; if (l) { const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); } },
    emit(ev, data) { (listeners[ev] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); },

    /** Danger Mode: 0 calm … 1 "something dangerous has entered the sea" */
    setDanger(v) { W.dangerTarget = Math.max(0, Math.min(1, v)); W.emit("danger", W.dangerTarget); },
    setFog(v) { W.fogTarget = Math.max(0, Math.min(1, v)); },
    setRain(v) { W.rainTarget = reduce ? 0 : Math.max(0, Math.min(1, v)); },
    _lastFlash: -9,
    flash(s = 1) {                 // lightning — rate-limited, never under reduced motion
      if (reduce || W.time - W._lastFlash < 0.9) return false;
      W._lastFlash = W.time; W.lightning = Math.min(1, s); W.emit("lightning", s); return true;
    },
    shakeIt(s = 0.5) { if (!reduce) W.shake = Math.max(W.shake, s); },

    /** register a per-frame callback: fn(dt, t). Returns an unregister fn. */
    addTick(fn, order = 0) { ticks.push({ fn, order }); ticks.sort((a, b) => a.order - b.order); start(); return () => { const i = ticks.findIndex((t) => t.fn === fn); if (i >= 0) ticks.splice(i, 1); }; },
    /** promise that resolves after `ms` of *world* time (pauses with the loop) */
    sleep(ms) { return new Promise((res) => waits.push({ t: W.time + ms / 1000, res })); }
  };
  const waits = [];
  const ease = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-dt * rate));
  const root = document.documentElement;
  let lastCss = -1;

  function update(dt) {
    W.time += dt;
    W.danger = ease(W.danger, W.dangerTarget, W.dangerTarget > W.danger ? 0.9 : 0.45, dt);   // in fast, out slow
    W.fog = ease(W.fog, W.fogTarget, 0.6, dt);
    W.rain = ease(W.rain, W.rainTarget, 0.8, dt);
    W.wind = 0.35 + W.danger * 0.65;
    W.lightning *= Math.exp(-dt * 7);
    W.shake *= Math.exp(-dt * 5);
    W.glow *= Math.exp(-dt * 0.8);
    if (Math.abs(W.danger - lastCss) > 0.004) { lastCss = W.danger; root.style.setProperty("--danger", W.danger.toFixed(3)); }
    root.style.setProperty("--flash", (W.lightning * 0.22).toFixed(3));
    for (let i = waits.length - 1; i >= 0; i--) if (W.time >= waits[i].t) waits.splice(i, 1)[0].res();
  }

  let running = false, raf = 0, last = 0;
  function frame(now) {
    if (!running) return;
    const dt = Math.min(W.maxDt, Math.max(0, (now - last) / 1000)); last = now;
    update(dt);
    for (let i = 0; i < ticks.length; i++) { try { ticks[i].fn(dt, W.time); } catch (e) { console.error(e); } }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (running || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  W.isRunning = () => running;

  window.KCW = W;
})();
