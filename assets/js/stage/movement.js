/* Kaalchakra 2.0 — MovementController.
   Actors live on "surfaces" of the real page: the deck line at the bottom of the viewport and the
   top edges of cards/panels marked [data-perch]. They walk, run, jump between perches, climb up
   and slide down the sides of cards, fall when a perch scrolls away, and hide behind solid UI.
   Positions are CSS px in the viewport (sx from left, sy = feet line from top). */
(function () {
  "use strict";
  const W = window.KCW, P = window.KCPoses;
  if (!W || !P) return;
  const M = { vw: window.innerWidth, vh: window.innerHeight, S: 80, headerH: 74, pad: 8 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  M.floorY = () => M.vh - M.pad;
  M.rect = (el) => el.getBoundingClientRect();
  M.validPerch = (el) => {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    return r.width > 100 && r.top > M.headerH + M.S * 1.2 && r.top < M.vh - M.S * 0.35 && r.right > 30 && r.left < M.vw - 30;
  };
  let cache = [], cacheT = -9;
  /** visible perches with head-room above them */
  M.perches = (force) => {
    if (!force && W.time - cacheT < 0.3) return cache;
    cacheT = W.time;
    const els = Array.from(document.querySelectorAll("[data-perch]"));
    const solids = els.concat(Array.from(document.querySelectorAll("[data-solid]"))).map((e) => ({ e, r: e.getBoundingClientRect() }));
    cache = els.filter((el) => {
      if (!M.validPerch(el)) return false;
      const r = el.getBoundingClientRect();
      if (r.top < M.headerH + M.S * 2.1) return false;
      for (const o of solids) {
        if (o.e === el || o.e.contains(el) || el.contains(o.e)) continue;
        const ov = Math.min(o.r.right, r.right) - Math.max(o.r.left, r.left);
        if (ov > Math.min(r.width, o.r.width) * 0.3 && o.r.bottom > r.top - M.S * 1.7 && o.r.top < r.top - 4) return false;
      }
      return true;
    });
    return cache;
  };
  /** a solid element that covers the deck line — walking there hides you behind it */
  /* is this screen point empty background (no card, text block or control on top of the stage)? */
  const OPEN = "main,section,.section,.wrap,.hero,.page-hero,.legend,.split,.site-footer,.hero-grid,.hero-copy,.treasure,.cap-hit,.stage-layer";
  M.isOpenAt = (x, y) => { const el = document.elementFromPoint(x, y); return !el || el === document.documentElement || el === document.body || el.matches(OPEN); };
  M.occluded = (a) => !M.isOpenAt(a.sx, a.sy - M.S * 1.25) && !M.isOpenAt(a.sx, a.sy - M.S * 0.5);
  /* nearest floor x where an actor would be in plain view (null if the whole floor is behind content) */
  M.openFloorX = (fromX) => {
    const y1 = M.floorY() - M.S * 1.25, y2 = M.floorY() - M.S * 0.5, xs = [];
    for (let x = M.S; x < M.vw - M.S; x += Math.max(24, M.S * 0.5)) if (M.isOpenAt(x, y1) && M.isOpenAt(x, y2) && M.isOpenAt(x - M.S * 0.35, y1) && M.isOpenAt(x + M.S * 0.35, y1)) xs.push(x);
    if (!xs.length) return null;
    return fromX == null ? xs[Math.floor(Math.random() * xs.length)] : xs.reduce((b, x) => (Math.abs(x - fromX) < Math.abs(b - fromX) ? x : b), xs[0]);
  };
  M.hideSpot = () => {
    const fy = M.floorY();
    const els = Array.from(document.querySelectorAll("[data-perch],[data-solid]"));
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < fy - M.S * 1.9 && r.bottom > fy + 2 && r.width > M.S * 1.2 && r.left > 10 && r.right < M.vw - 10) return { el, x: (r.left + r.right) / 2 };
    }
    return null;
  };

  /* ---------------- Actor ---------------- */
  class Actor {
    constructor(def, rig) {
      this.def = def; this.rig = rig; this.id = def.id;
      this.sx = M.vw * 0.8; this.sy = M.floorY(); this.surf = { type: "floor" }; this.ox = 0;
      this.face = -1; this.ry = -1.15; this.anim = "idle"; this.u = 0; this.dur = 0; this.phase = 0; this.vx = 0;
      this.task = null; this.alive = true; this.lookX = 0; this.seed = Math.random() * 10; this.offscreenOk = false; this.depth = 0;
      this.weapon = def.weapon;
    }
    /* ---- helpers ---- */
    bounds() {
      if (this.surf.type === "perch") { const r = M.rect(this.surf.el); return [r.left + 16, r.right - 16]; }
      return this.offscreenOk ? [-M.S * 3, M.vw + M.S * 3] : [M.S * 0.45, M.vw - M.S * 0.45];
    }
    setFace(f) { this.face = f; }
    faceTo(x) { this.face = x >= this.sx ? 1 : -1; }
    play(anim, ms) { this.anim = anim; this.u = 0; this.dur = (ms || 600) / 1000; return W.sleep(ms || 600); }
    hold(anim) { this.anim = anim; this.u = 0; this.dur = 0; }
    stop() { if (this.task && this.task.res) this.task.res(false); this.task = null; }
    placeFloor(x) { this.stop(); this.surf = { type: "floor" }; this.sx = x; this.sy = M.floorY(); }
    placePerch(el, x) { const r = M.rect(el); this.stop(); this.surf = { type: "perch", el }; this.sx = clamp(x, r.left + 16, r.right - 16); this.ox = this.sx - r.left; this.sy = r.top; }

    /* ---- primitive tasks (promise resolves true when finished, false if interrupted) ---- */
    walkTo(x, mode = "walk", mul = 1) { this.stop(); return new Promise((res) => (this.task = { type: "move", x, mode, mul, res })); }
    runTo(x) { return this.walkTo(x, "run"); }
    jumpTo(el, x) {
      this.stop();
      const from = { x: this.sx, y: this.sy };
      const to = () => (el ? { x: clamp(x, M.rect(el).left + 16, M.rect(el).right - 16), y: M.rect(el).top } : { x: clamp(x, 20, M.vw - 20), y: M.floorY() });
      const t0 = to(), d = Math.hypot(t0.x - from.x, t0.y - from.y);
      const dur = clamp(0.45 + d / (M.S * 9), 0.5, 1.0) * (W.reduce ? 0.5 : 1);
      const h = Math.max(M.S * 0.5, (from.y - t0.y) * 0.6 + M.S * 0.6);
      this.face = t0.x >= from.x ? 1 : -1;
      return new Promise((res) => (this.task = { type: "jump", from, to, el, dur, h, u: 0, res }));
    }
    climb(el, side, up) {
      this.stop();
      return new Promise((res) => (this.task = { type: "climb", el, side, up, res, startY: this.sy }));
    }
    slideFromTop(x, el) { // e.g. sliding down a grappling rope into the page
      this.stop(); this.sx = x; this.sy = -M.S * 0.5; this.surf = { type: "air" };
      return new Promise((res) => (this.task = { type: "slide", el, res, x }));
    }
    fall() { this.stop(); this.surf = { type: "air" }; return new Promise((res) => (this.task = { type: "fall", vy: 0, res })); }

    /* ---- planner ---- */
    async getDown(preferX) {
      if (this.surf.type !== "perch") return;
      const el = this.surf.el, r = M.rect(el), right = preferX > (r.left + r.right) / 2;
      let edge = right ? r.right - 18 : r.left + 18;
      if ((right && r.right > M.vw - M.S) || (!right && r.left < M.S)) edge = right ? r.left + 18 : r.right - 18;
      await this.walkTo(edge);
      if (!M.validPerch(el)) return this.fall();
      const r2 = M.rect(el), h = M.floorY() - r2.top, out = edge > (r2.left + r2.right) / 2 ? 1 : -1;
      if (h < M.S * 3.4) await this.jumpTo(null, edge + out * M.S * 0.9);
      else { this.sx = out > 0 ? r2.right + M.S * 0.18 : r2.left - M.S * 0.18; await this.climb(el, out, false); }
    }
    async navigate(target, mode = "walk") {
      for (let step = 0; step < 5 && this.alive; step++) {
        if (target.el && !M.validPerch(target.el)) target = { el: null, x: target.x };
        const cur = this.surf;
        if (cur.type === "air") { await W.sleep(200); continue; }
        if (!target.el) {
          if (cur.type === "floor") return this.walkTo(target.x, mode);
          await this.getDown(target.x); continue;
        }
        const tr = M.rect(target.el);
        if (cur.type === "perch" && cur.el === target.el) return this.walkTo(target.x, mode);
        if (cur.type === "perch") {
          const r = M.rect(cur.el), dy = tr.top - r.top;
          const toRight = tr.left >= r.right - 4, toLeft = tr.right <= r.left + 4;
          if (dy > -M.S * 1.4 && dy < M.S * 2.6) {
            if (toRight && tr.left - r.right < M.S * 3.2) { await this.walkTo(r.right - 18, mode); await this.jumpTo(target.el, tr.left + 30); continue; }
            if (toLeft && r.left - tr.right < M.S * 3.2) { await this.walkTo(r.left + 18, mode); await this.jumpTo(target.el, tr.right - 30); continue; }
          }
          await this.getDown(target.x); continue;
        }
        // floor → perch
        const h = M.floorY() - tr.top;
        let side = Math.abs(this.sx - tr.left) < Math.abs(this.sx - tr.right) ? -1 : 1;
        if (side < 0 && tr.left < M.S * 0.6) side = 1; if (side > 0 && tr.right > M.vw - M.S * 0.6) side = -1;
        const edgeX = side < 0 ? tr.left - M.S * 0.25 : tr.right + M.S * 0.25;
        await this.walkTo(edgeX, Math.abs(edgeX - this.sx) > M.vw * 0.35 ? "run" : mode);
        if (!M.validPerch(target.el)) continue;
        if (h < M.S * 1.6) await this.jumpTo(target.el, side < 0 ? tr.left + 28 : tr.right - 28);
        else await this.climb(target.el, side, true);
      }
    }

    /* ---- per frame ---- */
    update(dt) {
      const S = M.S, t = this.task;
      let animName = this.anim, u = this.u, speed = 0;
      // stick to the current surface (it scrolls with the page)
      if (this.surf.type === "perch") {
        if (!M.validPerch(this.surf.el)) { if (!t || t.type === "move") { this.fall(); } }
        else { const r = M.rect(this.surf.el); this.sx = r.left + this.ox; this.sy = r.top; }
      } else if (this.surf.type === "floor") this.sy = M.floorY();
      const tk = this.task;
      if (tk) {
        if (tk.type === "move") {
          const [a, b] = this.bounds(), tx = clamp(tk.x, a, b), dx = tx - this.sx;
          const sp = (tk.mode === "run" ? this.def.run : this.def.walk) * S * tk.mul;
          if (Math.abs(dx) <= sp * dt + 0.6) { this.sx = tx; this.finish(true); }
          else { this.sx += Math.sign(dx) * sp * dt; this.face = Math.sign(dx); speed = sp; }
          if (this.surf.type === "perch") this.ox = this.sx - M.rect(this.surf.el).left;
          animName = tk.mode === "run" ? "run" : tk.mode === "sneak" ? "sneak" : tk.anim || "walk";
          this.phase += (speed * dt) / (S * (tk.mode === "run" ? 2.0 : 1.3)) * Math.PI * 2;
        } else if (tk.type === "jump") {
          tk.u = Math.min(1, tk.u + dt / tk.dur);
          const to = tk.to(), e = tk.u;
          this.sx = tk.from.x + (to.x - tk.from.x) * e;
          this.sy = tk.from.y + (to.y - tk.from.y) * e - Math.sin(Math.PI * e) * tk.h;
          this.surf = { type: "air" }; animName = "jump"; u = e;
          if (tk.u >= 1) { if (tk.el && M.validPerch(tk.el)) { this.surf = { type: "perch", el: tk.el }; this.ox = this.sx - M.rect(tk.el).left; } else this.surf = { type: "floor" }; this.finish(true); W.emit("actor:land", this); }
        } else if (tk.type === "climb") {
          if (!M.validPerch(tk.el)) { this.task = null; this.fall().then(() => tk.res(false)); return this.render(dt, "jump", 0.5, 0); }
          const r = M.rect(tk.el), top = r.top, floor = M.floorY();
          this.sx = tk.side < 0 ? r.left - S * 0.18 : r.right + S * 0.18;
          const sp = (tk.up ? 1.15 : 2.6) * S;
          if (tk.up) { this.sy -= sp * dt; if (this.sy <= top + S * 0.05) { this.task = null; this.surf = { type: "floor" }; this.jumpTo(tk.el, tk.side < 0 ? r.left + 26 : r.right - 26).then(() => tk.res(true)); } }
          else { this.sy += sp * dt; if (this.sy >= floor) { this.sy = floor; this.surf = { type: "floor" }; this.finish(true); } }
          this.surf = this.task ? { type: "air" } : this.surf;
          animName = tk.up ? "climb" : "slide"; this.face = 2; this.phase += dt * (tk.up ? 6 : 0);
          this.climbSide = tk.side;
        } else if (tk.type === "fall") {
          tk.vy += 2400 * dt; this.sy += tk.vy * dt; animName = "jump"; u = 0.5;
          const fy = M.floorY();
          if (this.sy >= fy) { this.sy = fy; this.surf = { type: "floor" }; this.finish(true); W.emit("actor:land", this); }
        } else if (tk.type === "slide") {
          const target = tk.el ? M.rect(tk.el).top : M.floorY();
          this.sy += S * 3.2 * dt; animName = "slide"; this.face = 0;
          if (this.sy >= target) { this.sy = target; if (tk.el) { this.surf = { type: "perch", el: tk.el }; this.ox = this.sx - M.rect(tk.el).left; } else this.surf = { type: "floor" }; this.finish(true); W.emit("actor:land", this); }
        }
      }
      if (this.dur > 0) { this.u = Math.min(1, this.u + dt / this.dur); if (!tk || tk.type !== "jump") u = this.u; }
      this.vx = speed * (this.face === -1 ? -1 : 1);
      return this.render(dt, animName, u, speed);
    }
    finish(ok) { const t = this.task; this.task = null; if (t && t.res) t.res(ok); }
    render(dt, animName, u, speed) {
      const want = this.face === 1 ? 1.15 : this.face === -1 ? -1.15 : this.face === 2 ? Math.PI + (this.climbSide || 1) * 0.55 : 0.12;
      let d = want - this.ry; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      this.ry += d * (1 - Math.exp(-dt * 10));
      const ctx = { t: W.time, phase: this.phase, u, style: this.def.style || this.id, weapon: this.weapon, lookX: this.lookX, seed: this.seed, dir: this.face, pointY: this.pointY || 0 };
      const target = P.compute(animName, ctx);
      if (this.headLook != null && (animName === "idle" || animName === "talk" || animName === "look")) target.head[1] = this.headLook;
      P.apply(this.rig, target, dt, animName === "attack" || animName === "hit" || animName === "jump" ? 18 : 10);
      P.secondary(this.rig, this.vx, dt, W.time, W.wind);
      this.curAnim = animName;
      return animName;
    }
  }
  M.Actor = Actor;
  window.KCMove = M;
})();
