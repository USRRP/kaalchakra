/* Kaalchakra 2.0 — InteractionManager: how Captain Kaal reacts to the visitor.
   Looks at the cursor, turns when you come close, answers clicks (and gets annoyed by too many),
   notices fast scrolling, cheers found flags, points at the registration CTA and Discord,
   introduces the crew, guards the archive, and hovers near the FAQ. */
(function () {
  "use strict";
  const W = window.KCW, S = window.KCStage, D = window.KCDirector, M = window.KCMove;
  const KC = window.KC || {}, L = KC.captain || {};
  const pick = (a) => (a && a.length ? a[Math.floor(Math.random() * a.length)] : "");
  const live = document.createElement("p"); live.className = "visually-hidden"; live.setAttribute("aria-live", "polite"); document.body.appendChild(live);

  // public API used by site.js / hud.js (works even without WebGL: falls back to the live region)
  const API = {
    say(text) { live.textContent = text; if (!S || !S.visible) return; S.say(S.captain, text); if (D && !D.busy) S.captain.hold("talk"); setTimeout(() => { if (S.captain.anim === "talk" && !(D && D.busy)) S.captain.hold("idle"); }, Math.min(6000, 1500 + text.length * 45)); },
    play(name) { if (D) D.play(name); },
    talk() { poke(true); }
  };
  window.KCCaptain = API;
  if (!S || !D || !M) return;
  const cap = S.captain;

  /* cursor: look at it; turn to face visitors who come close */
  let mx = -1, my = -1;
  window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
  W.addTick(() => {
    if (mx < 0 || !S.visible) { cap.headLook = null; return; }
    const dx = mx - cap.sx, dy = my - (cap.sy - M.S * 1.7), d = Math.hypot(dx, dy);
    cap.headLook = Math.max(-0.75, Math.min(0.75, (dx / (M.S * 6)) - cap.ry * 0.35));
    if (!D.busy && !cap.task && d < M.S * 2.2 && (cap.anim === "idle" || cap.anim === "look")) cap.face = 0;
  }, 6);

  /* clicks: reactions, then annoyance */
  const pokes = [];
  function poke(fromButton) {
    const now = W.time; pokes.push(now); while (pokes.length && now - pokes[0] > 6) pokes.shift();
    if (pokes.length >= 4) {
      S.say(cap, pick(L.annoyed)); live.textContent = "Captain Kaal is getting annoyed.";
      if (!D.busy) { cap.stop(); cap.face = 0; cap.hold("annoyed"); setTimeout(() => { if (cap.anim === "annoyed") cap.hold("idle"); }, 2600); }
      return;
    }
    const text = pick(L.poke); S.say(cap, text); live.textContent = text;
    if (!D.busy) {
      cap.face = 0;
      if (cap.surf.type !== "air" && !cap.task && !fromButton) { const x = cap.sx; cap.jumpTo(cap.surf.type === "perch" ? cap.surf.el : null, x).then(() => cap.hold("laugh")); }
      else cap.hold("laugh");
      setTimeout(() => { if (cap.anim === "laugh") cap.hold("idle"); }, 1400);
    }
  }
  S.hit.addEventListener("click", () => poke(false));

  /* fast scrolling knocks him off his perch */
  let lastScrollNote = -20;
  W.on("scroll:fast", () => {
    if (W.time - lastScrollNote < 14) return; lastScrollNote = W.time;
    if (cap.surf.type === "perch" && !D.busy) cap.fall().then(() => { cap.play("getup", 500); S.say(cap, pick(L.fastScroll)); });
    else if (!D.busy) { S.say(cap, pick(L.fastScroll)); cap.hold("look"); }
  });

  /* hidden flags + doubloons */
  W.on("flag:found", (d) => {
    const text = d.all ? L.allFlags : (L.flag || "Flag {n} of {t}!").replace("{n}", d.n).replace("{t}", d.total);
    S.say(cap, text, 6500); live.textContent = text;
    if (!D.busy) { cap.face = 0; cap.hold(d.all ? "cheer" : "victory"); setTimeout(() => { if (!D.busy) cap.hold("idle"); }, d.all ? 3500 : 1600); }
    S.fx.gold(cap.sx, cap.sy - M.S, d.all ? 60 : 18); S.fx.coins(cap.sx, cap.sy - M.S * 1.4, d.all ? 14 : 5); W.emit("sfx", "treasure");
  });

  /* point at the registration CTA / Discord when the visitor reaches for them */
  let lastPoint = -20;
  function pointAt(el, text) {
    if (D.busy || W.time - lastPoint < 9 || !S.visible) return;
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > M.vh) return;
    lastPoint = W.time;
    const cx = (r.left + r.right) / 2;
    D.queue.unshift(async () => {
      const stand = Math.max(M.S, Math.min(M.vw - M.S, cx + (cap.sx > cx ? 1 : -1) * M.S * 2.2));
      await cap.navigate({ el: null, x: stand }, Math.abs(stand - cap.sx) > M.vw * 0.3 ? "run" : "walk");
      cap.faceTo(cx); cap.pointY = Math.max(-1, Math.min(1, (cap.sy - M.S * 1.5 - (r.top + r.bottom) / 2) / (M.S * 3)));
      cap.hold("point"); S.say(cap, text); await W.sleep(2600); cap.hold("idle");
    });
  }
  document.querySelectorAll("#register-btn").forEach((el) => ["mouseenter", "focus"].forEach((ev) => el.addEventListener(ev, () => pointAt(el, pick(L.cta)))));
  document.querySelectorAll('[data-link="discord"]').forEach((el) => ["mouseenter", "focus"].forEach((ev) => el.addEventListener(ev, () => pointAt(el, pick(L.discord)))));

  /* FAQ: when it's on screen, the captain comes over to answer */
  const faq = document.getElementById("faq-list");
  if (faq && "IntersectionObserver" in window) {
    let done = false;
    new IntersectionObserver((es) => {
      if (done || !es[0].isIntersecting) return; done = true;
      D.queue.push(async () => { const r = faq.getBoundingClientRect(); await cap.navigate({ el: M.validPerch(faq) ? faq : null, x: r.right - M.S * 1.5 }); cap.face = 0; S.say(cap, pick(L.faqNear)); cap.hold("talk"); await W.sleep(2600); cap.hold("idle"); });
    }, { threshold: 0.3 }).observe(faq);
  }

  /* Crew: he walks along the roster and introduces a few names */
  if (W.page === "crew") {
    setTimeout(() => {
      D.queue.push(async () => {
        const cards = Array.from(document.querySelectorAll(".mate[data-perch]")).filter((c) => M.validPerch(c) && c.querySelector("h3") && !c.classList.contains("open")).slice(0, 3);
        for (const c of cards) {
          if (!M.validPerch(c)) continue;
          const r = c.getBoundingClientRect(); await cap.navigate({ el: c, x: (r.left + r.right) / 2 });
          cap.face = 0; const name = c.querySelector("h3").textContent.trim(), role = (c.querySelector(".role") || {}).textContent || "crew";
          S.say(cap, (L.introduce || "This is {name}, {role}.").replace("{name}", name).replace("{role}", role.trim().toLowerCase()));
          cap.hold("talk"); await W.sleep(2600); cap.hold("idle");
        }
      });
    }, 6000);
  }
})();
