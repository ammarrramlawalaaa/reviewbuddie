/* ReviewBuddie landing page. No dependencies. */
(function () {
  "use strict";

  /* ---- Links: set these to the live URLs before launch ---- */
  var CONFIG = {
    SIGNUP_URL: "/signup",
    LOGIN_URL: "/login",
    DEMO_URL: "/contact"
  };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 1000px)");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
  var seg = function (p, a, b) { return ease(clamp((p - a) / (b - a), 0, 1)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  window.dataLayer = window.dataLayer || [];
  function track(ev, data) { window.dataLayer.push(Object.assign({ event: ev }, data || {})); }

  // run `fn` (returns a cancel function) while `el` is on screen
  function whileVisible(el, fn, threshold) {
    if (reduce) return;
    var stop = null;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!stop) stop = fn() || function () {}; }
      else if (stop) { stop(); stop = null; }
    }, { threshold: threshold || 0.4 }).observe(el);
  }
  // timeline helper: [[delay, fn], ...], optionally looped; returns cancel
  var PACE = 0.79; // < 1 speeds every demo up
  function timeline(steps, loopAfter) {
    var timers = [], alive = true;
    (function run() {
      steps.forEach(function (s) { timers.push(setTimeout(function () { if (alive) s[1](); }, s[0] * PACE)); });
      if (loopAfter) timers.push(setTimeout(function () { if (alive) run(); }, loopAfter * PACE));
    })();
    return function () { alive = false; timers.forEach(clearTimeout); };
  }

  /* ---------- links + tracking ---------- */
  var LINKS = { signup: CONFIG.SIGNUP_URL, login: CONFIG.LOGIN_URL, demo: CONFIG.DEMO_URL };
  $$("[data-link]").forEach(function (a) { a.href = LINKS[a.getAttribute("data-link")] || "#"; });
  $$("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () { track("cta_click", { id: el.getAttribute("data-track") }); });
  });
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var done = function () { b.textContent = "Copied ✓"; b.classList.add("ok"); setTimeout(function () { b.textContent = "Copy"; b.classList.remove("ok"); }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(b.getAttribute("data-copy")).then(done, done); else done();
    });
  });

  /* ---------- nav ---------- */
  var nav = $("#nav"), burger = $(".nav__burger"), menu = $("#menu");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menu.hidden = !open;
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger.addEventListener("click", function () { setMenu(menu.hidden); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  function fitPhone(phone, box, hf, wf) {
    var w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    phone.style.setProperty("--s", Math.min((h * hf) / 620, (w * wf) / 300).toFixed(3));
  }

  /* ---------- hero "video" ---------- */
  var HERO = [
    { dur: 2550, cap: "Customer scans your QR. Your page opens, no app.", tap: [50, 75], feed: ["QR scanned", "Spin Mop · insert in the box", "qr"] },
    { dur: 2750, cap: "They pick where they bought and watch your setup video.", tap: [50, 83], feed: ["Routed to Amazon", "Setup video watched", "ok"] },
    { dur: 2550, cap: "They rate honestly. Feedback comes to you privately.", tap: [64, 51], feed: ["Private feedback · 4★", "“Easy to assemble”", "ok"] },
    { dur: 2850, cap: "AI helps them put their experience into words.", tap: [80, 89], feed: ["Review drafted", "Edited by the customer", "ai"] },
    { dur: 3200, cap: "They post it on Amazon. The claim lands in your Claim Center.", tap: [50, 95], feed: ["New claim · Warranty", "Approve in one tap", "cash"] }
  ];
  var ICON = { qr: '<span class="ic ic--qr"></span>', ok: '<span class="ic ic--ok"></span>', ai: '<span class="ic ic--ai">✦</span>', cash: '<span class="ic ic--cash">₹</span>' };

  var stage = $("#stage");
  var vsrc = stage.getAttribute("data-video");
  if (vsrc) {
    var v = document.createElement("video");
    v.src = vsrc; v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = !reduce;
    v.setAttribute("aria-label", "ReviewBuddie product demo");
    stage.appendChild(v);
  } else heroPlayer();

  function heroPlayer() {
    var imgs = $$("[data-screens] img", stage), tapdot = $(".tapdot", stage);
    var bar = $(".stage__bar", stage), cap = $("[data-caption]", stage), step = $("[data-step]", stage);
    var feed = $("[data-feed]", stage), pp = $("[data-pp]", stage);
    var phone = $(".stage__phone .phone", stage), phoneBox = $(".stage__phone", stage);
    var i = 0, fed = -1, timers = [], paused = reduce, visible = false;

    HERO.forEach(function (_, k) {
      var b = document.createElement("i");
      b.addEventListener("click", function () { paused = false; go(k); });
      bar.appendChild(b);
    });
    var fit = function () { fitPhone(phone, phoneBox, 1, 1); };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(phoneBox);

    function clear() { timers.forEach(clearTimeout); timers = []; }
    function show(k) {
      imgs.forEach(function (im, n) {
        im.classList.toggle("on", n === k);
        im.classList.toggle("past", n < k);
        if (n === k) im.loading = "eager";
      });
      if (imgs[k + 1]) imgs[k + 1].loading = "eager";
    }
    function pushFeed(f) {
      var max = desktop.matches ? 3 : 1;
      var items = $$(".feed__item:not(.out)", feed);
      if (items.length >= max) {
        var old = items[0];
        old.classList.add("out");
        setTimeout(function () { old.remove(); }, 400);
      }
      var el = document.createElement("div");
      el.className = "feed__item";
      el.innerHTML = ICON[f[2]] + "<div><b>" + f[0] + "</b><small>" + f[1] + "</small></div>";
      feed.appendChild(el);
    }
    function go(k) {
      clear();
      i = k;
      var s = HERO[k];
      show(k);
      stage.classList.toggle("is-paused", paused);
      $$("i", bar).forEach(function (b, n) {
        b.className = n < k ? "done" : "";
        if (n === k) { b.style.setProperty("--dur", s.dur + "ms"); void b.offsetWidth; b.className = paused ? "" : "on"; }
      });
      cap.innerHTML = "<span>" + s.cap + "</span>";
      step.textContent = ("0" + (k + 1)).slice(-2);
      if (fed !== k) {
        if (k === 0) feed.innerHTML = "";
        pushFeed(s.feed);
        fed = k;
      }
      if (paused) return;
      timers.push(setTimeout(function () {
        tapdot.style.left = s.tap[0] + "%"; tapdot.style.top = s.tap[1] + "%";
        tapdot.classList.remove("go"); void tapdot.offsetWidth; tapdot.classList.add("go");
      }, s.dur - 800));
      timers.push(setTimeout(function () { if (visible && !paused) go((i + 1) % HERO.length); }, s.dur));
    }
    pp.addEventListener("click", function () {
      paused = !paused;
      pp.setAttribute("aria-label", paused ? "Play demo" : "Pause demo");
      if (paused) { clear(); stage.classList.add("is-paused"); } else go(i);
      track("hero_demo_toggle", { playing: !paused });
    });
    if (reduce) pp.setAttribute("aria-label", "Play demo");
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !paused) go(i); else clear();
    }, { threshold: 0.3 }).observe(stage);
    show(0);
    cap.innerHTML = "<span>" + HERO[0].cap + "</span>";
  }

  /* ---------- scroll: nav, the box, hero scale ---------- */
  var boxSec = $("#how");
  var cube = $(".cube"), insert = $(".insert"), bxPhone = $(".bx-phone"), bxScreen = $(".bx-phone .phone__screen");
  var bSteps = $$(".box-steps li"), chips = $$(".bx-chip"), bprog = $(".box-progress");
  var fl = { front: $(".fl-front"), back: $(".fl-back"), left: $(".fl-left"), right: $(".fl-right") };

  function boxFrame(p) {
    var ry = lerp(-40, -18, p);
    cube.style.setProperty("--ry", ry + "deg");
    fl.front.style.setProperty("--a1", lerp(-90, -215, seg(p, 0.04, 0.2)) + "deg");
    fl.back.style.setProperty("--a2", lerp(90, 215, seg(p, 0.07, 0.23)) + "deg");
    fl.left.style.setProperty("--a3", lerp(0, -195, seg(p, 0.13, 0.29)) + "deg");
    fl.right.style.setProperty("--a4", lerp(0, 195, seg(p, 0.15, 0.31)) + "deg");
    var r = seg(p, 0.28, 0.48);
    insert.style.setProperty("--iy", lerp(40, -150, r) + "px");
    insert.style.setProperty("--iry", lerp(-ry - 30, -ry, r) + "deg");
    insert.style.setProperty("--is", lerp(1, 1.12, r));
    insert.classList.toggle("glow", p > 0.62 && p < 0.74);
    var ph = seg(p, 0.46, 0.62), big = desktop.matches;
    bxPhone.style.opacity = ph;
    bxPhone.style.transform = "translate(" + lerp(big ? 260 : 150, big ? 170 : 100, ph) + "px," + lerp(240, big ? 10 : 34, ph) + "px) rotate(" + lerp(16, -6, ph) + "deg) scale(" + (big ? 1.2 : 0.7) + ")";
    bxScreen.style.setProperty("--sl", (200 + Math.sin(seg(p, 0.58, 0.7) * Math.PI) * 150) + "px");
    bxScreen.style.setProperty("--to", seg(p, 0.69, 0.76));
    chips[0].classList.toggle("on", p > 0.76);
    chips[1].classList.toggle("on", p > 0.82);
    chips[2].classList.toggle("on", p > 0.88);
    var st = p < 0.3 ? 0 : p < 0.72 ? 1 : 2;
    bSteps.forEach(function (li, k) { li.classList.toggle("on", reduce || k === st); });
    bprog.style.setProperty("--bp", p);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight;
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
      if (reduce) return;
      var r = boxSec.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) boxFrame(clamp(-r.top / (r.height - vh), 0, 1));
      if (desktop.matches) {
        var sr = stage.getBoundingClientRect();
        stage.style.setProperty("--ss", lerp(0.92, 1, clamp(1 - (sr.top - vh * 0.15) / (vh * 0.7), 0, 1)).toFixed(4));
      } else stage.style.setProperty("--ss", 1);
    });
  }
  boxFrame(reduce ? 1 : 0);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- reveal + counters ---------- */
  var groups = new Map();
  $$(".reveal").forEach(function (el) {
    var k = groups.get(el.parentNode) || 0;
    groups.set(el.parentNode, k + 1);
    el.style.setProperty("--rd", Math.min(k, 6) * 0.08 + "s");
  });
  function countUp(el) {
    var to = +el.getAttribute("data-count"), fmt = el.hasAttribute("data-fmt");
    var out = function (n) { el.textContent = fmt ? n.toLocaleString("en-US") : n; };
    if (reduce) return out(to);
    var t0 = performance.now(), d = 1400;
    (function f(t) {
      var k = clamp((t - t0) / d, 0, 1);
      out(Math.round(to * ease(k)));
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }
  var rio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$("[data-count]", e.target).forEach(countUp);
      var roi = $("[data-roi]", e.target);
      if (roi) { roi.setAttribute("data-count", roi.textContent); countUp(roi); }
      rio.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach(function (el) { rio.observe(el); });

  /* ---------- 01 core flow: one screen plays each step, the list lights up in sync ---------- */
  var cf = $("[data-cf]");
  if (cf) (function () {
    var tabs = $$(".cf-step", cf), scenes = $$(".cf-scene", cf), url = $("[data-cf-url]", cf);
    var navs = $$(".cf-nav[data-n]", cf), main = $(".cf-main", cf), cursor = $(".cf-cursor", cf);
    var typed = $(".cf-typed", cf), launch = $(".cf-launch", cf), copy = $(".cf-link b", cf);
    var base = scenes.map(function (s) { return s.className; });
    $(".cf-card", cf).setAttribute("data-cur", "card");
    var setText = function (el, t) { return function () { el.textContent = t; }; };
    var SC = [
      { dur: 5900, url: "products/new", nav: 1, steps: [[300, "cur:input"], [900, "t1"], [1000, "type"], [2200, "t2"], [2800, "t3"], [3900, "t4"]] },
      { dur: 6400, url: "promotions/new", nav: 2, steps: [[300, "t1"], [1500, "cur:card"], [2200, "t2"], [2900, "t3"], [3800, "t4"], [4500, "t5"], [5100, "t6"]] },
      { dur: 5600, url: "campaigns/new", nav: 3, steps: [[300, "t1"], [1300, "t2"], [1700, "cur:launch"], [2400, "t3"], [2650, "t4"], [2650, setText(launch, "Campaign live ✓")], [3000, "t5"]] },
      { dur: 4700, url: "campaigns/spin-mop", nav: 3, steps: [[300, "cur:copy"], [1000, "t1"], [1000, setText(copy, "Copied ✓")], [1500, "t2"], [2200, "t3"], [2900, "t4"]] }
    ];
    var cur = 0, timers = [], visible = false;
    var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };
    function clear() { timers.forEach(clearTimeout); timers = []; }

    function cursorTo(name, scene) {
      var t = $('[data-cur="' + name + '"]', scene);
      if (!t) return;
      var m = main.getBoundingClientRect(), r = t.getBoundingClientRect();
      cursor.style.left = (r.left - m.left + r.width * 0.62) + "px";
      cursor.style.top = (r.top - m.top + r.height * 0.55) + "px";
      later(function () { cursor.classList.remove("click"); void cursor.offsetWidth; cursor.classList.add("click"); }, 500);
    }
    function type(el) {
      var full = el.getAttribute("data-type"), k = 0;
      el.classList.add("typing");
      (function step() {
        el.textContent = full.slice(0, ++k);
        if (k < full.length) later(step, 26 + Math.random() * 18);
        else later(function () { el.classList.remove("typing"); }, 300);
      })();
    }
    function run(action, scene) {
      if (typeof action === "function") return action();
      if (action === "type") return reduce ? (typed.textContent = typed.getAttribute("data-type")) : type(typed);
      if (action.indexOf("cur:") === 0) return reduce || cursorTo(action.slice(4), scene);
      scene.classList.add(action);
    }

    function go(k) {
      clear();
      cur = k;
      var sc = SC[k], scene = scenes[k], dur = sc.dur * PACE;
      tabs.forEach(function (t, n) {
        var on = n === k, bar = $(".cf-step__bar", t);
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle("done", n < k);
        bar.classList.remove("run");
        if (on && !reduce) { t.style.setProperty("--dur", dur + "ms"); void bar.offsetWidth; bar.classList.add("run"); }
      });
      scenes.forEach(function (s, n) { if (n === k) s.className = base[n] + " on"; else s.classList.remove("on"); });
      void scene.offsetWidth;
      typed.textContent = ""; launch.textContent = "Launch campaign"; copy.textContent = "Copy";
      url.textContent = sc.url;
      url.classList.remove("flash"); void url.offsetWidth; url.classList.add("flash");
      navs.forEach(function (n) { n.classList.toggle("on", +n.getAttribute("data-n") === sc.nav); });
      cursor.style.left = "78%"; cursor.style.top = "112%";
      if (reduce) { sc.steps.forEach(function (s) { run(s[1], scene); }); return; }
      sc.steps.forEach(function (s) { later(function () { run(s[1], scene); }, s[0] * PACE); });
      later(function () { if (visible) go((cur + 1) % SC.length); }, dur);
    }

    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { go(k); track("core_flow_step", { step: k + 1 }); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        go((cur + d + tabs.length) % tabs.length);
        tabs[cur].focus();
      });
    });
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) go(cur); else clear();
    }, { threshold: 0.35 }).observe(cf);
    go(0);
    clear();
  })();

  /* ---------- 02 spotlight carousel: one screen centre stage, controls on the sides ---------- */
  var film = $("[data-film]");
  if (film) (function () {
    var frames = $$(".film__f", film), dots = $$(".film__dots button", film), pp = $(".film__pp", film);
    var n = frames.length, cur = 0, playing = !reduce, visible = false, timers = [], DUR = 3100;
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function layout() {
      var gap = parseFloat(getComputedStyle(film).getPropertyValue("--gap")) || 150, half = Math.floor(n / 2);
      frames.forEach(function (f, i) {
        var o = ((i - cur + n + half) % n) - half, a = Math.abs(o);
        f.style.transform = "translateX(" + o * gap + "px) scale(" + (1 - a * 0.14) + ")";
        f.style.opacity = a === 0 ? 1 : a === 1 ? 0.45 : 0.08;
        f.style.zIndex = 10 - a;
        f.classList.toggle("on", a === 0);
        f.setAttribute("aria-hidden", a !== 0);
      });
    }
    function go(k) {
      clear();
      cur = (k + n) % n;
      layout();
      dots.forEach(function (d, i) {
        var bar = $("i", d), on = i === cur;
        d.setAttribute("aria-selected", on);
        bar.classList.remove("run");
        if (on && playing) { d.style.setProperty("--dur", DUR + "ms"); void bar.offsetWidth; bar.classList.add("run"); }
      });
      if (!playing || !visible) return;
      var f = frames[cur], tap = $(".film__tap", f), xy = f.getAttribute("data-tap").split(",");
      timers.push(setTimeout(function () {
        tap.style.left = xy[0] + "%"; tap.style.top = xy[1] + "%";
        tap.classList.remove("go"); void tap.offsetWidth; tap.classList.add("go");
      }, DUR - 950));
      timers.push(setTimeout(function () { go(cur + 1); }, DUR));
    }
    function setPlaying(on) {
      playing = on;
      pp.classList.toggle("paused", !on);
      pp.setAttribute("aria-label", on ? "Pause" : "Play");
      go(cur);
    }
    $(".film__nav--prev", film).addEventListener("click", function () { go(cur - 1); });
    $(".film__nav--next", film).addEventListener("click", function () { go(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); track("journey_step", { step: i + 1 }); }); });
    frames.forEach(function (f, i) { f.addEventListener("click", function () { if (i !== cur) go(i); }); });
    pp.addEventListener("click", function () { setPlaying(!playing); });
    if (reduce) pp.classList.add("paused");
    var x0 = null;
    $(".film__stage", film).addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    $(".film__stage", film).addEventListener("pointerup", function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
    });
    window.addEventListener("resize", layout);
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) go(cur); else clear();
    }, { threshold: 0.4 }).observe(film);
    layout();
  })();

  /* ---------- 03 3D funnel: customers pour in, leak through cracks, fixes seal them ---------- */
  var leak = $("[data-leak]");
  if (leak) (function () {
    var rows = $$("ol li", leak), fixes = $$(".fix", leak), total = $("[data-total]", leak), gain = $("[data-gain]", leak);
    var won = $("[data-won]", leak), reset = $(".leak__reset", leak), cv = $(".leak__cv", leak), ctx = cv.getContext("2d");
    var SCANS = 412, NAMES = ["QR scans", "Claim started", "Claim completed", "Review written", "Review posted"];
    var RATE = { 1: [0.62, 0.84], 2: [0.78, 0.94], 3: [0.86, 0.86], 4: [0.68, 0.88] };
    var on = { 1: false, 2: false, 4: false }, shown = [SCANS, 0, 0, 0, 0], label = [SCANS, 0, 0, 0, 0], started = false;
    var seal = { 1: 0, 2: 0, 4: 0 }; // 0 = open crack, 1 = sealed (animated)
    function counts() { var c = [SCANS]; for (var k = 1; k <= 4; k++) c[k] = Math.round(c[k - 1] * RATE[k][on[k] ? 1 : 0]); return c; }
    var BASE = (function () { var c = [SCANS]; for (var k = 1; k <= 4; k++) c[k] = Math.round(c[k - 1] * RATE[k][0]); return c[4]; })();
    function tween(get, set, from, to) {
      if (reduce || from === to) return set(to);
      var t0 = performance.now();
      (function f(t) { var p = clamp((t - t0) / 800, 0, 1); set(Math.round(from + (to - from) * ease(p))); if (p < 1) requestAnimationFrame(f); })(t0);
    }
    function render() {
      var c = counts();
      rows.forEach(function (li, k) {
        $("b", li).textContent = c[k];
        var em = $("em", li); if (em) em.textContent = k in on ? (on[k] ? " (fixed)" : " (leaking)") : "";
        (function (k) { tween(null, function (v) { label[k] = v; }, shown[k], c[k]); })(k);
      });
      tween(null, function (v) { total.textContent = v; }, shown[4], c[4]);
      var g = c[4] - BASE, n = fixes.filter(function (f) { return on[f.getAttribute("data-fix")]; }).length;
      gain.textContent = g > 0 ? "+" + g + " reviews / month" : "No fixes yet";
      gain.classList.toggle("up", g > 0);
      gain.classList.remove("pop"); void gain.offsetWidth; if (g > 0) gain.classList.add("pop");
      won.textContent = g;
      leak.classList.toggle("all", n === fixes.length);
      reset.hidden = n === 0;
      shown = c;
    }

    /* geometry */
    var W, H, dpr, cx, y0, yb, ys, rT, rB, lx, rimY = [];
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var narrow = W < 520;
      cx = W * (narrow ? 0.34 : 0.4); rT = Math.min(W * (narrow ? 0.27 : 0.27), 200); rB = rT * 0.16;
      y0 = H * 0.15; yb = H * 0.76; ys = H * 0.86; lx = cx + rT + (narrow ? 14 : 34);
      rimY = [0, 1, 2, 3, 4].map(function (k) { return y0 + (yb - y0) * (k / 4); });
    }
    function R(y) { var t = clamp((y - y0) / (yb - y0), 0, 1); return rB + (rT - rB) * Math.pow(1 - t, 1.5); }
    var D = 0.24; // ellipse depth ratio (perspective)

    /* particles */
    var P = [], spawnAcc = 0, last = 0, raf = null, stars = 0, pulse = 0;
    function spawn() {
      P.push({ y: y0 - 4, th: Math.random() * Math.PI * 2, rho: Math.sqrt(Math.random()) * 0.82, k: 1, st: 0, vx: 0, vy: 0, x: 0, a: 1, sp: 0.9 + Math.random() * 0.3 });
    }
    function step(dt) {
      spawnAcc += dt * (W < 520 ? 18 : 26);
      while (spawnAcc > 1) { spawn(); spawnAcc--; }
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i];
        if (p.st === 0) {                       // inside the funnel
          var t = (p.y - y0) / (yb - y0);
          p.y += dt * (52 + 120 * t) * p.sp;
          p.th += dt * (0.6 + 1.6 * t);
          while (p.k <= 4 && p.y >= rimY[p.k]) {
            var k = p.k, rate = RATE[k][on[k] ? 1 : 0];
            if (Math.random() > rate) {        // leaks out through the crack on the front-right
              p.st = 1; var r = R(rimY[k]);
              p.x = cx + r * 0.94; p.y = rimY[k] + r * D * 0.35;
              p.vx = 40 + Math.random() * 70; p.vy = -20 - Math.random() * 30; p.c = k === 3 ? "#9AA6B2" : "#EF6C4D";
              break;
            }
            p.k++;
          }
          if (p.st === 0 && p.y >= yb) { p.st = 2; p.x = cx + (Math.random() - 0.5) * rB * 0.8; p.vy = 90; }
        } else if (p.st === 1) {               // leaking: arc out and fade
          p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a -= dt * 0.9;
          if (p.a <= 0 || p.y > H + 10) P.splice(i, 1);
        } else {                               // falls out of the spout as a review star
          p.vy += 300 * dt; p.y += p.vy * dt;
          if (p.y > H * 0.95) { P.splice(i, 1); stars++; pulse = 1; }
        }
      }
      [1, 2, 4].forEach(function (k) { seal[k] += ((on[k] ? 1 : 0) - seal[k]) * Math.min(1, dt * 6); });
      pulse = Math.max(0, pulse - dt * 3);
    }

    function ell(y, r, a0, a1) { ctx.beginPath(); ctx.ellipse(cx, y, r, r * D, 0, a0, a1); }
    function draw(time) {
      ctx.clearRect(0, 0, W, H);
      // body (glass)
      var g = ctx.createLinearGradient(cx - rT, 0, cx + rT, 0);
      g.addColorStop(0, "rgba(0,150,219,.20)"); g.addColorStop(0.45, "rgba(56,189,248,.07)"); g.addColorStop(1, "rgba(0,119,184,.24)");
      ctx.beginPath();
      for (var y = y0; y <= yb; y += 3) ctx.lineTo(cx - R(y), y);
      ctx.lineTo(cx - rB, ys); ctx.lineTo(cx + rB, ys);
      for (y = yb; y >= y0; y -= 3) ctx.lineTo(cx + R(y), y);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "rgba(0,119,184,.35)"; ctx.lineWidth = 1.2; ctx.stroke();
      // back halves of the rims
      rimY.forEach(function (ry, k) { ell(ry, R(ry), Math.PI, Math.PI * 2); ctx.strokeStyle = k ? "rgba(0,119,184,.18)" : "rgba(0,119,184,.4)"; ctx.lineWidth = k ? 1 : 1.6; ctx.stroke(); });
      // top opening
      ell(y0, rT, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,150,219,.08)"; ctx.fill();
      // particles inside
      P.forEach(function (p) {
        if (p.st !== 0) return;
        var r = R(p.y) * p.rho, px = cx + r * Math.cos(p.th), py = p.y + r * D * Math.sin(p.th);
        ctx.globalAlpha = Math.sin(p.th) > 0 ? 1 : 0.55;
        ctx.fillStyle = "#0096DB"; ctx.beginPath(); ctx.arc(px, py, W < 520 ? 2.4 : 3, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // front halves of the rims
      rimY.forEach(function (ry, k) { ell(ry, R(ry), 0, Math.PI); ctx.strokeStyle = k ? "rgba(0,119,184,.45)" : "rgba(0,119,184,.75)"; ctx.lineWidth = k ? 1.3 : 2; ctx.stroke(); });
      // cracks / seals
      [1, 2, 4].forEach(function (k) {
        var ry = rimY[k], r = R(ry), s = seal[k];
        var a0 = 0.05, a1 = 0.55;
        ell(ry, r, a0, a1);
        ctx.lineCap = "round";
        if (s < 0.98) {
          var glow = 0.55 + 0.45 * Math.sin(time / 260 + k);
          ctx.strokeStyle = "rgba(239,108,77," + (0.25 * glow * (1 - s)) + ")"; ctx.lineWidth = 12; ctx.stroke();
          ell(ry, r, a0, a1); ctx.strokeStyle = "rgba(239,108,77," + (1 - s) + ")"; ctx.lineWidth = 3.5; ctx.stroke();
        }
        if (s > 0.02) { ell(ry, r, a0, a0 + (a1 - a0) * s); ctx.strokeStyle = "rgba(31,184,102," + s + ")"; ctx.lineWidth = 4.5; ctx.stroke(); }
        ctx.lineCap = "butt";
      });
      // leaking + star particles
      P.forEach(function (p) {
        if (p.st === 1) { ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, W < 520 ? 2.4 : 3, 0, 7); ctx.fill(); }
        if (p.st === 2) { ctx.globalAlpha = 1; ctx.fillStyle = "#F5A524"; ctx.font = (W < 520 ? 13 : 16) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText("★", p.x, p.y); }
      });
      ctx.globalAlpha = 1;
      // tray
      var ty = H * 0.95;
      ctx.fillStyle = "rgba(245,165,36," + (0.18 + pulse * 0.3) + ")";
      ctx.beginPath(); ctx.ellipse(cx, ty, rT * 0.55 + pulse * 6, 9 + pulse * 2, 0, 0, 7); ctx.fill();
      // labels
      var narrow = W < 520;
      rimY.forEach(function (ry, k) {
        var r = R(ry), ex = cx + r, ey = ry;
        ctx.strokeStyle = "rgba(92,107,120,.35)"; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(ex + 4, ey); ctx.lineTo(lx - 6, ey); ctx.stroke(); ctx.setLineDash([]);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#5C6B78"; ctx.font = "500 " + (narrow ? 11 : 13) + "px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(NAMES[k], lx, ey - 4);
        ctx.fillStyle = "#16232E"; ctx.font = "800 " + (narrow ? 15 : 19) + "px Sora, sans-serif";
        ctx.fillText(label[k], lx, ey + (narrow ? 13 : 17));
        if (k in on) {
          var c = counts(), drop = Math.round((1 - c[k] / c[k - 1]) * 100);
          var txt = on[k] ? "✓ −" + drop + "%" : "−" + drop + "%";
          var bx = lx + ctx.measureText(String(label[k])).width + 8;
          ctx.font = "700 " + (narrow ? 10 : 11.5) + "px 'Plus Jakarta Sans', sans-serif";
          var tw = ctx.measureText(txt).width + 12, bh = narrow ? 16 : 19, by = ey + (narrow ? 2 : 3);
          ctx.fillStyle = on[k] ? "#E3F6EA" : "#FDECE7";
          ctx.beginPath(); ctx.roundRect(bx, by, tw, bh, bh / 2); ctx.fill();
          ctx.fillStyle = on[k] ? "#166534" : "#C2410C"; ctx.fillText(txt, bx + 6, by + bh - (narrow ? 4.5 : 5.5));
        }
      });
    }
    function loop(t) {
      var dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      step(dt); draw(t);
      raf = requestAnimationFrame(loop);
    }
    var warmed = false;
    function play() {
      if (raf || reduce) return;
      if (!warmed) { warmed = true; for (var i = 0; i < 240; i++) step(1 / 60); stars = 0; }
      last = 0; raf = requestAnimationFrame(loop);
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    fixes.forEach(function (f) {
      f.addEventListener("click", function () {
        var k = f.getAttribute("data-fix");
        on[k] = !on[k];
        f.setAttribute("aria-pressed", on[k]);
        leak.classList.add("touched");
        render();
        if (reduce) draw(0);
        track("leak_fix", { fix: k, on: on[k] });
      });
    });
    reset.addEventListener("click", function () {
      Object.keys(on).forEach(function (k) { on[k] = false; });
      fixes.forEach(function (f) { f.setAttribute("aria-pressed", "false"); });
      render(); if (reduce) draw(0);
    });
    size();
    window.addEventListener("resize", function () { size(); if (!raf) draw(0); });
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        if (!started) { started = true; render(); }
        if (reduce) { setTimeout(function () { draw(0); }, 50); } else play();
      } else stop();
    }, { threshold: 0.2 }).observe(leak);
  })();

  /* ---------- 04 coded scenes ---------- */
  $$("[data-scene]").forEach(function (sc) {
    var kind = sc.getAttribute("data-scene");
    if (kind === "claims") whileVisible(sc, function () {
      var cards = $$(".cc__card", sc), btn = $(".cc__btn", sc);
      var reset = function () { cards.forEach(function (c) { c.classList.remove("sel", "fly"); }); btn.classList.remove("show", "press"); };
      reset();
      return timeline([
        [600, function () { cards[0].classList.add("sel"); }],
        [1000, function () { cards[1].classList.add("sel"); }],
        [1400, function () { cards[2].classList.add("sel"); btn.classList.add("show"); }],
        [2400, function () { btn.classList.add("press"); }],
        [2700, function () { cards[0].classList.add("fly"); }],
        [2850, function () { cards[1].classList.add("fly"); }],
        [3000, function () { cards[2].classList.add("fly"); btn.classList.remove("show"); }],
        [5600, reset]
      ], 6200);
    });
    if (kind === "customers") whileVisible(sc, function () {
      var rows = $$(".cu__row", sc), bar = $(".cu__bar", sc), btn = $(".cu__btn", sc);
      var reset = function () { rows.forEach(function (r) { r.classList.remove("named"); }); bar.classList.remove("show"); btn.classList.remove("pulse"); };
      reset();
      return timeline([
        [700, function () { rows[0].classList.add("named"); }],
        [1300, function () { rows[1].classList.add("named"); }],
        [1900, function () { rows[2].classList.add("named"); }],
        [2600, function () { bar.classList.add("show"); }],
        [3600, function () { btn.classList.add("pulse"); }],
        [5800, reset]
      ], 6400);
    });
    if (kind === "support") whileVisible(sc, function () {
      var tk = $(".tk", sc);
      var reset = function () { tk.classList.remove("s1", "s2", "s3"); };
      reset();
      return timeline([
        [500, function () { tk.classList.add("s1"); }],
        [1800, function () { tk.classList.add("s2"); }],
        [3400, function () { tk.classList.add("s3"); }],
        [6000, reset]
      ], 6600);
    });
  });

  /* ---------- 05 Brand Hub builder + Ad page demo ---------- */
  var hub = $("[data-hub]");
  if (hub) {
    $$("input[data-sec]", hub).forEach(function (cb) {
      var sec = $('.hub [data-sec="' + cb.getAttribute("data-sec") + '"]', hub);
      var sync = function () { sec.classList.toggle("off", !cb.checked); };
      cb.addEventListener("change", function () { sync(); track("hub_toggle", { section: cb.getAttribute("data-sec"), on: cb.checked }); });
      sync();
    });
  }
  var ad = $("[data-ad]");
  if (ad) {
    var unlock = $("[data-unlock]", ad), code = $(".ad__code", ad), timer = $("[data-timer]", ad), viewing = $("[data-viewing]", ad);
    var coupon = $(".ad__offer--coupon", ad), cash = $(".ad__offer--cash", ad);
    unlock.addEventListener("click", function () {
      code.hidden = false; unlock.textContent = "Coupon unlocked ✓"; unlock.classList.add("done");
      track("ad_demo_unlock");
    });
    $$(".seg button", ad).forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".seg button", ad).forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
        var isCoupon = b.getAttribute("data-offer") === "coupon";
        coupon.hidden = !isCoupon; cash.hidden = isCoupon;
      });
    });
    var secs = 14 * 60 + 59, views = 37;
    whileVisible(ad, function () {
      var t = setInterval(function () {
        secs = secs > 0 ? secs - 1 : 14 * 60 + 59;
        timer.textContent = ("0" + Math.floor(secs / 60)).slice(-2) + ":" + ("0" + (secs % 60)).slice(-2);
        if (secs % 7 === 0) { views = clamp(views + (Math.random() > 0.5 ? 1 : -1), 28, 46); viewing.textContent = views + " viewing now"; }
      }, 1000);
      return function () { clearInterval(t); };
    }, 0.2);
  }

  /* ---------- 06 board ---------- */
  var board = $("[data-board]");
  if (board) whileVisible(board, function () {
    var st = $$(".st", board), bell = $(".bell", board), sop = $$(".sop li[data-step]", board), count = $(".board__head span", board);
    var set = function (el, s, label) { el.setAttribute("data-st", s); el.textContent = label; };
    var reset = function () {
      set(st[0], "working", "Working on it"); set(st[1], "not", "Not started"); set(st[2], "stuck", "Stuck"); set(st[3], "working", "Working on it");
      bell.classList.remove("ping"); $("em", bell).textContent = "0";
      sop.forEach(function (li) { li.classList.remove("done"); });
      count.textContent = "To-Do · 4 tasks";
    };
    reset();
    return timeline([
      [900, function () { set(st[1], "working", "Working on it"); }],
      [1800, function () { set(st[3], "done", "Done"); sop[0].classList.add("done"); count.textContent = "To-Do · 3 tasks"; }],
      [2900, function () { set(st[2], "overdue", "Overdue"); $("em", bell).textContent = "1"; bell.classList.add("ping"); }],
      [4200, function () { set(st[0], "done", "Done"); count.textContent = "To-Do · 2 tasks"; }],
      [5400, function () { set(st[2], "done", "Done"); sop[1].classList.add("done"); count.textContent = "To-Do · 1 task"; }],
      [8200, reset]
    ], 8800);
  });

  /* ---------- 07 partner calculator ---------- */
  var partner = $("[data-partner]");
  if (partner) {
    var pin = $("[data-in]", partner), pout = $("[data-out]", partner), plan = 79;
    var month = $("[data-month]", partner), year = $("[data-year]", partner), rate = $("[data-rate]", partner);
    var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    function calc() {
      var n = +pin.value, r = n > 100 ? 0.30 : n > 10 ? 0.25 : 0.20;
      pout.textContent = n;
      pin.style.setProperty("--fill", ((n - pin.min) / (pin.max - pin.min)) * 100 + "%");
      var m = Math.round(n * plan * r);
      month.textContent = money(m);
      year.textContent = money(m * 12);
      rate.textContent = Math.round(r * 100) + "%";
    }
    pin.addEventListener("input", calc);
    $$("[data-plan]", partner).forEach(function (b) {
      b.addEventListener("click", function () {
        plan = +b.getAttribute("data-plan");
        $$("[data-plan]", partner).forEach(function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); });
        calc();
      });
    });
    calc();
  }

  /* ---------- testimonials: slow auto-scroll on desktop ---------- */
  var rail = $(".quotes__rail");
  if (rail && !reduce && desktop.matches) {
    var origCount = $$(".q", rail).length;
    $$(".q", rail).forEach(function (q) { var c = q.cloneNode(true); c.setAttribute("aria-hidden", "true"); rail.appendChild(c); });
    var period = rail.children[origCount].offsetLeft - rail.children[0].offsetLeft;
    var hold = false, railOn = false, x = 0;
    rail.addEventListener("mouseenter", function () { hold = true; });
    rail.addEventListener("mouseleave", function () { hold = false; });
    rail.addEventListener("focusin", function () { hold = true; });
    rail.addEventListener("focusout", function () { hold = false; });
    new IntersectionObserver(function (es) { railOn = es[0].isIntersecting; }).observe(rail);
    (function tick() {
      if (desktop.matches) {
        rail.classList.add("auto");
        if (railOn && !hold) {
          x += 0.5;
          if (x >= period) x -= period;
          rail.scrollLeft = x;
        }
      } else rail.classList.remove("auto");
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- sticky mobile CTA ---------- */
  var sticky = $("#sticky"), heroCta = $(".hero__cta"), finalSec = $("#final");
  var heroOut = false, finalIn = false, howIn = false;
  function syncSticky() {
    var on = heroOut && !finalIn && !howIn;
    sticky.classList.toggle("on", on);
    sticky.setAttribute("aria-hidden", !on);
    $$("a", sticky).forEach(function (b) { b.tabIndex = on ? 0 : -1; });
  }
  new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; syncSticky(); }).observe(heroCta);
  new IntersectionObserver(function (es) { finalIn = es[0].isIntersecting; syncSticky(); }).observe(finalSec);
  new IntersectionObserver(function (es) { howIn = es[0].isIntersecting; syncSticky(); }).observe(boxSec);

  $("#yr").textContent = new Date().getFullYear();
})();
