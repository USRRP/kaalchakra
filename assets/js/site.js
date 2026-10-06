/* Kaalchakra 2.0 — page logic: nav, registration state, category cards, FAQ (answered by the captain),
   Hall of Legends leaderboards, crew registry. Hidden flags live in ui/hud.js. Cards rendered here get
   [data-perch] so Captain Kaal can stand on them. */
(function () {
  "use strict";
  const KC = window.KC || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n).toLocaleString("en-IN");
  const captainSay = (t) => window.KCCaptain && window.KCCaptain.say(t);


  /* nav */
  const toggle = $(".nav-toggle"), links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => { const o = toggle.getAttribute("aria-expanded") !== "true"; toggle.setAttribute("aria-expanded", String(o)); links.classList.toggle("open", o); });
    links.addEventListener("click", (e) => { if (e.target.closest("a")) { toggle.setAttribute("aria-expanded", "false"); links.classList.remove("open"); } });
  }
  const header = $(".site-header");
  const page = document.body.dataset.page;
  if (header && page === "home") { const f = () => header.classList.toggle("solid", window.scrollY > 60); f(); window.addEventListener("scroll", f, { passive: true }); }
  $$("[data-link]").forEach((a) => { const h = (KC.links || {})[a.dataset.link]; if (h) a.href = h; });


  /* ================= HOME ================= */
  function home() {
    const ev = KC.event || {};
    const reg = $("#register-btn"), sign = $("#status-sign");
    if (ev.registrationOpen && ev.registerUrl) { reg.href = ev.registerUrl; reg.lastChild.textContent = " Register your crew"; sign.lastChild.textContent = "Registrations are open"; sign.classList.add("live"); }
    const dateEl = $("#chip-date");
    if (ev.qualifierStart && dateEl) {
      const t = new Date(ev.qualifierStart);
      const tick = () => { const ms = t - Date.now(); if (ms <= 0) { dateEl.textContent = "under way"; return; }
        dateEl.textContent = `in ${Math.floor(ms / 864e5)}d ${Math.floor(ms / 36e5) % 24}h ${Math.floor(ms / 6e4) % 60}m`; };
      tick(); setInterval(tick, 30000);
    }
    const sp = $("#sponsor-btn");
    if (sp) sp.href = ev.sponsorEmail ? "mailto:" + ev.sponsorEmail : (KC.links || {}).linkedin || "#";
    if (ev.sponsorEmail && $("#sponsor-address")) { $("#sponsor-address").textContent = "Or write to " + ev.sponsorEmail; $("#sponsor-address").hidden = false; }
    levels(); faq();
    const chestArt = $(".chest-art");
    if (chestArt) {
      chestArt.setAttribute("tabindex", "0"); chestArt.setAttribute("role", "button");
      chestArt.setAttribute("aria-label", "Treasure chest. Send Captain Kaal to dig for treasure");
      const go = () => { captainSay("Treasure? Say no more. Watch this!"); window.KCCaptain && window.KCCaptain.play("treasure"); };
      chestArt.addEventListener("click", go);
      chestArt.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    }
  }

  const ICONS = {
    W: '<circle cx="24" cy="24" r="17" fill="#9fb7b4"/><path d="M7 24h34M24 7c-6 6-6 28 0 34M24 7c6 6 6 28 0 34M10 15h28M10 33h28" fill="none" stroke="#24140a" stroke-width="2.6"/><circle cx="24" cy="24" r="17" fill="none" stroke="#24140a" stroke-width="3"/>',
    C: '<rect x="10" y="21" width="28" height="21" rx="4" fill="#c9a24a" stroke="#24140a" stroke-width="3"/><path d="M16 21v-6a8 8 0 0116 0v6" fill="none" stroke="#24140a" stroke-width="3.4"/><circle cx="24" cy="30" r="3" fill="#24140a"/><path d="M24 31v5" stroke="#24140a" stroke-width="3"/>',
    F: '<circle cx="20" cy="20" r="12" fill="#d3dcd9" stroke="#24140a" stroke-width="3.4"/><path d="M29 29l11 11" stroke="#8b5222" stroke-width="6" stroke-linecap="round"/><path d="M29 29l11 11" stroke="#24140a" stroke-width="1.5" stroke-linecap="round"/><path d="M14 18a7 7 0 016-5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    R: '<path d="M24 6l3.5 5 6-1.4 1 6 5.5 2.6-2.4 5.6 2.4 5.6-5.5 2.6-1 6-6-1.4L24 42l-3.5-5-6 1.4-1-6L8 29.8l2.4-5.6L8 18.6l5.5-2.6 1-6 6 1.4z" fill="#a9adb2" stroke="#24140a" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="24" r="6" fill="#c9a24a" stroke="#24140a" stroke-width="3"/>',
    O: '<path d="M6 30l26-14 4 8-26 14z" fill="#8a5a34" stroke="#24140a" stroke-width="3" stroke-linejoin="round"/><path d="M30 17l8-4 4 8-8 4z" fill="#c9a24a" stroke="#24140a" stroke-width="3" stroke-linejoin="round"/><path d="M14 26l3 6" stroke="#24140a" stroke-width="2.4"/><path d="M14 38l6 4M24 32l-4 10" stroke="#24140a" stroke-width="3" stroke-linecap="round"/>',
    A: '<rect x="11" y="13" width="26" height="22" rx="8" fill="#b9c7c2" stroke="#24140a" stroke-width="3"/><circle cx="19" cy="24" r="3.2" fill="#24140a"/><circle cx="29" cy="24" r="3.2" fill="#24140a"/><path d="M20 30h8" stroke="#24140a" stroke-width="2.6" stroke-linecap="round"/><path d="M24 13V7" stroke="#24140a" stroke-width="3"/><circle cx="24" cy="6" r="3" fill="#a82a22" stroke="#24140a" stroke-width="2"/>',
    P: '<path d="M8 28l24-9 6 8-24 9z" fill="#3c4048" stroke="#24140a" stroke-width="3" stroke-linejoin="round"/><circle cx="17" cy="36" r="6" fill="#8b5222" stroke="#24140a" stroke-width="3"/><circle cx="17" cy="36" r="1.8" fill="#24140a"/><path d="M38 19c3-3 5-2 6-5M39 24c3 0 5 2 7 1" stroke="#c85a32" stroke-width="3" stroke-linecap="round" fill="none"/>',
    M: '<circle cx="24" cy="24" r="17" fill="#efe2c2" stroke="#24140a" stroke-width="3"/><path d="M24 9l5 15-5 15-5-15z" fill="#a82a22" stroke="#24140a" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 24l5 0-5 15-5-15z" fill="#fff"/><circle cx="24" cy="24" r="2.4" fill="#24140a"/>'
  };
  function levels() {
    const el = $("#levels");
    if (!el || !KC.seas) return;
    el.innerHTML = KC.seas.map((s, i) => `<button class="level" type="button" aria-pressed="false" data-i="${i}" data-perch>
        <span class="lv-art" aria-hidden="true"><svg viewBox="0 0 48 48">${ICONS[s.glyph] || ICONS.M}</svg></span>
        <span class="lv-name">${esc(s.sea)}</span><span class="lv-cat">${esc(s.cat)}</span>
        <span class="lv-text">${esc(s.text)}</span>
        <ul class="lv-tags" aria-label="Skills">${s.skills.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></button>`).join("");
    $$(".level", el).forEach((b) => b.addEventListener("click", () => {
      $$(".level", el).forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      const s = KC.seas[+b.dataset.i];
      captainSay(`${s.sea}! That's ${s.cat}. Expect ${s.skills.slice(0, 2).join(" and ").toLowerCase()}. Good luck, sailor.`);
    }));
  }
  function faq() {
    const el = $("#faq-list");
    if (!el || !KC.faq) return;
    el.innerHTML = KC.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
    $$("details", el).forEach((d, i) => d.addEventListener("toggle", () => { if (d.open) captainSay(KC.faq[i].a); }));
  }

  /* ================= LOGBOOK ================= */
  function logbook() {
    const P = KC.past; if (!P) return;
    const qRank = new Map(P.quals.map((q, i) => [q[0], i + 1]));
    const finalists = new Set(P.finals.map((f) => f[0]));
    const [a, b, c] = P.finals;
    $("#podium").innerHTML = [["second", "2", b], ["first", "1", a], ["third", "3", c]].map(([cls, n, t]) =>
      `<div class="step ${cls}"><span class="medal">${n}</span><span class="team">${esc(t[0])}</span><span class="pts">${fmt(t[1])} pts</span><div class="block" aria-hidden="true" data-solid>${n}</div></div>`).join("");
    const g = (i) => (i < 3 ? ` class="g${i + 1}"` : "");
    $("#finals-body").innerHTML = P.finals.map((f, i) => {
      const q = qRank.get(f[0]), d = q - (i + 1);
      const mv = d > 0 ? `<span class="up">▲${d}</span>` : d < 0 ? `<span class="down">▼${-d}</span>` : `<span class="same">=</span>`;
      return `<tr${g(i)}><td class="rk"><span>${i + 1}</span></td><td>${esc(f[0])}</td><td class="num">${q} ${mv}</td><td class="num">${fmt(f[1])}</td></tr>`;
    }).join("");
    const body = $("#quals-body"), search = $("#quals-search"), more = $("#quals-more"), count = $("#quals-count");
    let all = false;
    function render() {
      const term = search.value.trim().toLowerCase();
      let rows = P.quals.map((q, i) => ({ r: i + 1, n: q[0], p: q[1] }));
      if (term) rows = rows.filter((x) => x.n.toLowerCase().includes(term));
      const shown = term || all ? rows : rows.slice(0, 25);
      body.innerHTML = shown.length ? shown.map((x) => `<tr${g(x.r - 1)}><td class="rk"><span>${x.r}</span></td><td>${esc(x.n)}${finalists.has(x.n) ? '<span class="badge">finalist</span>' : ""}</td><td class="num">${fmt(x.p)}</td></tr>`).join("")
        : `<tr><td colspan="3">No crew matches “${esc(term)}”.</td></tr>`;
      count.textContent = term ? `${rows.length} match` : `Top ${shown.length} of ${P.quals.length}`;
      more.hidden = !!term; more.textContent = all ? "Show top 25" : `Show all ${P.quals.length} crews`;
    }
    search.addEventListener("input", render); more.addEventListener("click", () => { all = !all; render(); }); render();
    $("#cats-2026").innerHTML = P.categories.map((c) => `<li>${esc(c)}</li>`).join("");
    $("#prize-cards").innerHTML = P.prizes.map((p) => `<div class="panel" data-perch><span class="kicker">${esc(p.place)} place</span><span class="cash">${esc(p.cash)}</span>
      <p>Cash, in a prize package worth ${esc(p.worth)}</p><ul>${p.perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
    $("#prizes-rest").innerHTML = P.prizesRest.map((p) => `<div class="panel"><h3>${esc(p.place)}</h3><ul>${p.perks.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("");
    $("#tiers").innerHTML = P.sponsors.map((t) => `<div class="tier"><h3>${esc(t.tier)}</h3><ul>${t.list.map(([n, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join("")}</ul></div>`).join("");
  }

  /* ================= CREW ================= */
  function crew() {
    const ini = (n) => n.replace(/\(.*?\)/g, "").replace(/\b(Dr|Prof|Mr|Ms|Mrs)\.\s*/g, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    const card = (p, cls) => p.name
      ? `<article class="mate ${cls}" data-perch><div class="portrait" aria-hidden="true">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(ini(p.name))}</div><h3>${esc(p.name)}</h3>${p.role ? `<p class="role">${esc(p.role)}</p>` : ""}${p.line ? `<p class="line">${esc(p.line)}</p>` : ""}${p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}</article>`
      : `<article class="mate open" data-solid><div class="portrait" aria-hidden="true">?</div><h3>Name to be announced</h3><p class="role">${esc(p.role || "Organising crew")}</p><p class="line">Joining the crew for 2.0</p></article>`;
    $("#faculty").innerHTML = KC.faculty.map((p) => card(p, "")).join("");
    $("#core").innerHTML = KC.core.map((p) => card(p, "core")).join("");
    $("#newcrew").innerHTML = KC.newCrew.map((p) => card(p, "")).join("");
  }
  if (page === "home") home();
  if (page === "logbook") logbook();
  if (page === "crew") crew();
})();
