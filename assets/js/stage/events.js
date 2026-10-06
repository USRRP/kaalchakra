/* Kaalchakra 2.0 — CinematicEventManager + DangerMode + the captain's ambient life.
   Calm → something suspicious → danger → resolution → calm. Events are rare, one at a time,
   shorter on phones, mild on the archive/crew pages and never run with reduced motion. */
(function () {
  "use strict";
  const W = window.KCW, S = window.KCStage, M = window.KCMove;
  if (!W || !S || !M) return;
  const KC = window.KC || {};
  const L = Object.assign({}, KC.captain || {}), PL = KC.pirates || {};
  const cap = S.captain;
  const page = W.page, small = W.small, reduce = W.reduce;
  const pick = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const CANCEL = { cancelled: true };
  // a sleep that ends the running event if the director was interrupted meanwhile
  const sleep = async (ms) => { const t = D.token; await W.sleep(ms); if (t !== D.token && D.cancelled === t) throw CANCEL; };
  const sfx = (n) => W.emit("sfx", n);
  const Sx = () => M.S;

  /* ---------------- director: exclusive control of the captain ---------------- */
  const D = { busy: false, enabled: true, pendingLine: null, queue: [], nextEvent: 0, lastEvent: "", token: 0, cancelled: -1 };
  function calm() {
    W.setDanger(0); W.setFog(0); W.setRain(0);
    S.enemies().forEach((e) => S.despawn(e)); S.props.hideChest && S.props.hideChest();
    cap.rig.setItem("R", page === "logbook" ? "lantern" : null); cap.rig.setItem("L", null);
    if (cap.rig.J.sheathed) cap.rig.J.sheathed.visible = true;
  }
  async function run(fn) {
    if (D.busy) return false;
    D.busy = true; const tok = ++D.token;
    try { await fn(); } catch (e) { if (e !== CANCEL) console.error(e); }
    if (tok === D.token) { D.busy = false; calm(); }
    return true;
  }
  D.run = run;
  /* stop whatever is playing (used by "Hide captain" and by tests) and return to calm */
  D.interrupt = () => { D.cancelled = D.token; D.token++; D.busy = false; calm(); const R = window.KCWorld && window.KCWorld.raider; if (R && R.group.visible) W.emit("ship:leave"); if (cap.task) cap.stop(); if (cap.surf.type === "air" || cap.surf.type === "rope") cap.placeFloor(cap.sx); cap.hold("idle"); };

  /* ---------------- helpers ---------------- */
  async function toFloor(a) { if (a.surf.type === "perch") await a.getDown(a.sx); if (a.surf.type === "air") await sleep(400); }
  function talk(a, text, anim = "talk") { if (!text) return 0; const ms = S.say(a, text); if (a.curAnim !== "attack") a.hold(anim); return ms; }
  async function line(a, text, anim) { const ms = talk(a, text, anim); await sleep(Math.min(ms, 3600)); if (a.anim === (anim || "talk")) a.hold("idle"); }
  function drawSword() { cap.rig.setItem("R", "cutlass"); if (cap.rig.J.sheathed) cap.rig.J.sheathed.visible = false; return cap.play("draw", 650); }
  function sheathe() { cap.rig.setItem("R", null); if (cap.rig.J.sheathed) cap.rig.J.sheathed.visible = true; }
  function handPos(a) { return { x: a.sx + (a.face === -1 ? -1 : 1) * Sx() * 0.62, y: a.sy - Sx() * 1.32 }; }

  /** one sword exchange between attacker and defender */
  async function exchange(atk, def, parryChance = 0.6) {
    atk.faceTo(def.sx); def.faceTo(atk.sx);
    atk.play("attack", small ? 480 : 560);
    sfx("whoosh");
    await sleep(small ? 220 : 260);
    const p = { x: (atk.sx + def.sx) / 2, y: def.sy - Sx() * 1.25 };
    if (Math.random() < parryChance) { def.play("parry", 300); S.fx.sparks(p.x, p.y, 16); sfx("clash"); W.shakeIt(0.25); }
    else { def.play("hit", 360); S.fx.sparks(p.x, p.y, 6); sfx("hit"); def.sx += (def.sx > atk.sx ? 1 : -1) * Sx() * 0.18; }
    await sleep(small ? 300 : 360);
    atk.hold("guard"); def.hold("guard");
    await sleep(rnd(120, 260));
  }
  /** full duel; returns when the rival is beaten */
  async function duel(e, rounds) {
    await toFloor(cap);
    const side = e.sx < cap.sx ? -1 : 1;
    if (e.def.attack === "shoot") return gunfight(e);
    if (e.def.attack === "throw") return bombRun(e);
    await e.walkTo(cap.sx + side * Sx() * 1.0, "run");
    e.faceTo(cap.sx); cap.faceTo(e.sx); e.hold("guard"); cap.hold("guard");
    if (Math.random() < 0.5) talk(e, pick(PL.taunt));
    await sleep(350);
    const n = rounds || (small ? 2 : 3 + Math.floor(Math.random() * 2));
    for (let i = 0; i < n; i++) { if (i % 2 === 0) await exchange(e, cap, 0.75); else await exchange(cap, e, 0.55); }
    await defeat(e);
  }
  async function defeat(e) {
    cap.faceTo(e.sx); cap.play("attack", 560); sfx("whoosh"); await sleep(260);
    S.fx.sparks((cap.sx + e.sx) / 2, e.sy - Sx() * 1.2, 18); sfx("clash"); W.shakeIt(0.35);
    e.play("fall", 650); await sleep(700);
    S.fx.coins(e.sx, e.sy - Sx() * 0.4, 5); W.emit("coins", 5);
    e.play("getup", 500); await sleep(520);
    talk(e, pick(PL.retreat));
    await retreat(e);
  }
  async function retreat(e) {
    const dir = e.sx < M.vw / 2 ? -1 : 1;
    e.offscreenOk = true;
    if (Math.random() < 0.45) { // vanish into a fog bank
      e.walkTo(e.sx + dir * Sx() * 1.5, "run"); await sleep(500);
      S.fx.fog(e.sx, e.sy); await sleep(900); S.despawn(e); return;
    }
    await e.walkTo(dir < 0 ? -Sx() * 2 : M.vw + Sx() * 2, "run"); S.despawn(e);
  }
  async function gunfight(e) {
    await e.walkTo(cap.sx + (e.sx < cap.sx ? -1 : 1) * Sx() * 3.4, "run");
    e.faceTo(cap.sx); cap.faceTo(e.sx); cap.hold("guard");
    talk(e, pick(PL.gunner));
    for (let i = 0; i < 2; i++) {
      e.play("shoot", 700); await sleep(330);
      const h = handPos(e); S.fx.flash(h.x + e.face * Sx() * 0.25, h.y); S.fx.smoke(h.x + e.face * Sx() * 0.3, h.y, 2, 0.6); sfx("pistol");
      await sleep(80);
      if (i === 0) { cap.play("parry", 320); S.fx.sparks(cap.sx + cap.face * Sx() * 0.5, cap.sy - Sx() * 1.4, 14); sfx("clash"); talk(cap, pick(L.deflect)); }
      else { cap.hold("crouch"); await sleep(380); cap.hold("guard"); }
      await sleep(600);
    }
    await cap.walkTo(e.sx - (e.sx > cap.sx ? 1 : -1) * Sx() * 1.0, "run");
    await exchange(cap, e, 0.2);
    await defeat(e);
  }
  async function bombRun(e) {
    await e.walkTo(cap.sx + (e.sx < cap.sx ? -1 : 1) * Sx() * 3.2, "walk");
    e.faceTo(cap.sx); talk(e, pick(PL.bomb)); e.hold("guard"); await sleep(900);
    e.play("throw", 650); await sleep(330); e.rig.setItem("R", null);
    const from = handPos(e), target = { x: cap.sx, y: cap.sy - Sx() * 0.2 };
    const dodge = cap.sx + (cap.sx > e.sx ? 1 : -1) * Sx() * 1.8;
    S.props.throwBomb(from, target, 0.85);
    await sleep(250); cap.jumpTo(null, dodge); talk(cap, pick(L.dodge));
    await sleep(650);
    S.fx.explosion(target.x, target.y);
    await sleep(500);
    e.play("laugh", 900); talk(e, pick(PL.bombLaugh)); await sleep(1000);
    await cap.walkTo(e.sx + (e.sx > cap.sx ? -1 : 1) * Sx() * 1.0, "run");
    await exchange(cap, e, 0.1);
    await defeat(e);
  }

  /* ---------------- the events ---------------- */
  const EVENTS = {
    // A — a raider ship appears, fog rolls in, boarders attack, then retreat into the fog
    async arrive() {
      W.setDanger(0.55); W.setFog(0.35); W.emit("ship:arrive"); sfx("arrive");
      await toFloor(cap); cap.face = 1; cap.hold("look"); talk(cap, pick(L.spotSails)); await sleep(small ? 2200 : 3400);
      await drawSword(); cap.hold("guard");
      const n = small ? 1 : 2, foes = [];
      for (let i = 0; i < n; i++) { const e = S.spawn(pick(["brute", "longcoat", "boarder", "gunner"]), { side: 1 }); if (e) foes.push(e); }
      for (const e of foes) { await duel(e); }
      W.setDanger(0.15); W.emit("ship:leave");
      cap.face = 0; await line(cap, pick(L.fightWin), "victory"); sheathe();
    },
    // B — the captain bolts across the screen, two pirates on his heels; he hides behind the UI
    async chase() {
      await toFloor(cap);
      const fromRight = cap.sx > M.vw / 2, dir = fromRight ? -1 : 1;
      const a = S.spawn(pick(["masked", "gunner", "boarder"]), { side: fromRight ? 1 : -1 });
      const b = small ? null : S.spawn(pick(["brute", "barnacle", "longcoat"]), { side: fromRight ? 1 : -1 });
      if (b) b.sx += (fromRight ? 1 : -1) * Sx() * 1.6;
      talk(cap, pick(L.chased)); sfx("arrive");
      const spot = M.hideSpot();
      const runTarget = spot ? spot.x : (dir < 0 ? -Sx() * 2 : M.vw + Sx() * 2);
      cap.offscreenOk = !spot;
      [a, b].filter(Boolean).forEach((e) => { talk(e, pick(PL.chase)); e.walkTo(dir < 0 ? -Sx() * 3 : M.vw + Sx() * 3, "run", 0.95); });
      await cap.walkTo(runTarget, "run", 1.15);
      if (spot) { cap.hold("crouch"); await sleep(small ? 2600 : 3600); cap.face = dir; cap.hold("peek"); await sleep(900); }
      else { await sleep(2600); cap.sx = dir < 0 ? -Sx() * 1.5 : M.vw + Sx() * 1.5; cap.offscreenOk = true; await cap.walkTo(dir < 0 ? M.vw * 0.2 : M.vw * 0.8, "walk"); }
      cap.offscreenOk = false;
      [a, b].filter(Boolean).forEach((e) => S.despawn(e));
      cap.face = 0; await line(cap, pick(L.escaped), "laugh");
    },
    // C — surrounded: "Give us the flags!" — refusal, scuffle, escape
    async capture() {
      await toFloor(cap);
      const x = Math.max(Sx() * 2.5, Math.min(M.vw - Sx() * 2.5, cap.sx));
      cap.walkTo(x); await sleep(400);
      W.setDanger(0.45);
      const l = S.spawn(pick(["brute", "boarder"]), { side: -1 }), r = S.spawn(pick(["longcoat", "masked"]), { side: 1 });
      const top = small ? null : S.spawn(pick(["gunner", "barnacle"]), { side: 1 });
      if (l) l.walkTo(x - Sx() * 1.2, "run"); if (r) r.walkTo(x + Sx() * 1.2, "run");
      if (top) { const rope = S.props.rope ? S.props.rope(x + Sx() * 0.2) : null; await top.slideFromTop(x + Sx() * 2.4, null); if (rope) rope.remove(); top.faceTo(x); }
      await sleep(1500);
      [l, r, top].filter(Boolean).forEach((e) => { e.faceTo(cap.sx); e.hold("guard"); });
      cap.hold("trapped"); sfx("arrive");
      if (r || l) await line(r || l, pick(PL.demand), "talk");
      await line(cap, pick(L.refuse), "trapped");
      if (l) await exchange(cap, l, 0.3);
      S.fx.smoke(cap.sx, cap.sy - Sx() * 0.4, 6, 1.4); sfx("whoosh");
      talk(cap, pick(L.escape));
      const perches = M.perches().filter((el) => { const rr = el.getBoundingClientRect(); return Math.abs((rr.left + rr.right) / 2 - cap.sx) < M.vw * 0.6; });
      if (perches.length) await cap.navigate({ el: pick(perches), x: cap.sx + Sx() * 2 }, "run");
      else await cap.walkTo(cap.sx > M.vw / 2 ? Sx() : M.vw - Sx(), "run");
      [l, r, top].filter(Boolean).forEach((e) => { talk(e, pick(PL.confused)); retreat(e); });
      await sleep(1800);
    },
    // D — a raider goes for one of the hidden CTF flags; the captain gets it back
    async raid() {
      await toFloor(cap);
      const flags = Array.from(document.querySelectorAll(".flag-egg")).filter((f) => !f.hidden && !f.classList.contains("stolen")).map((f) => ({ f, r: f.getBoundingClientRect() }))
        .filter(({ r }) => r.top > M.headerH + 40 && r.bottom < M.vh - 40 && r.left > 30 && r.right < M.vw - 30);
      const thief = S.spawn(pick(["masked", "gunner"]), { side: Math.random() < 0.5 ? -1 : 1 });
      if (!thief) return;
      W.setDanger(0.3);
      let flagEl = null;
      if (flags.length) {
        const { f, r } = pick(flags); flagEl = f;
        const fx = (r.left + r.right) / 2, fy = r.bottom;
        talk(thief, pick(PL.raid));
        await thief.walkTo(fx + (thief.sx < fx ? -1 : 1) * Sx() * 0.6, "run");
        // leap up, snatch, drop back to the deck
        const grab = { x: fx, y: Math.max(fy, M.headerH + Sx() * 2.2) };
        thief.stop(); thief.surf = { type: "air" };
        await new Promise((res) => { const from = { x: thief.sx, y: thief.sy }; thief.task = { type: "jump", from, to: () => grab, el: null, dur: 0.55, h: Sx() * 0.6, u: 0, res }; });
        f.classList.add("stolen"); thief.rig.setItem("L", "flag"); S.fx.sparks(fx, fy - 10, 10);
        talk(cap, pick(L.flagStolen)); cap.faceTo(thief.sx);
        await thief.fall();
      } else {
        cap.rig.setItem("L", "flag"); talk(cap, pick(L.guardFlag)); await sleep(1500);
        await thief.walkTo(cap.sx + (thief.sx < cap.sx ? -1 : 1) * Sx() * 0.8, "run");
        cap.rig.setItem("L", null); thief.rig.setItem("L", "flag"); talk(cap, pick(L.flagStolen));
      }
      const away = thief.sx < M.vw / 2 ? -Sx() * 2 : M.vw + Sx() * 2;
      thief.walkTo(away, "run", 0.85);
      await drawSword();
      await cap.walkTo(thief.sx + (away > thief.sx ? -1 : 1) * Sx() * 0.9, "run", 1.25);
      thief.stop(); thief.faceTo(cap.sx);
      await exchange(cap, thief, 0.2);
      thief.rig.setItem("L", null); cap.rig.setItem("L", "flag"); S.fx.sparks(thief.sx, thief.sy - Sx(), 10);
      talk(thief, pick(PL.retreat)); retreat(thief);
      await line(cap, pick(L.flagBack), "victory");
      if (flagEl) { flagEl.classList.remove("stolen"); flagEl.classList.add("returned"); setTimeout(() => flagEl.classList.remove("returned"), 1500); }
      cap.rig.setItem("L", null); sheathe();
    },
    // E — the sea goes dark: storm, lightning, silhouettes at the edges
    async darksea() {
      W.setDanger(1); W.setRain(0.9); W.setFog(0.5); sfx("thunder");
      cap.hold("look"); talk(cap, pick(L.darkSea));
      const ghosts = [S.spawn("longcoat", { side: -1 }), small ? null : S.spawn("masked", { side: 1 })].filter(Boolean);
      ghosts.forEach((g, i) => { g.walkTo(i ? M.vw - Sx() * 1.2 : Sx() * 1.2, "sneak"); });
      const n = small ? 2 : 3;
      for (let i = 0; i < n; i++) { await sleep(rnd(1600, 2600)); if (W.flash(1)) sfx("thunder"); }
      ghosts.forEach((g) => { S.fx.fog(g.sx, g.sy); });
      await sleep(900); ghosts.forEach((g) => S.despawn(g));
      W.setDanger(0.2); W.setRain(0); W.setFog(0);
      await line(cap, pick(L.calmAgain), "idle");
    },
    // F — boarding: a raider comes alongside, cannons, grappling ropes, a deck fight
    async boarding() {
      W.emit("ship:alongside"); W.setDanger(0.6); W.setFog(0.2); sfx("arrive");
      await toFloor(cap); cap.face = 1; cap.hold("look"); talk(cap, pick(L.boarding)); await sleep(small ? 2400 : 3600);
      W.emit("ship:cannon"); sfx("cannon"); await sleep(700); W.emit("ship:cannon"); sfx("cannon");
      await drawSword(); cap.hold("guard");
      const xs = [cap.sx + Sx() * 2.4, cap.sx - Sx() * 2.4].map((x) => Math.max(Sx(), Math.min(M.vw - Sx(), x)));
      const foes = [];
      for (let i = 0; i < (small ? 1 : 2); i++) {
        const e = S.spawn(pick(["boarder", "brute", "masked"]), { side: i ? -1 : 1 }); if (!e) continue;
        const rope = S.props.rope ? S.props.rope(xs[i]) : null;
        talk(e, pick(PL.board)); await e.slideFromTop(xs[i], null); if (rope) setTimeout(() => rope.remove(), 600);
        foes.push(e);
      }
      for (const e of foes) await duel(e);
      W.emit("ship:leave"); W.setDanger(0.1);
      cap.face = 0; await line(cap, pick(L.fightWin), "victory"); sheathe();
    },
    // G — treasure: walk to a chest, open it, golden light, then carry on
    async treasure() {
      const perches = M.perches();
      let spotEl = null, x;
      if (perches.length && Math.random() < 0.5) { spotEl = pick(perches); const r = spotEl.getBoundingClientRect(); x = r.left + r.width * (0.3 + Math.random() * 0.4); }
      else { await toFloor(cap); x = Math.max(Sx() * 2, Math.min(M.vw - Sx() * 2, cap.sx + (Math.random() < 0.5 ? -1 : 1) * M.vw * 0.25)); }
      talk(cap, pick(L.treasureStart));
      await cap.navigate({ el: spotEl, x: x - Sx() * 0.8 }, "walk");
      const y = spotEl && M.validPerch(spotEl) ? spotEl.getBoundingClientRect().top : M.floorY();
      S.props.showChest(cap.sx + Sx() * 0.8, y); cap.face = 1;
      cap.play("open", 900); sfx("treasure");
      for (let k = 0; k <= 10; k++) { S.props.openChest(k / 10); await sleep(40); }
      W.glow = 1; S.fx.gold(cap.sx + Sx() * 0.8, y - Sx() * 0.4, 40); S.fx.coins(cap.sx + Sx() * 0.8, y - Sx() * 0.5, 8); W.emit("coins", 10);
      cap.hold("cheer"); talk(cap, pick(L.treasureFound)); await sleep(1800);
      for (let k = 10; k >= 0; k--) { S.props.openChest(k / 10); await sleep(35); }
      await sleep(500); S.props.hideChest(); cap.hold("idle");
    }
  };
  D.EVENTS = EVENTS;
  const WEIGHTS = {
    home: { arrive: 0.17, chase: 0.18, capture: 0.14, raid: 0.13, darksea: 0.1, boarding: 0.12, treasure: 0.16 },
    logbook: { chase: 0.35, raid: 0.3, treasure: 0.35 },
    crew: { chase: 0.35, treasure: 0.35, raid: 0.3 }
  };
  function chooseEvent() {
    const w = WEIGHTS[page] || WEIGHTS.home; let total = 0;
    for (const k in w) if (k !== D.lastEvent) total += w[k];
    let r = Math.random() * total;
    for (const k in w) { if (k === D.lastEvent) continue; r -= w[k]; if (r <= 0) return k; }
    return "treasure";
  }
  D.play = (name) => {
    if (reduce || !S.visible) return false;
    if (!EVENTS[name]) name = chooseEvent();
    D.lastEvent = name;
    D.nextEvent = W.time + gap();
    return run(EVENTS[name]);
  };
  const gap = () => (page === "home" ? rnd(small ? 50 : 34, small ? 85 : 62) : rnd(80, 140));

  /* ---------------- ambient life: wander, perch, look around, comment ---------------- */
  async function ambient() {
    await W.sleep(1200);
    if (page === "logbook") cap.rig.setItem("R", "lantern");
    try { await line(cap, page === "logbook" ? pick(L.archive) : page === "crew" ? pick(L.crewIntro) : pick(L.greet), "wave"); } catch (e) { /* interrupted */ }
    D.nextEvent = W.time + (page === "home" ? rnd(18, 28) : rnd(45, 70));
    let lastAct = "";
    for (;;) {
      await W.sleep(rnd(1400, 3400));
      try { lastAct = await tick(lastAct); } catch (e) { if (e !== CANCEL) console.error(e); }
    }
  }
  async function tick(lastAct) {
    if (D.busy || !S.visible) return lastAct;
    // never talk from behind a card: step out into plain view first
    if (cap.surf.type === "floor" && !cap.task && M.occluded(cap)) { const ox = M.openFloorX(cap.sx); if (ox != null) { await run(() => cap.navigate({ el: null, x: ox }, Math.abs(ox - cap.sx) > M.vw * 0.4 ? "run" : "walk")); return lastAct; } }
    if (D.queue.length) { const fn = D.queue.shift(); await run(fn); return lastAct; }
    if (D.pendingLine) { const l = D.pendingLine; D.pendingLine = null; await run(() => line(cap, l)); return lastAct; }
    if (D.enabled && !reduce && W.time > D.nextEvent) { await D.play(); return lastAct; }
    const r = Math.random();
    const act = r < 0.5 ? "wander" : r < 0.68 ? "perch" : r < 0.82 ? "look" : r < 0.92 ? "chatter" : "idle";
    if (act === lastAct && act !== "wander") return lastAct;
    await run(async () => {
      if (act === "wander") { const x = (Math.random() < 0.8 && M.openFloorX()) || rnd(Sx() * 1.2, M.vw - Sx() * 1.2); await cap.navigate({ el: null, x }, Math.abs(x - cap.sx) > M.vw * 0.45 ? "run" : "walk"); }
      else if (act === "perch") { const ps = M.perches(); if (ps.length) { const el = pick(ps), rr = el.getBoundingClientRect(); await cap.navigate({ el, x: rr.left + rr.width * rnd(0.2, 0.8) }); } }
      else if (act === "look") { cap.hold("look"); await sleep(rnd(1800, 3000)); }
      else if (act === "chatter") { cap.face = 0; await line(cap, pick(L.idle)); }
      cap.hold("idle");
    });
    return act;
  }

  /* section comments as they scroll into view */
  if ("IntersectionObserver" in window) {
    const seen = new Set(); let lastLine = 0;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting || seen.has(e.target)) return; seen.add(e.target);
      if (W.time - lastLine > 7) { D.pendingLine = e.target.dataset.captain; lastLine = W.time; }
    }), { threshold: 0.45 });
    document.querySelectorAll("[data-captain]").forEach((el) => io.observe(el));
  }

  window.KCDirector = D;
  if (reduce) { // a still captain who only speaks when spoken to
    cap.hold("idle"); if (page === "logbook") cap.rig.setItem("R", "lantern");
    return;
  }
  ambient();
})();
