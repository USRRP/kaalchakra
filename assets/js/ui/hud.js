/* Kaalchakra 2.0 — HUD: doubloons, the hidden-flag hunt, sound and captain toggles, "Talk" button.
   Works with or without WebGL. Progress is a per-visitor convenience kept in localStorage. */
(function () {
  "use strict";
  const KC = window.KC || {}, W = window.KCW;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  const TOTAL = KC.totalFlags || 8;
  const coinSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#d9a63a" stroke="#5a3a0a" stroke-width="1.6"/><circle cx="12" cy="12" r="6" fill="none" stroke="#5a3a0a" stroke-width="1" opacity=".6"/><path d="M12 8v8M9.8 10h3.4a1.6 1.6 0 010 3.2h-2.4a1.6 1.6 0 000 3.2h3.4" fill="none" stroke="#5a3a0a" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const flagSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V3" stroke="#e9d8b0" stroke-width="2" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" fill="#b8261f" stroke="#2a1608" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  const hud = document.createElement("div");
  hud.className = "hud"; hud.setAttribute("role", "group"); hud.setAttribute("aria-label", "Treasure hunt and captain controls");
  hud.innerHTML = `
    <div class="hud-panel" id="hud-panel" hidden>
      <button class="hud-btn" type="button" id="hud-talk">Talk to the captain</button>
      <button class="hud-btn" type="button" id="hud-sound" aria-pressed="false">Sound off</button>
      <button class="hud-btn" type="button" id="hud-cap" aria-pressed="false">Hide captain</button>
    </div>
    <button class="hud-toggle" type="button" aria-expanded="false" aria-controls="hud-panel">
      <span class="hud-item" title="Doubloons">${coinSvg}<b id="hud-coins">0</b><span class="visually-hidden"> doubloons,</span></span>
      <span class="hud-item" title="Hidden flags found on this site">${flagSvg}<b id="hud-flags">0/${TOTAL}</b><span class="visually-hidden"> hidden flags found. Captain controls</span></span>
      <svg class="hud-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 8l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>`;
  document.body.appendChild(hud);
  let coins = store.get("kc-coins", 0), found = store.get("kc-flags", []);
  const $c = hud.querySelector("#hud-coins"), $f = hud.querySelector("#hud-flags");
  const render = () => { $c.textContent = coins; $f.textContent = `${Math.min(found.length, TOTAL)}/${TOTAL}`; };
  render();
  const tog = hud.querySelector(".hud-toggle"), panel = hud.querySelector("#hud-panel");
  const setOpen = (o) => { tog.setAttribute("aria-expanded", String(o)); panel.hidden = !o; hud.classList.toggle("open", o); };
  tog.addEventListener("click", () => setOpen(panel.hidden));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { setOpen(false); tog.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !hud.contains(e.target)) setOpen(false); });
  const bump = () => { hud.classList.remove("bump"); void hud.offsetWidth; hud.classList.add("bump"); };
  function addCoins(n) { coins += n; store.set("kc-coins", coins); render(); bump(); }
  if (W) W.on("coins", addCoins);

  /* hidden flags */
  const FLAG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V3" stroke="#3b2414" stroke-width="2.4" stroke-linecap="round"/><path d="M6 4h12l-3 4 3 4H6z" fill="#b8261f" stroke="#2a1608" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  document.querySelectorAll(".flag-egg").forEach((btn) => {
    const id = btn.dataset.flag;
    btn.innerHTML = FLAG; btn.type = "button"; btn.setAttribute("aria-label", "Hidden flag. Collect it");
    if (found.includes(id)) btn.hidden = true;
    btn.addEventListener("click", () => {
      if (found.includes(id) || btn.classList.contains("stolen")) return;
      found.push(id); store.set("kc-flags", found); render();
      btn.classList.add("got"); setTimeout(() => (btn.hidden = true), 700);
      addCoins(25);
      const n = found.length, all = n >= TOTAL;
      if (W) W.emit("flag:found", { n, total: TOTAL, all });
      else if (window.KCCaptain) window.KCCaptain.say(all ? KC.captain.allFlags : `Flag ${n} of ${TOTAL}!`);
    });
  });

  /* talk */
  hud.querySelector("#hud-talk").addEventListener("click", () => window.KCCaptain && window.KCCaptain.talk());

  /* sound (off by default, low volume when on) */
  const snd = hud.querySelector("#hud-sound");
  let soundOn = store.get("kc-sound", false);
  const applySound = () => { snd.textContent = soundOn ? "Sound on" : "Sound off"; snd.setAttribute("aria-pressed", String(soundOn)); if (window.KCAudio) window.KCAudio.enable(soundOn); };
  snd.addEventListener("click", () => { soundOn = !soundOn; store.set("kc-sound", soundOn); applySound(); });
  snd.textContent = soundOn ? "Sound on" : "Sound off"; snd.setAttribute("aria-pressed", String(soundOn));
  // browsers only allow audio after a gesture: arm it on the first interaction if the visitor had it on
  if (soundOn) { const arm = () => { applySound(); window.removeEventListener("pointerdown", arm); window.removeEventListener("keydown", arm); }; window.addEventListener("pointerdown", arm); window.addEventListener("keydown", arm); }

  /* captain on/off */
  const capBtn = hud.querySelector("#hud-cap");
  let off = store.get("kc-cap-off", false);
  const applyCap = () => {
    capBtn.textContent = off ? "Show captain" : "Hide captain"; capBtn.setAttribute("aria-pressed", String(off));
    if (window.KCStage) window.KCStage.setVisible(!off);
    if (window.KCDirector) { window.KCDirector.enabled = !off; if (off && window.KCDirector.interrupt) window.KCDirector.interrupt(); }
    hud.querySelector("#hud-talk").hidden = off;
  };
  capBtn.addEventListener("click", () => { off = !off; store.set("kc-cap-off", off); applyCap(); });
  if (!window.KCStage) { capBtn.hidden = true; hud.querySelector("#hud-talk").hidden = false; }
  applyCap();
  window.KCHud = { addCoins };
})();
