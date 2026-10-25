/* nailhae — motion choreography (GSAP + ScrollTrigger).
   One pinned stage carries three scenes on a single scrubbed timeline, so the camera never cuts:
     cover   0.00 – 1.48   camera pushes into the photo, type falls away, photo dissolves to grey
     orbit   1.00 – 4.45   photos emerge from depth onto a turning ring, headline resolves, ring flies past
     sets    3.75 – end    contact sheet slides in, then vertical scroll drives it sideways (desktop)
   The studio finale has its own timeline after the pin releases.
   Time is in "units"; one unit = U px of scroll, so pacing is identical at every scene. */
(function () {
  const root = document.documentElement;
  const D = window.NAILHAE;
  const UI = window.NAILHAE_UI;
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  if (!window.gsap || !window.ScrollTrigger || reduceMQ.matches) {
    root.classList.remove("motion", "intro", "desk");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const css = getComputedStyle(root);
  const C = { grey: css.getPropertyValue("--grey").trim(), paper: css.getPropertyValue("--paper").trim() };
  const clamp = gsap.utils.clamp;
  const pad = (n) => String(n).padStart(2, "0");
  const smooth = (a, b, v) => { const t = clamp(0, 1, (v - a) / (b - a)); return t * t * (3 - 2 * t); };

  const el = {
    stage: $(".stage"), hero: $(".hero"), mark: $(".hero-mark"), markIn: $(".hero-mark-in"),
    media: $(".hero-media"), tilt: $(".hero-tilt"), slides: $(".hero-slides"), blur: $(".hero-blur"),
    copy: $(".hero-copy"), meta: $(".hero-meta"), clock: $(".hero-clock"), cap: $(".hero-slide-cap"),
    orbit: $(".orbit"), space: $(".orbit-space"), items: $$(".o-item"), lines: $$(".ot-line"), blocks: $$(".ot-block"),
    gallery: $(".gallery"), gHead: $(".gal-head"), gTitle: $(".gal-title"), gCount: $(".gal-count"), gHint: $(".gal-hint"),
    gView: $(".gal-view"), track: $(".gal-track"), gItems: $$(".g-item"), gImgs: $$(".g-zoom img"),
    ticks: $(".gal-ticks"), tickEls: $$(".gal-ticks i"),
    finale: $(".finale"), finMedia: $(".fin-media"), finImg: $(".fin-media img"), finL1: $(".fin-l1"), finL2: $(".fin-l2"),
    sideA: $(".fin-side-a"), sideB: $(".fin-side-b"),
    gauge: $(".ui-gauge-fill"), sceneN: $(".ui-scene-n"), sceneName: $(".ui-scene-name"),
    booking: $(".booking"),
    navSets: $('.nav-link[data-go="sets"]'), navStudio: $('.nav-link[data-go="studio"]'), navBook: $('.nav-link[data-go="book"]')
  };

  let ctx, master, st, U, desk, travel, geo, P, galIdx = -1, scene = -1, eager = false;
  let imgX = [], itemLeft = [], itemW = 0;

  /* ---------- page entrance (runs once) ---------- */
  function intro() {
    // Intro animates the children; the scroll timeline owns the containers, so the two never fight.
    const ins = [...$$(".hero .in"), ...el.clock.children, ...el.cap.children];
    const ui = [$(".ui-nav-in")];
    // Swap the CSS pre-hide for GSAP's own start state in the same frame (no paint in between).
    root.classList.remove("intro");
    gsap.set(el.markIn, { y: 0, yPercent: 105 });
    gsap.set(el.tilt, { clipPath: "inset(100% 0% 0% 0%)" });
    gsap.set(ins, { opacity: 0, y: 22 });
    gsap.set(ui, { opacity: 0, y: 14 });
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(el.tilt, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "power3.inOut" }, 0)
      .fromTo(el.slides, { scale: 1.28 }, { scale: 1, duration: 2.1, ease: "power2.out" }, 0)
      .to(el.markIn, { yPercent: 0, duration: 1.3, ease: "expo.out" }, 0.35)
      .to(ins, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power2.out" }, 0.75)
      .to(ui, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" }, 0.95)
      .add(() => gsap.set(el.tilt, { clearProps: "clipPath" }));
  }

  /* ---------- pointer depth (fine pointers only) ---------- */
  function pointer() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    // The cover drifts against the pointer; a little overscale keeps its edges off screen.
    gsap.set(el.tilt, { scale: 1.05 });
    const q = (t, p) => gsap.quickTo(t, p, { duration: 1.2, ease: "power3.out" });
    const tx = q(el.tilt, "x"), ty = q(el.tilt, "y");
    const ox = q(el.space, "rotationY"), oy = q(el.space, "rotationX");
    addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      tx(-nx * 22); ty(-ny * 14);
      ox(nx * 12); oy(-ny * 9);
    }, { passive: true });
  }

  /* ---------- orbit renderer: one writer per photo, called from the master timeline ---------- */
  function renderOrbit() {
    const n = geo.n;
    for (let i = 0; i < n; i++) {
      const o = D.orbit[i], it = el.items[i];
      const ap = clamp(0, 1, (P.appear - (i / n) * 0.5) / 0.5);
      const e = 1 - Math.pow(1 - ap, 3);
      const near = (o.d + 1) / 2;
      const a = (geo.base[i] + P.spin) * Math.PI / 180;
      const R = (0.14 + 0.86 * P.R) * o.m * (1 + P.fly * (0.8 + 0.9 * near));
      const x = Math.cos(a) * geo.ex * R;
      const y = Math.sin(a) * geo.ey * R;
      const z = o.d * geo.depth * P.depth - (1 - e) * 900 + P.fly * (180 + 320 * near);
      const s = 0.55 + 0.45 * e;
      const rot = o.r + P.spin * 0.35 * (i % 2 ? -1 : 1);
      const op = e * (1 - smooth(0.5, 1, P.fly));
      it.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      it.style.opacity = op.toFixed(3);
      it.style.visibility = op < 0.01 ? "hidden" : "visible";
    }
  }

  function setGalleryIndex(i) {
    if (i === galIdx) return;
    galIdx = i;
    $(".gal-count-i").textContent = `(${pad(i + 1)})`;
    el.tickEls.forEach((t, k) => t.classList.toggle("on", k === i));
  }

  function tick() {
    const t = master.time();
    if (t > 0.9 && t < 4.6) renderOrbit();
    if (!eager && t > 0.8) { eager = true; el.gImgs.forEach((im) => (im.loading = "eager")); }
    if (travel && t > travel.start - 0.3) {
      const x = gsap.getProperty(el.track, "x");
      const vw = innerWidth;
      for (let i = 0; i < itemLeft.length; i++) {
        const rel = (itemLeft[i] + itemW / 2 + x - vw / 2) / vw;
        if (rel > -1.2 && rel < 1.2) imgX[i](-rel * 9);
      }
      setGalleryIndex(Math.round(clamp(0, 1, -x / travel.dist) * (el.gItems.length - 1)));
    }
  }

  /* ---------- build every scroll-linked timeline for the current viewport ---------- */
  function build() {
    desk = innerWidth >= 768;
    root.classList.toggle("desk", desk);
    const vw = innerWidth;
    const vh = el.stage.clientHeight || innerHeight;
    U = vh * (desk ? 0.9 : 0.8);
    galIdx = -1;

    const n = desk ? (vw < 1024 ? 7 : 8) : 6;
    el.items.forEach((it, i) => (it.style.display = i < n ? "" : "none"));
    geo = {
      n,
      ex: vw * (desk ? 0.34 : 0.41),
      ey: vh * (desk ? 0.35 : 0.37),
      depth: desk ? 240 : 110,
      base: D.orbit.slice(0, n).map((o, i) => -90 + (i * 360) / n + o.r * 0.6)
    };
    P = { spin: -60, R: 0, appear: 0, depth: 0, fly: 0 };

    ctx = gsap.context(() => {
      master = gsap.timeline({ defaults: { ease: "none" }, onUpdate: tick });

      /* 01 · cover: a dolly into the photo. Origin sits on the nails, not the frame centre. */
      master.addLabel("cover", 0)
        .to(el.media, { scale: desk ? 1.7 : 1.8, y: -vh * 0.04, duration: 1.35, ease: "power2.in" }, 0)
        .fromTo(el.mark, { filter: "blur(0px)" }, { yPercent: -40, opacity: 0, filter: "blur(14px)", duration: 0.7, ease: "power2.in" }, 0.05)
        .to(el.copy, { y: -vh * 0.14, opacity: 0, duration: 0.55, ease: "power1.in" }, 0.12)
        .to([el.meta, el.cap], { opacity: 0, duration: 0.25 }, 0)
        .fromTo(el.clock, { filter: "blur(0px)" }, { y: vh * 0.08, opacity: 0, filter: "blur(12px)", duration: 0.6, ease: "power2.in" }, 0.2)
        .to(el.blur, { opacity: 1, duration: 0.45 }, 0.78)
        .to(".hero-shade", { opacity: 0, duration: 0.45 }, 0.78)
        .to(el.stage, { backgroundColor: C.grey, duration: 0.5 }, 0.85)
        .to(el.media, { opacity: 0, duration: 0.42, ease: "power1.in" }, 1.05)
        .set(el.hero, { autoAlpha: 0 }, 1.48);

      /* 02 · orbit */
      const T0 = 1.0;
      gsap.set(el.lines, { opacity: 0, y: 26, filter: "blur(12px)" });
      master.addLabel("orbit", T0 + 0.5)
        .set(el.orbit, { autoAlpha: 1 }, T0)
        .to(P, { appear: 1, duration: 1.1 }, T0)
        .to(P, { R: 1, duration: 1.25, ease: "power3.out" }, T0)
        .to(P, { depth: 1, duration: 1.1, ease: "power2.out" }, T0)
        .to(P, { spin: 48, duration: 3.45 }, T0)
        .to(P, { fly: 1, duration: 1.25, ease: "power2.in" }, T0 + 2.15);
      el.blocks.forEach((b, bi) => {
        master.to($$(".ot-line", b), { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.42, stagger: 0.11, ease: "power2.out" }, T0 + 0.45 + bi * 0.36);
      });
      master.to(el.lines, { opacity: 0, y: -20, filter: "blur(10px)", duration: 0.36, stagger: 0.045, ease: "power2.in" }, T0 + 2.05)
        .set(el.orbit, { autoAlpha: 0 }, T0 + 3.45);

      /* 03 · sets: the contact sheet slides in and settles, then scroll drives it sideways */
      const G0 = 3.85;
      const lead = Math.min(7, el.gItems.length);
      master.addLabel("sets", G0)
        .set(el.gallery, { autoAlpha: 1 }, G0)
        .fromTo(el.gTitle, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "expo.out" }, G0 + 0.1)
        .fromTo([el.gCount, el.gHint, el.ticks], { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.06 }, G0 + 0.35);
      el.gItems.forEach((it, i) => {
        const k = Math.min(i, lead);
        master.fromTo(it, { x: vw * 0.85 + k * vw * 0.035 }, { x: 0, duration: 1, ease: "power3.out" }, G0 + k * 0.03);
      });

      travel = null;
      itemLeft = []; imgX = [];
      if (desk && el.gItems.length) {
        const last = el.gItems[el.gItems.length - 1];
        const gr = parseFloat(getComputedStyle(el.track).paddingRight) || 20;
        const dist = Math.max(0, last.offsetLeft + last.offsetWidth + gr - vw);
        const tu = dist / 1.75 / U;
        const TS = G0 + 1.0;
        itemW = el.gItems[0].offsetWidth;
        itemLeft = el.gItems.map((it) => it.offsetLeft);
        gsap.set(el.gImgs, { scale: 1.16, xPercent: 0 });
        imgX = el.gImgs.map((im) => gsap.quickSetter(im, "xPercent"));
        master.addLabel("travel", TS)
          .to(el.track, { x: -dist, duration: tu }, TS)
          .to({}, { duration: 0.35 });
        travel = { start: TS, dur: tu, dist };
      } else {
        master.addLabel("travel", G0 + 1.0).to({}, { duration: 0.5 }, G0 + 1.0);
      }

      st = ScrollTrigger.create({
        trigger: el.stage,
        start: "top top",
        end: () => "+=" + Math.round(master.duration() * U),
        pin: true,
        scrub: desk ? 0.9 : 0.6,
        animation: master,
        anticipatePin: 1
      });

      /* 04 · studio: the last photo arrives like one of the orbit prints and grows into the page */
      gsap.set(el.finMedia, { x: 0, y: 0, xPercent: -50, yPercent: -50 });
      const tf = gsap.timeline({ scrollTrigger: { trigger: el.finale, start: "top bottom", end: "top top", scrub: 0.9 } });
      tf.fromTo(el.finale, { backgroundColor: C.grey }, { backgroundColor: C.paper, duration: 0.7 }, 0)
        .fromTo(el.finMedia, { scale: 0.34, rotation: -9, y: vh * 0.2 }, { scale: 1, rotation: 0, y: 0, duration: 1, ease: "power2.out" }, 0)
        .fromTo(el.finImg, { scale: 1.35 }, { scale: 1, duration: 1, ease: "power1.out" }, 0)
        .fromTo(el.finL1, { xPercent: -22, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.85, ease: "power3.out" }, 0.1)
        .fromTo(el.finL2, { xPercent: 22, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.85, ease: "power3.out" }, 0.18)
        .fromTo(el.sideA, { y: vh * 0.5, rotation: -26 }, { y: 0, rotation: -8, duration: 1, ease: "power2.out" }, 0)
        .fromTo(el.sideB, { y: vh * 0.8, rotation: 30 }, { y: 0, rotation: 10, duration: 1, ease: "power2.out" }, 0);
      gsap.timeline({ scrollTrigger: { trigger: el.finale, start: "top top", end: "bottom bottom", scrub: 0.9 } })
        .to(el.finMedia, { y: -vh * 0.06, ease: "none" }, 0)
        .to(el.sideA, { y: -vh * 0.2, ease: "none" }, 0)
        .to(el.sideB, { y: -vh * 0.1, ease: "none" }, 0);
      gsap.from([".fin-copy", ".fin-cta"], {
        y: 30, opacity: 0, duration: 0.9, ease: "power2.out", stagger: 0.1,
        scrollTrigger: { trigger: ".fin-info", start: "top 92%", toggleActions: "play none none reverse" }
      });

      /* gauge + scene index + active nav */
      const gaugeSet = gsap.quickSetter(el.gauge, "scaleY");
      ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => { gaugeSet(self.progress); updateScene(); } });
    });
    updateScene();
  }

  const posOf = (label) => st.start + (master.labels[label] / master.duration()) * (st.end - st.start);
  const finaleTop = () => el.finale.getBoundingClientRect().top + scrollY;
  const bookTop = () => el.booking.getBoundingClientRect().top + scrollY;
  const SCENES = ["Cover", "Orbit", "Canvas", "Studio", "Book"];
  function updateScene() {
    if (!st) return;
    const y = scrollY + 1;
    const s = y >= bookTop() - innerHeight * 0.5 ? 4 : y >= finaleTop() - innerHeight * 0.4 ? 3 : y >= posOf("sets") ? 2 : y >= posOf("orbit") - U * 0.3 ? 1 : 0;
    if (s === scene) return;
    scene = s;
    el.sceneN.textContent = `(${pad(s + 1)})`;
    el.sceneName.textContent = SCENES[s];
    el.navSets.classList.toggle("is-active", s === 2);
    el.navStudio.classList.toggle("is-active", s === 3);
    el.navBook.classList.toggle("is-active", s === 4);
    $(".ui-scene").style.opacity = s === 4 ? "0" : "";
  }

  /* ---------- scene-aware navigation ---------- */
  UI.go = (key, focus) => {
    let y = 0;
    if (key === "sets") y = desk ? posOf("travel") : st.end;
    else if (key === "studio") y = finaleTop();
    else if (key === "book") y = bookTop();
    const dur = clamp(0.8, 2.6, (Math.abs(y - scrollY) / innerHeight) * 0.32);
    gsap.to(window, {
      scrollTo: { y, autoKill: true }, duration: dur, ease: "power3.inOut",
      onComplete: () => { if (focus) $(".g-item")?.focus({ preventScroll: true }); }
    });
  };
  const skip = $(".skip");
  skip.addEventListener("click", (e) => { e.preventDefault(); UI.go("sets", true); });

  /* the grid view hands back a set: scroll to the point where the strip shows it */
  UI.goSet = (i) => {
    const li = el.gItems[i];
    if (!li) return;
    if (!travel) {
      gsap.to(window, { scrollTo: { y: st.end, autoKill: true }, duration: 0.9, ease: "power3.inOut",
        onComplete: () => { el.gView.scrollTo({ left: li.offsetLeft - el.gItems[0].offsetLeft, behavior: "smooth" }); li.focus({ preventScroll: true }); } });
      return;
    }
    const target = clamp(0, travel.dist, li.offsetLeft + li.offsetWidth / 2 - innerWidth / 2);
    const t = travel.start + (target / (travel.dist || 1)) * travel.dur;
    const y = st.start + (t / master.duration()) * (st.end - st.start);
    gsap.to(window, { scrollTo: { y, autoKill: true }, duration: clamp(0.8, 2, Math.abs(y - scrollY) / innerHeight * 0.3), ease: "power3.inOut",
      onComplete: () => li.focus({ preventScroll: true }) });
  };

  /* keyboard: focusing a photo in the contact sheet scrolls the page to the point where it is centred */
  el.track.addEventListener("focusin", (e) => {
    if (!travel) return;
    el.gView.scrollLeft = 0;
    const li = e.target.closest(".g-item");
    if (!li) return;
    const target = clamp(0, travel.dist, li.offsetLeft + li.offsetWidth / 2 - innerWidth / 2);
    const t = travel.start + (target / (travel.dist || 1)) * travel.dur;
    const y = st.start + (t / master.duration()) * (st.end - st.start);
    gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 0.6, ease: "power2.out" });
  });
  /* phones: the sheet is a native swipe row; keep the counter in step */
  el.gView.addEventListener("scroll", () => {
    if (travel) return;
    const step = (el.gItems[0]?.offsetWidth || 1) + 8;
    setGalleryIndex(clamp(0, el.gItems.length - 1, Math.round(el.gView.scrollLeft / step)));
  }, { passive: true });

  /* ---------- rebuild on real resizes, keeping the reader's place ---------- */
  function teardown() {
    ctx && ctx.revert();
    el.items.forEach((it) => { it.style.transform = ""; it.style.opacity = ""; it.style.visibility = ""; it.style.display = ""; });
    gsap.set(el.gImgs, { clearProps: "transform" });
    st = null; scene = -1;
  }
  function rebuild() {
    let restore = null;
    if (st) restore = scrollY < st.end ? { pin: true, f: (scrollY - st.start) / (st.end - st.start) } : { pin: false, d: scrollY - st.end };
    teardown();
    build();
    ScrollTrigger.refresh();
    if (restore) window.scrollTo(0, restore.pin ? st.start + Math.max(0, restore.f) * (st.end - st.start) : st.end + restore.d);
  }
  let lastW = innerWidth, lastH = innerHeight, rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const touch = matchMedia("(hover: none)").matches;
      if (innerWidth !== lastW || (!touch && Math.abs(innerHeight - lastH) > 60)) {
        lastW = innerWidth; lastH = innerHeight;
        rebuild();
      }
    }, 200);
  });
  reduceMQ.addEventListener("change", () => {
    if (reduceMQ.matches) { teardown(); root.classList.remove("motion", "desk"); ScrollTrigger.refresh(); }
    else { root.classList.add("motion"); build(); ScrollTrigger.refresh(); }
  });

  intro();
  pointer();
  build();
  ScrollTrigger.addEventListener("refresh", () => { scene = -1; updateScene(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => rebuild());
  addEventListener("load", () => ScrollTrigger.refresh());
})();
