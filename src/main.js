(function () {
  'use strict';
  var CFG = JSON.parse(document.getElementById('rb-config').textContent);
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- tracking: one dataLayer, GA4 picks it up if CFG.GA4_ID is set ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(event, props) {
    var p = props || {}; p.event = event;
    window.dataLayer.push(p);
    if (window.gtag) window.gtag('event', event, props || {});
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track, t.dataset.trackLabel ? { label: t.dataset.trackLabel } : {});
  });

  /* ---------- header + mobile menu ---------- */
  var hdr = $('.hdr');
  addEventListener('scroll', function () { hdr.classList.toggle('scrolled', scrollY > 8); }, { passive: true });
  var menu = $('#menu'), burger = $('#burger');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) $('#menu-close').focus(); else burger.focus();
  }
  burger.addEventListener('click', function () { setMenu(true); });
  $('#menu-close').addEventListener('click', function () { setMenu(false); });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false); });

  /* ---------- reveal on scroll (staggered children) ---------- */
  $$('[data-reveal]').forEach(function (el) {
    Array.prototype.forEach.call(el.children, function (c, i) { c.style.setProperty('--i', i); });
  });
  if ('IntersectionObserver' in window && !RM) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('[data-reveal]').forEach(function (el) { rio.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- headline word reveal ---------- */
  var splits = $$('[data-split]');
  if ('IntersectionObserver' in window && !RM) {
    var sio2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); sio2.unobserve(e.target); } });
    }, { threshold: 0.2 });
    splits.forEach(function (el) { sio2.observe(el); });
  } else splits.forEach(function (el) { el.classList.add('in'); });
  requestAnimationFrame(function () { var h1 = $('#h1'); if (h1) h1.classList.add('in'); });

  /* ---------- scroll progress bar ---------- */
  var bar = $('.progress-top'), barRaf = 0;
  addEventListener('scroll', function () {
    if (barRaf) return;
    barRaf = requestAnimationFrame(function () {
      barRaf = 0;
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
    });
  }, { passive: true });

  /* ---------- run looping animations only while on screen ---------- */
  var animEls = $$('[data-anim]');
  if ('IntersectionObserver' in window) {
    var aio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('anim-on'); e.target.classList.remove('paused'); }
        else e.target.classList.add('paused');
      });
    }, { threshold: 0.15 });
    animEls.forEach(function (el) { el.classList.add('paused'); aio.observe(el); });
  } else animEls.forEach(function (el) { el.classList.add('anim-on'); });

  /* ---------- phone scene players (stand in for product videos) ---------- */
  $$('[data-player]').forEach(function (pl) {
    var scenes = $$('.scr', pl), idx = -1, timer = null, visible = false;
    var cap = pl.dataset.cap ? document.getElementById(pl.dataset.cap) : null;
    var stage = pl.closest('.stage'), fls = stage && pl.dataset.floats ? $$('.fl', stage) : [];
    var caps = cap ? $$('.sr-only li', stage).map(function (li) { return li.textContent; }) : [];
    function show(i) {
      if (scenes.length === 1) {
        scenes[0].classList.remove('on'); void scenes[0].offsetWidth;
      }
      scenes.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      idx = i;
      if (cap) {
        cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
        $('b', cap).textContent = i + 1; $('span', cap).textContent = caps[i];
      }
      if (fls.length) {
        if (i === 0) fls.forEach(function (f) { f.classList.remove('show'); });
        var k = i === 2 ? 0 : i === 3 ? 1 : i === 4 ? 2 : -1;
        if (k >= 0) {
          if (matchMedia('(max-width:719px)').matches) fls.forEach(function (f) { f.classList.remove('show'); });
          fls[k].classList.add('show');
        }
      }
    }
    function next() {
      clearTimeout(timer);
      if (!visible || document.hidden) return;
      show((idx + 1) % scenes.length);
      timer = setTimeout(next, +scenes[idx].dataset.d || 4500);
    }
    if (RM) { show(scenes.length > 2 ? 1 : 0); return; }
    show(0); timer = setTimeout(next, +scenes[0].dataset.d || 4500);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible; visible = es[0].isIntersecting;
        if (visible && !was) { clearTimeout(timer); timer = setTimeout(next, +scenes[idx].dataset.d || 4500); }
      }, { threshold: 0.25 }).observe(pl);
    } else visible = true;
    document.addEventListener('visibilitychange', function () { if (!document.hidden && visible) { clearTimeout(timer); timer = setTimeout(next, 1200); } });
  });

  /* ---------- spotlight that follows the pointer on dark cards ---------- */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (ev) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    });
  });

  /* ---------- number animation ---------- */
  function animateNum(el, to, dur) {
    var from = +el.dataset.cur || 0;
    if (RM) { el.textContent = to.toLocaleString('en-IN'); el.dataset.cur = to; return; }
    var t0 = performance.now(); dur = dur || 900;
    cancelAnimationFrame(el._raf);
    function f(t) {
      var p = Math.max(0, Math.min((t - t0) / dur, 1)), e = 1 - Math.pow(1 - p, 3), v = Math.round(from + (to - from) * e);
      el.textContent = v.toLocaleString('en-IN'); el.dataset.cur = v;
      if (p < 1) el._raf = requestAnimationFrame(f);
    }
    el._raf = requestAnimationFrame(f);
  }
  function countOnView(el, to, dur) {
    if (!('IntersectionObserver' in window)) { el.textContent = to; return; }
    el.textContent = RM ? to : '0';
    var o = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { animateNum(el, to, dur); o.disconnect(); }
    }, { threshold: 0.6 });
    o.observe(el);
  }
  $$('[data-count]').forEach(function (el) { countOnView(el, +el.dataset.count, +el.dataset.dur || 1200); });

  /* ---------- marketplace chips with sliding indicator ---------- */
  var chipBar = $('#chips');
  if (chipBar) {
    var chips = $$('.chip', chipBar), ind = $('.chip-ind', chipBar);
    var moveInd = function (c) { ind.style.width = c.offsetWidth + 'px'; ind.style.transform = 'translateX(' + c.offsetLeft + 'px)'; };
    var select = function (c, focus, fromUser) {
      chips.forEach(function (x) {
        var on = x === c;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        p.setAttribute('aria-hidden', !on);
      });
      moveInd(c);
      if (focus) c.focus();
      c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' });
      if (fromUser) track('marketplace_chip_select', { marketplace: c.dataset.id });
    };
    chips.forEach(function (c, i) {
      c.addEventListener('click', function () { select(c, false, true); });
      c.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? chips.length - 1 : null;
        if (n === null) return; e.preventDefault();
        select(chips[(n + chips.length) % chips.length], true, true);
      });
    });
    select(chips[0]);
    addEventListener('resize', function () { moveInd($('.chip[aria-selected="true"]', chipBar)); });
    if (document.fonts) document.fonts.ready.then(function () { moveInd($('.chip[aria-selected="true"]', chipBar)); });
  }

  /* ---------- swipe cards: dots + arrows ---------- */
  $$('[data-swipe]').forEach(function (wrap) {
    var track_ = $('.swipe', wrap), cards = $$('.swipe > *', wrap), dots = $('.dots', wrap);
    if (!dots) return;
    cards.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Go to card ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dots.appendChild(b);
    });
    var bs = $$('button', dots);
    function go(i) { track_.scrollTo({ left: cards[i].offsetLeft - track_.offsetLeft - parseFloat(getComputedStyle(track_).paddingLeft), behavior: RM ? 'auto' : 'smooth' }); }
    function cur() {
      var x = track_.scrollLeft, best = 0, d = 1e9;
      cards.forEach(function (c, i) { var dd = Math.abs(c.offsetLeft - track_.offsetLeft - parseFloat(getComputedStyle(track_).paddingLeft) - x); if (dd < d) { d = dd; best = i; } });
      return best;
    }
    function upd() { var c = cur(); bs.forEach(function (b, i) { b.setAttribute('aria-current', i === c); }); }
    track_.addEventListener('scroll', function () { cancelAnimationFrame(track_._r); track_._r = requestAnimationFrame(upd); }, { passive: true });
    var prev = $('[data-prev]', wrap), next = $('[data-next]', wrap);
    if (prev) prev.addEventListener('click', function () { go(Math.max(0, cur() - 1)); });
    if (next) next.addEventListener('click', function () { go(Math.min(cards.length - 1, cur() + 1)); });
    upd();
  });

  /* ---------- videos: hero picks mobile/desktop cut; others lazy-load at 30% visibility ---------- */
  function fillSources(v, webm, mp4) {
    if (v.dataset.loaded) return;
    if (webm) { var s1 = document.createElement('source'); s1.src = webm; s1.type = 'video/webm'; v.appendChild(s1); }
    if (mp4) { var s2 = document.createElement('source'); s2.src = mp4; s2.type = 'video/mp4'; v.appendChild(s2); }
    v.dataset.loaded = '1'; v.load();
  }
  var played = {};
  function onPlay(v) { v.addEventListener('play', function () { if (!played[v.dataset.name]) { played[v.dataset.name] = 1; track('video_play', { video: v.dataset.name }); } }); }
  var hv = $('#hero-video');
  if (hv) {
    var desk = matchMedia('(min-width:1024px)').matches;
    var poster = desk ? hv.dataset.posterDt : hv.dataset.posterMb;
    if (poster) hv.poster = poster;
    onPlay(hv);
    fillSources(hv, desk ? hv.dataset.dtWebm : hv.dataset.mbWebm, desk ? hv.dataset.dtMp4 : hv.dataset.mbMp4);
    if (RM) { hv.removeAttribute('autoplay'); hv.controls = true; hv.pause(); }
    else hv.play().catch(function () {});
  }
  var lazyV = $$('video[data-lazy]');
  lazyV.forEach(onPlay);
  if (RM) {
    lazyV.forEach(function (v) { v.controls = true; v.preload = 'none'; fillSources(v, v.dataset.webm, v.dataset.mp4); });
  } else if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { fillSources(v, v.dataset.webm, v.dataset.mp4); v.play().catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.3 });
    lazyV.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- sticky bar + WhatsApp button + cookie bar ---------- */
  var root = document.documentElement, sticky = $('#sticky'), cookie = $('#cookie');
  var heroOut = false, finalIn = false;
  function updSticky() {
    var show = heroOut && !finalIn && !matchMedia('(min-width:1024px)').matches;
    sticky.classList.toggle('show', show);
    sticky.setAttribute('aria-hidden', !show);
    $$('a,button', sticky).forEach(function (el) { el.tabIndex = show ? 0 : -1; });
    root.style.setProperty('--sticky-h', show ? sticky.offsetHeight + 'px' : '0px');
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting; updSticky(); }).observe($('#hero-cta'));
    new IntersectionObserver(function (es) { finalIn = es[0].isIntersecting; updSticky(); }, { threshold: 0.2 }).observe($('#final'));
  }
  function setCookieH() { root.style.setProperty('--cookie-h', cookie && !cookie.hidden ? cookie.offsetHeight + 'px' : '0px'); }
  var consent = null;
  try { consent = localStorage.getItem('rb_consent'); } catch (e) {}
  if (cookie) {
    cookie.hidden = !!consent;
    $$('button', cookie).forEach(function (b) {
      b.addEventListener('click', function () {
        consent = b.dataset.consent;
        try { localStorage.setItem('rb_consent', consent); } catch (e) {}
        cookie.hidden = true; setCookieH();
        if (consent === 'yes') loadAnalytics();
      });
    });
    setCookieH();
    addEventListener('resize', setCookieH);
  }
  function loadAnalytics() {
    if (!CFG.GA4_ID || window.gtag) return;
    var s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.GA4_ID);
    document.head.appendChild(s);
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', CFG.GA4_ID);
  }
  if (consent === 'yes') loadAnalytics();

  /* ---------- early access modal ---------- */
  var dlg = $('#access'), form = $('#access-form'), done = $('#access-done');
  $$('[data-open-form]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      form.hidden = false; done.hidden = true;
      if (b.dataset.market) { var sel = $('#f-market'); sel.value = b.dataset.market; }
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      setTimeout(function () { $('#f-name').focus(); }, 50);
    });
  });
  $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  function validate() {
    var ok = true;
    $$('.f', form).forEach(function (f) {
      var inp = $('input,select', f), good = inp.checkValidity();
      if (inp.id === 'f-wa') good = /^[6-9]\d{9}$/.test(inp.value.replace(/\D/g, '').slice(-10)) && inp.value.replace(/\D/g, '').length >= 10;
      f.classList.toggle('invalid', !good);
      inp.setAttribute('aria-invalid', !good);
      if (!good && ok) { inp.focus(); ok = false; }
    });
    return ok;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var data = {
      name: $('#f-name').value.trim(),
      whatsapp: '+91' + $('#f-wa').value.replace(/\D/g, '').slice(-10),
      marketplace: $('#f-market').value,
      orders: $('#f-orders').value
    };
    track('form_submit', { marketplace: data.marketplace, orders: data.orders });
    if (CFG.FORM_ENDPOINT) {
      fetch(CFG.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).catch(function () {});
    }
    form.hidden = true; done.hidden = false;
    $('#done-close').focus();
  });

  /* ---------- calculator ---------- */
  var cO = $('#c-orders'), cR = $('#c-reviews'), out = $('#c-silent'), ratio = $('#c-ratio'), dots = $$('#people i'), used = false;
  function clampInputs() {
    var o = Math.max(0, Math.min(1000000, Math.round(+cO.value || 0)));
    var r = Math.max(0, Math.min(o, Math.round(+cR.value || 0)));
    return { o: o, r: r };
  }
  function calc(fromUser) {
    var v = clampInputs(), silent = v.o - v.r, pct = v.o ? Math.round(silent / v.o * 100) : 0;
    animateNum(out, silent, 600);
    ratio.textContent = pct;
    var on = v.o ? Math.max(v.r ? 1 : 0, Math.round(v.r / v.o * 100)) : 0;
    dots.forEach(function (d, i) { d.classList.toggle('on', i < on); });
    if (fromUser && !used) { used = true; track('calculator_used'); }
  }
  [cO, cR].forEach(function (inp) {
    inp.addEventListener('input', function () { calc(true); });
    inp.addEventListener('blur', function () { var v = clampInputs(); cO.value = v.o; cR.value = v.r; calc(true); });
  });
  $$('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var inp = document.getElementById(b.dataset.for), step = +b.dataset.step;
      inp.value = Math.max(0, (+inp.value || 0) + step);
      calc(true);
    });
  });
  calc(false);
  var lead = $('#lead');
  lead.addEventListener('submit', function (e) {
    e.preventDefault();
    var inp = $('#lead-contact'), val = inp.value.trim();
    var ok = /^\S+@\S+\.\S+$/.test(val) || /^(\+?91)?[6-9]\d{9}$/.test(val.replace(/[\s-]/g, ''));
    inp.setAttribute('aria-invalid', !ok);
    if (!ok) { inp.focus(); return; }
    var v = clampInputs();
    track('calculator_lead_submit', { orders: v.o, reviews: v.r });
    if (CFG.CALC_LEAD_ENDPOINT) fetch(CFG.CALC_LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contact: val, orders: v.o, reviews: v.r }) }).catch(function () {});
    lead.hidden = true; $('#lead-done').hidden = false;
  });

  /* ---------- FAQ ---------- */
  $$('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_open', { question: $('summary span', d).textContent }); });
  });

  /* ---------- sample reviews (testing only) ---------- */
  var samples = $('#samples');
  if (samples && 'IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { track('sample_reviews_viewed'); so.disconnect(); } }, { threshold: 0.4 });
    so.observe(samples);
  }

  /* ---------- GSAP: the one pinned scroll moment + self-drawing flow ---------- */
  function initGsap() {
    if (RM || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
    var how = $('#how'), steps = $$('.step', how);

    var mm = gsap.matchMedia();
    mm.add({ ok: '(min-height: 560px)', desk: '(min-width: 1024px)' }, function (ctx) {
      if (!ctx.conditions.ok) return;
      var D = ctx.conditions.desk, OUT = D ? -34 : -62, IN = D ? 40 : 70;
      how.classList.add('pinmode');
      var bars = $$('.progress i b', how);
      gsap.set(steps.slice(1).map(function (s) { return $('.step-text', s); }), { autoAlpha: 0, y: 24 });
      gsap.set(steps.slice(1).map(function (s) { return $('.step-visual', s); }), { autoAlpha: 0, xPercent: IN, scale: 0.86 });
      var tl = gsap.timeline({
        defaults: { ease: 'power2.inOut', duration: 1 },
        scrollTrigger: {
          trigger: $('.steps', how), start: 'top 64px', end: '+=' + (steps.length - 1) * 100 + '%',
          pin: true, scrub: 0.6, anticipatePin: 1,
          snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.5 }, ease: 'power1.inOut' }
        }
      });
      tl.addLabel('s0');
      tl.to(bars[0], { scaleX: 1, duration: 0.01 }, 's0');
      steps.forEach(function (s, i) {
        if (i === 0) return;
        var prev = steps[i - 1], at = 's' + (i - 1) + '+=0.15';
        tl.to($('.step-text', prev), { autoAlpha: 0, y: -24 }, at)
          .to($('.step-visual', prev), { xPercent: OUT, scale: 0.78, autoAlpha: 0.25 }, at)
          .to($('.step-text', s), { autoAlpha: 1, y: 0 }, at + '+=0.25')
          .to($('.step-visual', s), { xPercent: 0, scale: 1, autoAlpha: 1 }, at)
          .to(bars[i], { scaleX: 1, duration: 0.6 }, at)
          .addLabel('s' + i);
        if (i >= 2) tl.to($('.step-visual', steps[i - 2]), { autoAlpha: 0, duration: 0.5 }, at);
      });
      return function () { how.classList.remove('pinmode'); gsap.set($$('.step-text, .step-visual', how), { clearProps: 'all' }); };
    });

    // flow diagram draws itself as it scrolls through the viewport (not pinned)
    var flow = $('#flow'), line = $('.flow-line b', flow), nodes = $$('li', flow);
    var vertical = !matchMedia('(min-width:1024px)').matches;
    nodes.forEach(function (n) { n.classList.remove('lit'); });
    gsap.set(line, vertical ? { scaleY: 0 } : { scaleX: 0 });
    gsap.set(nodes, { autoAlpha: 0.3, y: 10 });
    var ftl = gsap.timeline({
      scrollTrigger: { trigger: flow, start: 'top 78%', end: 'bottom 55%', scrub: 0.5 },
      onUpdate: function () {
        var pr = ftl.progress();
        nodes.forEach(function (n, i) { n.classList.toggle('lit', pr >= i / (nodes.length - 1) * 0.92); });
      }
    });
    ftl.to(line, vertical ? { scaleY: 1, ease: 'none', duration: nodes.length } : { scaleX: 1, ease: 'none', duration: nodes.length }, 0);
    nodes.forEach(function (n, i) { ftl.to(n, { autoAlpha: 1, y: 0, duration: 0.6 }, i * 0.95); });
  }
  $$('#flow li').forEach(function (n) { n.classList.add('lit'); });
  if (window.gsap) initGsap();
  else window.addEventListener('load', initGsap);
})();
