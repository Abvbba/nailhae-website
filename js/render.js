/* nailhae — builds the page from js/data.js and wires everything that isn't scroll motion:
   the cover slideshow and LA clock, the orbit photos, the contact sheet, the finale and the booking form. */
(function () {
  const D = window.NAILHAE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, "0");
  const src = (id, size) => `img/${size}/${id}.webp`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => "$" + n;
  const LA = "America/Los_Angeles";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- toast ---------- */
  let toastT;
  function toast(msg) {
    const t = $(".toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- 01 · cover slideshow: a new set every 4 seconds ----------
     The next photo is revealed by a wipe from below while it settles from a slight zoom;
     the outgoing photo drifts up and dims underneath it. */
  function HeroSlides() {
    const ids = D.heroSlides;
    const box = $(".hero-slides");
    box.innerHTML = ids.map((id, i) => `<div class="hs${i === 0 ? " is-on" : ""}"${i ? ' aria-hidden="true"' : ""}>
        <div class="hs-in"><img ${i === 0 ? `src="${src(id, "l")}" fetchpriority="high"` : `data-src="${src(id, "l")}"`}
          width="1050" height="1400" decoding="async" alt="${esc(D.byId[id].alt)}"></div>
      </div>`).join("");
    const slides = $$(".hs", box);
    const blur = $(".hero-blur");
    const capI = $(".hsc-i"), bar = $(".hsc-bar");
    let cur = 0;

    const load = (i) => { const img = $("img", slides[i]); if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute("data-src"); } return img; };
    const caption = (i) => {
      capI.textContent = `(${pad(i + 1)}/${pad(ids.length)})`;
      bar.classList.remove("run"); void bar.offsetWidth; bar.classList.add("run");
    };
    caption(0);
    load(1);

    function show(n) {
      const next = slides[n], prev = slides[cur];
      slides.forEach((s) => { if (s !== next && s !== prev) s.className = "hs"; });
      prev.className = "hs is-off";
      void next.offsetWidth; // commit the hidden start state so the wipe transitions
      next.className = "hs is-on";
      slides.forEach((s) => s.setAttribute("aria-hidden", s === next ? "false" : "true"));
      blur.src = src(ids[n], "b");
      cur = n;
      caption(n);
      load((n + 1) % ids.length);
    }

    // Pause while the cover is off screen or the tab is hidden; the timer bar pauses with it.
    const paused = () => document.hidden || scrollY > innerHeight * 0.9;
    let t;
    function step() {
      if (paused()) { bar.classList.add("hold"); t = setTimeout(step, 600); return; }
      bar.classList.remove("hold");
      const n = (cur + 1) % ids.length;
      const img = load(n);
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => { show(n); t = setTimeout(step, 4000); });
    }
    t = setTimeout(step, 4000);
  }

  /* ---------- 01 · digital clock, Los Angeles time ---------- */
  function DigitalClock() {
    const face = $(".clk-face");
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: LA, hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });
    const dfmt = new Intl.DateTimeFormat("en-US", { timeZone: LA, weekday: "short", month: "short", day: "numeric" });
    const sfmt = new Intl.DateTimeFormat("en-US", { timeZone: LA, hour: "numeric", minute: "2-digit" });
    let slots = null, apEl;

    function roll(slot, ch) {
      const old = slot.lastElementChild;
      if (old && old.textContent === ch) return;
      const nu = document.createElement("span");
      nu.textContent = ch;
      slot.appendChild(nu);
      if (!old) return;
      if (reduced()) { old.remove(); return; }
      const ease = "cubic-bezier(.7, 0, .25, 1)";
      old.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-105%)", opacity: 0 }], { duration: 480, easing: ease, fill: "forwards" })
        .finished.then(() => old.remove()).catch(() => old.remove());
      nu.animate([{ transform: "translateY(105%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 480, easing: ease });
    }

    function render() {
      const now = new Date();
      const p = Object.fromEntries(fmt.formatToParts(now).map((x) => [x.type, x.value]));
      const str = `${p.hour.padStart(2, "0")}:${p.minute}:${p.second}`;
      if (!slots) {
        face.innerHTML = [...str].map((c) => c === ":" ? '<span class="clk-sep">:</span>' : '<span class="clk-d"></span>').join("") + '<span class="clk-ap"></span>';
        slots = $$(".clk-d", face);
        apEl = $(".clk-ap", face);
      }
      [...str.replace(/:/g, "")].forEach((c, i) => roll(slots[i], c));
      apEl.textContent = p.dayPeriod;
      $(".clk-date").textContent = dfmt.format(now);
      $(".clk-sr").textContent = `Los Angeles time ${sfmt.format(now)}`;
      $$(".clock").forEach((el) => (el.textContent = sfmt.format(now)));
    }
    render();
    setTimeout(() => { render(); setInterval(render, 1000); }, 1000 - (Date.now() % 1000));
  }

  /* ---------- 02 · SpatialCollage ---------- */
  function SpatialCollage() {
    $(".orbit-space").innerHTML = D.orbit.map((o) => {
      const s = D.byId[o.id];
      return `<figure class="o-item" style="--w:${o.w};--sx:${o.sx};--sy:${o.sy};--sr:${o.sr}">
        <img src="${src(o.id, "s")}" width="360" height="480" alt="${esc(s.alt)}" decoding="async">
      </figure>`;
    }).join("");
    $(".orbit-text").innerHTML = D.orbitText.map((block) =>
      `<span class="ot-block" aria-hidden="true">${block.map((line) =>
        `<span class="ot-line">${line.map((seg) => seg.ink ? `<span class="ot-ink">${esc(seg.t)}</span>` : `<span class="chrome-dark">${esc(seg.t)}</span>`).join("")}</span>`
      ).join("")}</span>`
    ).join("");
  }

  /* ---------- 03 · HorizontalGallery ---------- */
  function HorizontalGallery() {
    $(".gal-track").innerHTML = D.gallery.map((id, i) => {
      const s = D.byId[id];
      return `<li class="g-item" tabindex="0" aria-label="(${pad(i + 1)}) ${s.shape}, ${s.work}">
        <div class="g-frame">
          <div class="g-zoom"><img src="${src(id, "m")}" srcset="${src(id, "m")} 640w, ${src(id, "l")} 1050w"
            sizes="(max-width: 767px) 70vw, 30vw" width="640" height="853" loading="lazy" decoding="async" alt="${esc(s.alt)}"></div>
        </div>
        <p class="g-cap" aria-hidden="true"><span class="g-i">(${pad(i + 1)})</span><span class="g-m">${s.shape} · ${s.work}</span></p>
      </li>`;
    }).join("");
    $(".gal-ticks").innerHTML = D.gallery.map(() => "<i></i>").join("");
    $(".gal-ticks i").classList.add("on");
    $(".gal-count").innerHTML = `<span class="gal-count-i">(01)</span> / ${pad(D.gallery.length)}`;
  }

  /* ---------- 03 · Canvas as a grid ---------- */
  function GridView() {
    const gv = $("#grid-view");
    $(".gv-grid", gv).innerHTML = D.gallery.map((id, i) => {
      const s = D.byId[id];
      return `<li><button type="button" class="gv-item" data-i="${i}" aria-label="(${pad(i + 1)}) ${s.shape}, ${s.work}. Show in the strip">
        <span class="gv-frame"><img src="${src(id, "m")}" srcset="${src(id, "m")} 640w, ${src(id, "l")} 1050w"
          sizes="(max-width: 767px) 46vw, 24vw" width="640" height="853" loading="lazy" decoding="async" alt="${esc(s.alt)}"></span>
        <span class="g-cap"><span class="g-i">(${pad(i + 1)})</span><span class="g-m">${s.shape} · ${s.work}</span></span>
      </button></li>`;
    }).join("");
    $(".gv-count", gv).textContent = `${D.gallery.length} sets`;

    let last = null;
    function open() {
      if (!gv.hidden) return;
      last = document.activeElement;
      gv.hidden = false;
      gv.scrollTop = 0;
      document.documentElement.classList.add("gv-open");
      $('[data-view="grid"]', gv).focus({ preventScroll: true });
      if (reduced()) return;
      gv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" });
      $$(".gv-grid li", gv).forEach((li, i) => li.animate(
        [{ opacity: 0, transform: "translateY(40px) scale(.97)" }, { opacity: 1, transform: "none" }],
        { duration: 800, delay: 80 + Math.min(i, 16) * 40, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "backwards" }));
    }
    function close(then) {
      if (gv.hidden) return;
      const done = () => { gv.hidden = true; document.documentElement.classList.remove("gv-open"); (last || $(".gallery [data-view=grid]"))?.focus?.({ preventScroll: true }); then?.(); };
      if (reduced()) return done();
      gv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in", fill: "forwards" }).finished.then((a) => { done(); a.cancel(); });
    }
    document.addEventListener("click", (e) => {
      const v = e.target.closest("[data-view]");
      if (v) { v.dataset.view === "grid" ? open() : close(); return; }
      const it = e.target.closest(".gv-item");
      if (it) close(() => UI.goSet(+it.dataset.i));
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !gv.hidden) close(); });
  }

  /* ---------- 04 · EditorialFinale ---------- */
  function EditorialFinale() {
    const f = D.byId[D.finale];
    const main = $(".fin-media img");
    main.src = src(f.id, "l"); main.alt = f.alt;
    $$(".fin-side img").forEach((img, k) => {
      const s = D.byId[D.finaleSide[k]];
      img.src = src(s.id, "s"); img.alt = s.alt;
    });
  }

  /* ---------- 05 · Booking ---------- */
  function Booking() {
    const P = D.pricing;
    const form = $("#book-form");
    const sel = { service: "gelx", length: "xs", art: "none", extras: [] };

    const chipText = (g, o) => {
      if (g === "service") return `${o.name} · ${money(o.price)}`;
      if (g === "length" && !o.price) return `${o.name} · incl.`;
      return o.price ? `${o.name} +${money(o.price)}` : o.name;
    };
    const chip = (g, o) => {
      const on = g === "extras" ? sel.extras.includes(o.id) : sel[g] === o.id;
      return `<button type="button" class="chip" data-group="${g}" data-v="${o.id}" ${g === "extras" ? `aria-pressed="${on}"` : `role="radio" aria-checked="${on}"`}>${esc(chipText(g, o))}</button>`;
    };

    // Price list, in the studio's order. Rows that are choices pick that option.
    const row = (name, price, pick, note) => {
      const on = pick && isOn(pick);
      const tag = pick ? "button" : "div";
      return `<${tag} ${pick ? `type="button" data-pick="${pick}" aria-pressed="${on}"` : ""} class="pr${on ? " is-on" : ""}">
        <span class="pr-n"><span>${esc(name)}</span>${note ? `<small>${esc(note)}</small>` : ""}</span><span class="pr-d" aria-hidden="true"></span><span class="pr-p">${price}</span>
      </${tag}>`;
    };
    function isOn(pick) {
      const [g, v] = pick.split(":");
      return g === "extras" ? sel.extras.includes(v) : sel[g] === v && !(g === "length" && v === "xs");
    }
    function drawPrices() {
      const gelx = P.services[0];
      $(".price-list", form).innerHTML =
        `<div class="pr-group">${row(`${gelx.name} (*X-short included)`, money(gelx.price), "service:gelx")}${P.lengths.filter((l) => l.price).map((l) => row(l.name, "+" + money(l.price), "length:" + l.id)).join("")}</div>` +
        `<div class="pr-group">${P.services.slice(1).map((s) => row(s.name, money(s.price), "service:" + s.id)).join("")}</div>` +
        `<div class="pr-group">${P.art.filter((a) => a.price).map((a) => row(`${a.name} nail art`, "+" + money(a.price), "art:" + a.id, a.note)).join("")}</div>` +
        `<div class="pr-group">${P.extras.slice().reverse().map((x) => row(x.name, "+" + money(x.price), "extras:" + x.id)).join("")}${P.fees.map((f) => row(f.name, f.price)).join("")}</div>`;
    }

    function lines() {
      const svc = P.services.find((s) => s.id === sel.service);
      const out = [[svc.name, svc.price]];
      if (svc.lengths) { const l = P.lengths.find((x) => x.id === sel.length); out.push([l.name, l.price]); }
      const a = P.art.find((x) => x.id === sel.art);
      if (a.price) out.push([`${a.name} nail art`, a.price]);
      sel.extras.forEach((id) => { const x = P.extras.find((e) => e.id === id); out.push([x.name, x.price]); });
      return out;
    }

    function draw() {
      $('[data-group="service"]', form).innerHTML = P.services.map((o) => chip("service", o)).join("");
      $('[data-group="length"]', form).innerHTML = P.lengths.map((o) => chip("length", o)).join("");
      $('[data-group="art"]', form).innerHTML = P.art.map((o) => chip("art", o)).join("");
      $('[data-group="extras"]', form).innerHTML = P.extras.map((o) => chip("extras", o)).join("");
      $('[data-step="length"]', form).hidden = !P.services.find((s) => s.id === sel.service).lengths;
      drawPrices();
      const ls = lines();
      $(".bk-total-n", form).textContent = ls.reduce((t, l) => t + l[1], 0);
      $(".bk-lines", form).innerHTML = ls.map((l, i) => `<li><span class="pr-n">${esc(l[0])}</span><span class="pr-d" aria-hidden="true"></span><span>${l[1] ? (i ? "+" : "") + money(l[1]) : "incl."}</span></li>`).join("");
    }

    function choose(g, v) {
      if (g === "extras") sel.extras = sel.extras.includes(v) ? sel.extras.filter((x) => x !== v) : sel.extras.concat(v);
      else sel[g] = v;
      if (g === "length" && sel.service !== "gelx") sel.service = "gelx";
      draw();
    }

    form.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c) { choose(c.dataset.group, c.dataset.v); $(`.chip[data-group="${c.dataset.group}"][data-v="${c.dataset.v}"]`, form)?.focus(); return; }
      const p = e.target.closest("[data-pick]");
      if (p) { const [g, v] = p.dataset.pick.split(":"); choose(g, v); $(`[data-pick="${p.dataset.pick}"]`, form)?.focus(); }
    });

    // Bookable days: today (in LA) through six months out.
    const iso = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: LA }).format(d);
    const today = iso(new Date());
    const lastDay = iso(new Date(Date.now() + 183 * 864e5));
    const dateIn = $("#bk-date");
    dateIn.min = today; dateIn.max = lastDay;
    const pretty = (v) => { const [y, m, d] = v.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };

    // Phone: US format as you type, (213) 555-0100.
    const phoneIn = $("#bk-phone");
    const digits = (v) => { let d = v.replace(/\D/g, ""); if (d.length === 11 && d[0] === "1") d = d.slice(1); return d.slice(0, 10); };
    phoneIn.addEventListener("input", () => {
      const d = digits(phoneIn.value);
      phoneIn.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d.length ? `(${d}` : "";
    });

    form.addEventListener("input", (e) => { if (e.target.matches("[aria-invalid]")) e.target.removeAttribute("aria-invalid"); });

    // Checks the form and returns the request text, or null with the problem shown.
    function build() {
      const err = $(".bk-error", form);
      const bad = (el, text) => { el.setAttribute("aria-invalid", "true"); err.textContent = text; el.focus(); return null; };
      const need = ["#bk-date", "#bk-time", "#bk-name", "#bk-phone"].map((s) => $(s));
      need.forEach((i) => i.removeAttribute("aria-invalid"));
      const missing = need.filter((i) => !i.value.trim());
      if (missing.length) { missing.forEach((i) => i.setAttribute("aria-invalid", "true")); return bad(missing[0], "Add a date, a time, your name and a phone number so we can confirm."); }
      const v = dateIn.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || v < today || v > lastDay) return bad(dateIn, `Pick a date between ${pretty(today)} and ${pretty(lastDay)}.`);
      if (digits(phoneIn.value).length !== 10) return bad(phoneIn, "Enter a 10-digit phone number, like (213) 555-0100.");
      err.textContent = "";
      const [y, m, d] = v.split("-").map(Number);
      const [hh, mm] = $("#bk-time").value.split(":").map(Number);
      const when = new Date(y, m - 1, d, hh, mm);
      const day = when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const time = when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const ls = lines();
      const notes = $("#bk-notes").value.trim();
      return [
        "Hi nailhae, I'd like to book a set.",
        `Set: ${ls.map((l) => l[0]).join(", ")}`,
        `Estimate: ${money(ls.reduce((t, l) => t + l[1], 0))}`,
        `When: ${day} at ${time}`,
        `Name: ${$("#bk-name").value.trim()}`,
        `Phone: ${phoneIn.value.trim()}`,
        notes ? `Notes: ${notes}` : ""
      ].filter(Boolean).join("\n");
    }

    // One tap: copy the request, then let the link open the Instagram DM.
    // Instagram has no way to pre-fill a DM from a link, so the client pastes and sends.
    function copyAndShow(msg) {
      const box = $("#bk-msg");
      box.value = msg;
      $(".bk-done", form).hidden = false;
      const fail = () => { box.focus(); box.select(); toast("Copy is blocked here. Select your request below and copy it"); };
      try { navigator.clipboard.writeText(msg).then(() => toast("Request copied. Paste it in the DM and send"), fail); } catch (er) { fail(); }
    }
    $(".bk-send", form).addEventListener("click", (e) => {
      const msg = build();
      if (!msg) { e.preventDefault(); return; }
      copyAndShow(msg);
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); $(".bk-send", form).click(); });

    draw();
  }

  /* ---------- build ---------- */
  HeroSlides();
  DigitalClock();
  SpatialCollage();
  HorizontalGallery();
  GridView();
  EditorialFinale();
  Booking();

  // Section links. Without motion these are plain anchors; motion.js replaces `go` with scene-aware scrolling.
  const UI = {
    toast,
    go(key) {
      const el = key === "top" ? document.body : document.getElementById(key);
      el?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" });
    },
    // Bring one set of the strip into view (motion.js replaces this with a scroll to its point on the pinned strip).
    goSet(i) {
      const li = $$(".g-item")[i];
      if (!li) return;
      li.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center", inline: "start" });
      li.focus({ preventScroll: true });
    }
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-go]");
    if (!a) return;
    e.preventDefault();
    UI.go(a.dataset.go);
  });
  window.NAILHAE_UI = UI;
})();
