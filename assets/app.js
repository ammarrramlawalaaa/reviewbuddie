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

  /* ---------- links + tracking ---------- */
  var LINKS = { signup: CONFIG.SIGNUP_URL, login: CONFIG.LOGIN_URL, demo: CONFIG.DEMO_URL };
  $$("[data-link]").forEach(function (a) { a.href = LINKS[a.getAttribute("data-link")] || "#"; });
  $$("[data-track]").forEach(function (el) {
    el.addEventListener("click", function () { track("cta_click", { id: el.getAttribute("data-track") }); });
  });

  /* ---------- nav ---------- */
  var nav = $("#nav"), burger = $(".nav__burger"), menu = $("#menu");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
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
    { dur: 3000, cap: "Customer scans your QR. Your page opens, no app.", tap: [50, 75], feed: ["QR scanned", "Spin Mop · insert in the box", "qr"] },
    { dur: 3300, cap: "They pick where they bought and watch your setup video.", tap: [50, 83], feed: ["Routed to Amazon", "Setup video watched", "ok"] },
    { dur: 3000, cap: "They rate honestly. Feedback comes to you privately.", tap: [64, 51], feed: ["Private feedback · 4★", "“Easy to assemble”", "ok"] },
    { dur: 3400, cap: "AI helps them put their experience into words.", tap: [80, 89], feed: ["Review drafted", "Edited by the customer", "ai"] },
    { dur: 3800, cap: "They post it on Amazon. The claim lands in your Claim Center.", tap: [50, 95], feed: ["New claim · Warranty", "Approve in one tap", "cash"] }
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
    var i = 0, timers = [], paused = reduce, visible = false;

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
      if (k === 0) feed.innerHTML = "";
      pushFeed(s.feed);
      if (paused) return;
      timers.push(setTimeout(function () {
        tapdot.style.left = s.tap[0] + "%"; tapdot.style.top = s.tap[1] + "%";
        tapdot.classList.remove("go"); void tapdot.offsetWidth; tapdot.classList.add("go");
      }, s.dur - 950));
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

  /* ---------- feature groups: real screens + hotspots ---------- */
  var STEP = 1500, LEAD = 700, TAIL = 2200, ZOOM = 2.3;

  function buildPanel(fig) {
    var kind = fig.getAttribute("data-kind"), src = fig.getAttribute("data-src"), alt = fig.getAttribute("data-alt") || "";
    var spots = JSON.parse(fig.getAttribute("data-spots") || "[]");
    var layer;
    if (kind === "desk") {
      fig.innerHTML = '<div class="win"><div class="win__top"><i></i><i></i><i></i><span>app.reviewbuddie.com/' + (fig.getAttribute("data-url") || "") +
        '</span></div><div class="win__view"><div class="cv"><img alt="" width="1600" height="1000" loading="lazy" decoding="async"></div><span class="cursor" aria-hidden="true"></span><div class="win__cap" aria-hidden="true"></div></div></div>';
      layer = $(".cv", fig);
    } else {
      fig.innerHTML = '<div class="phone"><div class="phone__screen"><img alt="" width="540" height="1169" loading="lazy" decoding="async"></div><div class="spots"></div></div>';
      layer = $(".spots", fig);
    }
    var img = $("img", fig);
    img.src = src; img.alt = alt;
    fig._spots = spots.map(function (s) {
      var el = document.createElement("div");
      el.className = "spot" + (s[0] > 58 ? " l" : "") + (s[1] < 14 ? " b" : "") + (s[3] ? " warn" : "");
      el.style.left = s[0] + "%"; el.style.top = s[1] + "%";
      el.innerHTML = '<span class="spot__ring"></span><span class="spot__chip">' + s[2] + "</span>";
      el.setAttribute("aria-hidden", "true");
      layer.appendChild(el);
      return { el: el, x: s[0], y: s[1], text: s[2], warn: !!s[3] };
    });
    fig._kind = kind;
    fig._dur = LEAD + fig._spots.length * STEP + TAIL;
  }

  // desk screens: fit on desktop; on phones, zoom in and pan the "camera" to each hotspot
  function frame(fig, k) {
    if (fig._kind !== "desk") { fitPhone($(".phone", fig), fig, 0.9, 0.86); return; }
    var view = $(".win__view", fig), cv = $(".cv", fig);
    var vw = view.clientWidth, vh = view.clientHeight;
    if (!vw) return;
    var big = desktop.matches || k == null || reduce;
    var w = big ? vw : vw * ZOOM, h = w * 0.625, left = 0, top = 0;
    if (big) { top = desktop.matches ? 0 : (vh - h) / 2; }
    else {
      var s = fig._spots[k];
      left = clamp(vw / 2 - (s.x / 100) * w, vw - w, 0);
      top = clamp(vh / 2 - (s.y / 100) * h, Math.min(0, vh - h), 0);
    }
    cv.style.width = w + "px"; cv.style.left = left + "px"; cv.style.top = top + "px";
    fig._cv = { w: w, h: h, left: left, top: top };
  }

  function moveCursor(fig, k) {
    var c = $(".cursor", fig);
    if (!c || !desktop.matches || !fig._cv) return;
    var s = fig._spots[k];
    c.style.left = fig._cv.left + (s.x / 100) * fig._cv.w + "px";
    c.style.top = fig._cv.top + (s.y / 100) * fig._cv.h + "px";
    setTimeout(function () { c.classList.remove("click"); void c.offsetWidth; c.classList.add("click"); }, 820);
  }

  function Group(fx) {
    var tabs = $$(".fx__tab", fx), panels = $$(".fx__panel", fx);
    var cur = 0, auto = !reduce, visible = false, timers = [];
    panels.forEach(buildPanel);
    if (panels.some(function (p) { return p.getAttribute("data-kind") === "phone"; })) $(".fx__stage", fx).classList.add("fx__stage--phone");
    tabs.forEach(function (t, k) {
      var id = fx.closest("section").id + "-" + k;
      t.id = id + "-tab"; panels[k].id = id;
      t.setAttribute("aria-controls", id); panels[k].setAttribute("aria-labelledby", id + "-tab");
      t.tabIndex = k === 0 ? 0 : -1;
      t.addEventListener("click", function () { auto = false; select(k); track("feature_tab", { tab: id }); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault(); auto = false;
        select((cur + d + tabs.length) % tabs.length); tabs[cur].focus();
      });
    });

    function clear() { timers.forEach(clearTimeout); timers = []; }
    function play() {
      clear();
      var fig = panels[cur];
      fig._spots.forEach(function (s) { s.el.classList.remove("on"); });
      var wc = $(".win__cap", fig);
      if (wc) wc.classList.remove("on");
      frame(fig, null);
      var c = $(".cursor", fig);
      if (c) { c.style.left = "50%"; c.style.top = "110%"; }
      if (reduce) { fig._spots.forEach(function (s) { s.el.classList.add("on"); }); return; }
      fig._spots.forEach(function (s, k) {
        timers.push(setTimeout(function () {
          if (fig._kind === "desk" && !desktop.matches) frame(fig, k);
          moveCursor(fig, k);
          timers.push(setTimeout(function () {
            s.el.classList.add("on");
            if (wc) { wc.textContent = s.text; wc.classList.toggle("warn", s.warn); wc.classList.add("on"); }
          }, fig._kind === "desk" ? 850 : 200));
        }, LEAD + k * STEP));
      });
      timers.push(setTimeout(function () {
        if (!visible) return;
        if (auto) select((cur + 1) % tabs.length); else play();
      }, fig._dur));
    }
    function select(k) {
      cur = k;
      tabs.forEach(function (t, n) {
        var on = n === k, bar = $(".fx__bar", t);
        t.setAttribute("aria-selected", on);
        t.tabIndex = on ? 0 : -1;
        panels[n].hidden = !on;
        panels[n].classList.toggle("is-on", on);
        bar.classList.remove("run");
        if (on && auto && visible) { t.style.setProperty("--tdur", panels[n]._dur + "ms"); void bar.offsetWidth; bar.classList.add("run"); }
      });
      if (visible) play();
    }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) select(cur); else clear();
    }, { threshold: 0.35 }).observe(fx);
    var refit = function () { frame(panels[cur], null); };
    if (window.ResizeObserver) new ResizeObserver(refit).observe($(".fx__stage", fx));
    select(0);
  }
  $$(".fx").forEach(function (fx) { new Group(fx); });

  /* ---------- scroll effects ---------- */
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
    bxPhone.style.transform = "translate(" + lerp(big ? 260 : 150, big ? 170 : 92, ph) + "px," + lerp(240, big ? 10 : 34, ph) + "px) rotate(" + lerp(16, -6, ph) + "deg) scale(" + (big ? 1.2 : 0.78) + ")";
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

  /* ---------- testimonials: slow auto-scroll on desktop ---------- */
  var rail = $(".quotes__rail");
  if (rail && !reduce) {
    $$(".q", rail).forEach(function (q) { var c = q.cloneNode(true); c.setAttribute("aria-hidden", "true"); rail.appendChild(c); });
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
          if (x >= rail.scrollWidth / 2) x = 0;
          rail.scrollLeft = x;
        }
      } else rail.classList.remove("auto");
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- sticky mobile CTA ---------- */
  var sticky = $("#sticky"), heroCta = $(".hero__cta"), finalSec = $("#final");
  var heroOut = false, finalIn = false;
  function syncSticky() {
    var on = heroOut && !finalIn;
    sticky.classList.toggle("on", on);
    sticky.setAttribute("aria-hidden", !on);
    $$("a", sticky).forEach(function (b) { b.tabIndex = on ? 0 : -1; });
  }
  new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; syncSticky(); }).observe(heroCta);
  new IntersectionObserver(function (es) { finalIn = es[0].isIntersecting; syncSticky(); }).observe(finalSec);

  $("#yr").textContent = new Date().getFullYear();
})();
