#!/usr/bin/env python3
"""Build index.html from content.json + src/styles.css + src/main.js.

All page copy lives in content.json. Edit it, then run:
    python3 build.py                  # production build -> index.html (sample reviews follow config flag)
    python3 build.py --show-samples   # layout preview with sample reviews -> preview.html

The output is plain static HTML: every headline, paragraph and FAQ answer is real HTML text,
so Google and AI answer engines can read and quote it.
"""
import json, sys, html
from pathlib import Path

ROOT = Path(__file__).parent
C = json.loads((ROOT / "content.json").read_text(encoding="utf-8"))
CSS = (ROOT / "src/styles.css").read_text(encoding="utf-8")
JS = (ROOT / "src/main.js").read_text(encoding="utf-8")
GSAP = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
SCROLLTRIGGER = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"

show_samples = C["config"]["SHOW_SAMPLE_REVIEWS"] or "--show-samples" in sys.argv
out_file = "preview.html" if "--show-samples" in sys.argv else "index.html"

e = lambda s: html.escape(str(s), quote=True)
cfg = C["config"]
WA = f"https://wa.me/{cfg['WHATSAPP_NUMBER']}?text=" + html.escape(
    __import__("urllib.parse").parse.quote(cfg["WHATSAPP_PREFILL"]))

# ---------------------------------------------------------------- icons
I = {
 "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
 "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 "x": '<path d="M7 7l10 10M17 7L7 17"/>',
 "plus": '<path d="M12 5v14M5 12h14"/>',
 "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
 "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
 "steps": '<path d="M4 18h5v-4h5v-4h6"/><path d="M17 7l3 3-3 3"/>',
 "pen": '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
 "map": '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
 "box": '<path d="M3 7.5l9-4.5 9 4.5v9l-9 4.5-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
 "qr": '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h3v3h-3zM20.5 14v.01M17 20.5h3.5V17"/>',
 "shield": '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
 "play": '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
 "chat": '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
 "image": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
 "video": '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
 "left": '<path d="M15 6l-6 6 6 6"/>',
 "right": '<path d="M9 6l6 6-6 6"/>',
}
def icon(name, cls="", label=None):
    a = f' role="img" aria-label="{e(label)}"' if label else ' aria-hidden="true"'
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round"{a}>{I[name]}</svg>')
WA_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>')
LOGO = ('<svg viewBox="0 0 298 306" aria-hidden="true"><g fill="#0096DB"><path d="M0 0h145v83H0z"/>'
        '<path d="M145 0h48a101.5 101.5 0 0 1 0 203h-48z"/><path d="M0 120h76v75H0z"/>'
        '<path d="M76 195h77v77H76z"/><path d="M190 203h36a72 72 0 0 1 72 72v31H190z"/></g></svg>')

# ---------------------------------------------------------------- media helpers
def placeholder(m):
    kind = "Video" if m["type"] == "video" else "Image"
    return (f'<div class="ph" role="img" aria-label="{e(kind + " placeholder: " + m["brief"])}">'
            f'{icon("video" if m["type"] == "video" else "image")}'
            f'<span class="ph-tag">{kind} placeholder</span><strong>{e(m["label"])}</strong>'
            f'<p>{e(m["brief"])}</p><span class="spec">{e(m["spec"])}</span></div>')

def video_lazy(m):
    if not (m.get("src_webm") or m.get("src_mp4")):
        return placeholder(m)
    track = f'<track kind="captions" src="{e(m["captions"])}" srclang="en" label="English" default>' if m.get("captions") else ""
    poster = f' poster="{e(m["poster"])}"' if m.get("poster") else ""
    return (f'<video data-lazy data-name="{e(m["name"])}" data-webm="{e(m.get("src_webm",""))}" data-mp4="{e(m.get("src_mp4",""))}"'
            f' muted loop playsinline preload="none"{poster} aria-label="{e(m["brief"])}">{track}</video>')

def image(m, eager=False):
    if not (m.get("src_avif") or m.get("src_webp")):
        return placeholder(m)
    fallback = m.get("src_webp") or m.get("src_avif")
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    avif = f'<source type="image/avif" srcset="{e(m["src_avif"])}">' if m.get("src_avif") else ""
    return (f'<picture>{avif}<source type="image/webp" srcset="{e(fallback)}">'
            f'<img src="{e(fallback)}" width="{m["width"]}" height="{m["height"]}" alt="{e(m["alt"])}" {load}></picture>')

def media(key):
    m = C["media"][key]
    inner = video_lazy(m) if m["type"] == "video" else image(m)
    ratio = "9 / 16" if m.get("phone") else ("4 / 3" if m["type"] == "image" and key == "feat_dashboard" else "16 / 9")
    box = f'<div class="media" style="--ratio:{ratio}">{inner}</div>'
    if m.get("phone"):
        return f'<div class="phone">{box}</div>'
    if key == "feat_dashboard":
        return f'<div class="browser"><div class="browser-bar"><i></i><i></i><i></i></div>{box}</div>'
    return box

def hero_media():
    m = C["media"]["hero"]
    has = any(m.get(k) for k in ("src_mb_webm", "src_mb_mp4", "src_dt_webm", "src_dt_mp4"))
    if has:
        track = f'<track kind="captions" src="{e(m["captions"])}" srclang="en" label="English" default>' if m.get("captions") else ""
        inner = (f'<video id="hero-video" data-name="hero" autoplay muted loop playsinline preload="metadata"'
                 f' data-mb-webm="{e(m["src_mb_webm"])}" data-mb-mp4="{e(m["src_mb_mp4"])}"'
                 f' data-dt-webm="{e(m["src_dt_webm"])}" data-dt-mp4="{e(m["src_dt_mp4"])}"'
                 f' data-poster-mb="{e(m["poster_mb"])}" data-poster-dt="{e(m["poster_dt"])}"'
                 f' aria-label="{e(m["brief"])}">{track}</video>')
    else:
        inner = placeholder(m)
    return (f'<style>.hero-media .media{{aspect-ratio:{m["ratio_mb"]}}}@media(min-width:1024px){{.hero-media .media{{aspect-ratio:{m["ratio_dt"]}}}}}</style>'
            f'<div class="media">{inner}</div>')

# ---------------------------------------------------------------- reusable bits
def cta_primary(track_name, cls="btn btn--primary btn--block", label=None, extra="", id_=""):
    idattr = f' id="{id_}"' if id_ else ""
    return (f'<a href="#early-access" class="{cls}" data-open-form data-track="{track_name}"{idattr}{extra}>'
            f'{e(label or C["cta"]["primary"])}{icon("arrow","arr")}</a>')

def wa_link(where):
    return (f'<a class="link-wa" href="{WA}" target="_blank" rel="noopener" data-track="whatsapp_click" data-track-label="{where}">'
            f'{WA_ICON}<span>{e(C["cta"]["whatsapp"])}</span></a>')

def cta_block(track_name, where, center=False, reassure=True):
    r = f'<p class="reassure">{e(C["cta"]["reassure"])}</p>' if reassure else ""
    return (f'<div class="cta-row{" cta-row--center" if center else ""}" data-reveal>'
            f'{cta_primary(track_name)}{wa_link(where)}{r}</div>')

def checklist(items, ic="check"):
    return "".join(f'<li>{icon(ic)}<span>{e(x)}</span></li>' for x in items)

# ---------------------------------------------------------------- sections
h, p, pk, hw, ft, tr, sm, ca, fq, fn, fo, fm = (C[k] for k in
    ("hero", "problem", "pick", "how", "features", "trust", "samples", "calc", "faq", "final", "footer", "form"))

nav_d = "".join(f'<a href="{e(l["href"])}">{e(l["label"])}</a>' for l in C["nav"]["links"])
nav_m = "".join(f'<a class="m-link" href="{e(l["href"])}">{e(l["label"])}</a>' for l in C["nav"]["links"])

header = f'''
<header class="hdr">
  <div class="wrap">
    <a href="/" class="logo" aria-label="ReviewBuddie home">{LOGO}reviewbuddie</a>
    <nav class="nav-d" aria-label="Main">{nav_d}{cta_primary("hero_cta_click", "btn btn--primary", C["nav"]["cta"])}</nav>
    <button class="burger" id="burger" aria-label="{e(C["nav"]["menu_label"])}" aria-expanded="false" aria-controls="menu">{icon("menu")}</button>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true" role="dialog" aria-label="Menu">
  <div class="menu-top"><span class="logo">{LOGO}reviewbuddie</span>
    <button class="burger" id="menu-close" aria-label="{e(C["nav"]["close_label"])}">{icon("x")}</button></div>
  <nav aria-label="Mobile">{nav_m}</nav>
  {cta_primary("hero_cta_click")}
  {wa_link("menu")}
</div>'''

hero = f'''
<section class="hero" aria-labelledby="h1">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="eyebrow"><i aria-hidden="true"></i>{e(h["eyebrow"])}</p>
      <h1 id="h1">{e(h["h1"])}</h1>
      <p class="sub">{e(h["sub"])}</p>
      <div class="cta-row" id="hero-cta">
        <div class="hero-actions">{cta_primary("hero_cta_click")}{wa_link("hero")}</div>
        <p class="reassure">{e(C["cta"]["reassure"])}</p>
      </div>
    </div>
    <div class="hero-media">{hero_media()}</div>
  </div>
</section>'''

strip_items = "".join(f"<li>{e(x)}</li>" for x in C["strip"]["items"])
strip = f'''
<div class="strip">
  <p>{e(C["strip"]["label"])} {e(", ".join(C["strip"]["items"]))}</p>
  <div class="marquee" aria-hidden="true"><ul>{strip_items * 4}{strip_items * 4}</ul></div>
</div>'''

reasons = "".join(f'<div class="reason">{icon(r["icon"])}<h3>{e(r["title"])}</h3><p>{e(r["body"])}</p></div>' for r in p["reasons"])
problem = f'''
<section class="section section--dark" aria-labelledby="problem-h">
  <div class="wrap">
    <div data-reveal>
      <div class="counter" role="img" aria-label="{e(p["delivered_label"])}: {p["delivered"]}. {e(p["reviews_label"])}: {p["reviews"]}.">
        <div><b data-count="{p["delivered"]}" data-dur="1400">{p["delivered"]}</b><span>{e(p["delivered_label"])}</span></div>
        {icon("arrow")}
        <div class="rev"><b data-count="{p["reviews"]}" data-dur="1400">{p["reviews"]}</b><span>{e(p["reviews_label"])}</span></div>
      </div>
      <p class="counter-note">{e(p["counter_note"])}</p>
    </div>
    <div class="head" data-reveal>
      <p class="eyebrow">{e(p["eyebrow"])}</p>
      <h2 id="problem-h">{e(p["h2"])}</h2>
      <p class="sub">{e(p["sub"])}</p>
    </div>
    <div class="reasons" data-reveal>{reasons}</div>
    <div class="ba" data-reveal>
      <div class="ba-card ba-before"><h3><span class="tag">Before</span>{e(p["before_title"])}</h3><ul>{checklist(p["before"], "x")}</ul></div>
      <div class="ba-card ba-after"><h3><span class="tag">After</span>{e(p["after_title"])}</h3><ul>{checklist(p["after"])}</ul></div>
    </div>
    {cta_block("hero_cta_click", "problem")}
  </div>
</section>'''

def market_attr(it):
    return ' data-market="' + e(it["label"]) + '"'

chips = "".join(
    f'<button class="chip" role="tab" id="chip-{it["id"]}" data-id="{it["id"]}" aria-controls="pp-{it["id"]}" aria-selected="false" tabindex="-1">{e(it["label"])}</button>'
    for it in pk["items"])
panels = "".join(
    f'<div class="pick-card" role="tabpanel" id="pp-{it["id"]}" aria-labelledby="chip-{it["id"]}" aria-hidden="true">'
    f'<h3>{e(it["title"])}</h3><p class="muted">{e(it["body"])}</p><ul>{checklist(it["points"])}</ul>'
    f'{cta_primary("hero_cta_click", "btn btn--primary btn--block", extra=market_attr(it))}</div>'
    for it in pk["items"])
pick = f'''
<section class="section section--light" aria-labelledby="pick-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <p class="eyebrow">{e(pk["eyebrow"])}</p>
      <h2 id="pick-h">{e(pk["h2"])}</h2>
      <p class="sub">{e(pk["sub"])}</p>
    </div>
    <div data-reveal>
      <div class="chips" id="chips" role="tablist" aria-label="Marketplaces"><span class="chip-ind" aria-hidden="true"></span>{chips}</div>
      <div class="pick-panels">{panels}</div>
    </div>
    <div class="cta-row" data-reveal>{wa_link("pick")}<p class="reassure">{e(C["cta"]["reassure"])}</p></div>
  </div>
</section>'''

steps = "".join(
    f'<li class="step"><div class="step-text"><span class="step-n" aria-hidden="true">{s["n"]}</span>'
    f'<h3><span class="sr-only">Step {s["n"]}: </span>{e(s["title"])}</h3><p>{e(s["body"])}</p></div>'
    f'<div class="step-visual">{media(s["media"])}</div></li>'
    for s in hw["steps"])
progress = "".join("<i><b></b></i>" for _ in hw["steps"])
flow = "".join(
    f'<li><span class="node">{icon(n["icon"])}</span><span><b>{e(n["title"])}</b><span>{e(n["sub"])}</span></span></li>'
    for n in hw["flow"])
how = f'''
<section class="section section--tint how" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <p class="eyebrow">{e(hw["eyebrow"])}</p>
      <h2 id="how-h">{e(hw["h2"])}</h2>
      <p class="sub">{e(hw["sub"])}</p>
    </div>
    <ol class="steps" style="list-style:none;margin:0;padding:0">{steps}<li class="progress" aria-hidden="true">{progress}</li></ol>
    <div class="flow" id="flow">
      <h3>{e(hw["flow_title"])}</h3>
      <div class="flow-track"><span class="flow-line" aria-hidden="true"><b></b></span><ol>{flow}</ol></div>
    </div>
    {cta_block("hero_cta_click", "how")}
  </div>
</section>'''

cards = "".join(
    f'<article class="card"><div class="visual">{media(c["media"])}</div><h3>{e(c["title"])}</h3><p>{e(c["body"])}</p></article>'
    for c in ft["cards"])
arrows = (f'<div class="arrows"><button type="button" data-prev aria-label="Previous">{icon("left")}</button>'
          f'<button type="button" data-next aria-label="Next">{icon("right")}</button></div>')
features = f'''
<section class="section section--dark" id="features" aria-labelledby="feat-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <p class="eyebrow">{e(ft["eyebrow"])}</p>
      <h2 id="feat-h">{e(ft["h2"])}</h2>
      <p class="sub">{e(ft["sub"])}</p>
    </div>
    <div data-swipe>
      <div class="swipe" tabindex="0" aria-label="Features, swipe sideways">{cards}</div>
      <div class="swipe-ui"><div class="dots"></div><span class="swipe-hint">{e(ft["swipe_hint"])}</span>{arrows}</div>
    </div>
    {cta_block("hero_cta_click", "features")}
  </div>
</section>'''

trust = f'''
<section class="section section--light" aria-labelledby="trust-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <p class="eyebrow">{e(tr["eyebrow"])}</p>
      <h2 id="trust-h">{e(tr["h2"])}</h2>
    </div>
    <div class="trust" data-reveal>
      <figure class="founder">
        {media("founder")}
        <div style="display:grid;gap:14px">
          <blockquote>“{e(tr["founder_quote"])}”</blockquote>
          <p>{e(tr["founder_body"])}</p>
          <figcaption><b>{e(tr["founder_name"])}</b><span>{e(tr["founder_role"])}</span></figcaption>
          {'<p class="ph-note">Placeholder: add the founder name and photo before launch.</p>' if "[" in tr["founder_name"] else ""}
        </div>
      </figure>
      <div class="promise">{icon("shield", "big")}<h3>{e(tr["compliance_title"])}</h3><ul>{checklist(tr["compliance_points"])}</ul></div>
      <div class="founding">
        <div class="seats"><b>{cfg["FOUNDING_SPOTS"]}</b><span class="muted">founding spots</span></div>
        <h3>{e(tr["founding_title"])}</h3><p>{e(tr["founding_body"])}</p>
        {cta_primary("hero_cta_click", label=tr["founding_cta"])}
      </div>
    </div>
  </div>
</section>'''

# Replace with real, permissioned seller testimonials before enabling.
sample_cards = "".join(
    f'<figure class="scard"><span class="badge-sample">{e(sm["badge"])}</span><blockquote>“{e(s["quote"])}”</blockquote>'
    f'<figcaption><span class="av" aria-hidden="true">{e(s["initial"])}</span><span><b>{e(s["name"])}, {e(s["city"])}</b>'
    f'<span>{e(s["category"])} · {e(s["marketplace"])}</span></span></figcaption></figure>'
    for s in sm["items"])
samples = f'''
<!-- SAMPLE REVIEWS: testing only. Replace with real, permissioned seller testimonials before enabling. -->
<section class="section section--dark" id="samples" aria-labelledby="samples-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <div class="sample-head"><h2 id="samples-h">{e(sm["header"])}</h2><span class="badge-sample">{e(sm["badge"])}</span></div>
      <p class="sub">{e(sm["note"])}</p>
    </div>
    <div data-swipe>
      <div class="swipe" tabindex="0" aria-label="Sample reviews, swipe sideways">{sample_cards}</div>
      <div class="swipe-ui"><div class="dots"></div>{arrows}</div>
    </div>
  </div>
</section>''' if show_samples else ""

calc = f'''
<section class="section section--white" id="calculator" aria-labelledby="calc-h">
  <div class="wrap">
    <div class="head" data-reveal>
      <p class="eyebrow">{e(ca["eyebrow"])}</p>
      <h2 id="calc-h">{e(ca["h2"])}</h2>
      <p class="sub">{e(ca["sub"])}</p>
    </div>
    <div class="calc" data-reveal>
      <div class="calc-in">
        <div class="field"><label for="c-orders">{e(ca["orders_label"])}</label>
          <div class="num"><button type="button" data-step="-10" data-for="c-orders" aria-label="Decrease orders by 10">−</button>
          <input id="c-orders" type="number" inputmode="numeric" min="0" step="1" value="{p["delivered"]}">
          <button type="button" data-step="10" data-for="c-orders" aria-label="Increase orders by 10">+</button></div></div>
        <div class="field"><label for="c-reviews">{e(ca["reviews_label"])}</label>
          <div class="num"><button type="button" data-step="-1" data-for="c-reviews" aria-label="Decrease reviews by 1">−</button>
          <input id="c-reviews" type="number" inputmode="numeric" min="0" step="1" value="{p["reviews"]}">
          <button type="button" data-step="1" data-for="c-reviews" aria-label="Increase reviews by 1">+</button></div></div>
      </div>
      <div class="calc-out" aria-live="polite">
        <div class="big" id="c-silent">{p["delivered"] - p["reviews"]}</div>
        <p>{e(ca["result_label"])}</p>
        <div class="bar" aria-hidden="true"><i id="c-bar"></i></div>
        <div class="bar-legend" aria-hidden="true"><span>Reviewed</span><span>Silent</span></div>
        <p class="ratio">{e(ca["ratio_pre"])} <b id="c-ratio">96</b> {e(ca["ratio_post"])}</p>
        <form class="lead" id="lead" novalidate>
          <label for="lead-contact">{e(ca["lead_label"])}</label>
          <input id="lead-contact" type="text" autocomplete="email" placeholder="{e(ca["lead_placeholder"])}">
          <button class="btn btn--primary btn--block" type="submit">{e(ca["lead_button"])}</button>
        </form>
        <p class="lead-done" id="lead-done" hidden>{e(ca["lead_done"])}</p>
      </div>
    </div>
  </div>
</section>'''

faq_items = "".join(
    f'<details><summary><span>{e(q["q"])}</span>{icon("plus")}</summary><div class="ans"><p>{e(q["a"])}</p></div></details>'
    for q in fq["items"])
faq = f'''
<section class="section section--light" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="head" data-reveal><p class="eyebrow">{e(fq["eyebrow"])}</p><h2 id="faq-h">{e(fq["h2"])}</h2></div>
    <div class="faq" data-reveal>{faq_items}</div>
    {cta_block("hero_cta_click", "faq", reassure=False)}
  </div>
</section>'''

final = f'''
<section class="section section--dark final" id="final" aria-labelledby="final-h">
  <div class="wrap" data-reveal>
    <h2 id="final-h">{e(fn["h2"])}</h2>
    <p class="hinglish" lang="hi-Latn">{e(fn["hinglish"])}</p>
    <div class="cta-row cta-row--center">{cta_primary("hero_cta_click")}{wa_link("final")}<p class="reassure">{e(C["cta"]["reassure"])}</p></div>
  </div>
</section>'''

foot_links = "".join(f'<li><a href="{e(l["href"])}">{e(l["label"])}</a></li>' for l in fo["links"])
footer = f'''
<footer class="foot">
  <div class="wrap foot-grid">
    <div><a href="/" class="logo" aria-label="ReviewBuddie home">{LOGO}reviewbuddie</a><p>{e(fo["tagline"])}</p><p><b>{e(fo["company"])}</b></p></div>
    <nav aria-label="Footer"><ul>{foot_links}</ul></nav>
  </div>
  <div class="wrap"><p class="legal">© 2026 ReviewBuddie · {e(fo["legal"])}</p></div>
</footer>'''

opt = lambda xs: "".join(f'<option value="{e(x)}">{e(x)}</option>' for x in xs)
modal = f'''
<dialog class="modal" id="access" aria-labelledby="access-h">
  <div class="modal-in">
    <div class="modal-top"><div><h2 id="access-h">{e(fm["title"])}</h2><p class="muted">{e(fm["sub"])}</p></div>
      <button class="x" type="button" data-close aria-label="{e(fm["close"])}">{icon("x")}</button></div>
    <form class="form" id="access-form" novalidate>
      <div class="f field"><label for="f-name">{e(fm["name"])}</label><input id="f-name" name="name" autocomplete="name" required minlength="2"><span class="err">Please enter your name.</span></div>
      <div class="f field"><label for="f-wa">{e(fm["whatsapp"])}</label><div class="wa-input"><span>+91</span><input id="f-wa" name="whatsapp" type="tel" inputmode="numeric" autocomplete="tel-national" required aria-describedby="f-wa-hint"></div><span class="hint" id="f-wa-hint">{e(fm["whatsapp_hint"])}</span><span class="err">Please enter a valid 10-digit mobile number.</span></div>
      <div class="f field"><label for="f-market">{e(fm["marketplace"])}</label><select id="f-market" name="marketplace" required><option value="">Select</option>{opt(fm["marketplace_options"])}</select><span class="err">Please choose a marketplace.</span></div>
      <div class="f field"><label for="f-orders">{e(fm["orders"])}</label><select id="f-orders" name="orders" required><option value="">Select</option>{opt(fm["orders_options"])}</select><span class="err">Please choose a range.</span></div>
      <button class="btn btn--primary btn--block" type="submit">{e(fm["submit"])}</button>
      <p class="consent">{e(fm["consent"])}</p>
    </form>
    <div class="done" id="access-done" hidden>
      <span class="tick">{icon("check")}</span><h3>{e(fm["done_title"])}</h3><p class="muted">{e(fm["done_body"])}</p>
      {wa_link("form_done")}
      <button class="btn btn--outline btn--block" type="button" id="done-close" data-close>{e(fm["close"])}</button>
    </div>
  </div>
</dialog>'''

persistent = f'''
<div class="sticky" id="sticky" aria-hidden="true">
  <a href="#early-access" class="btn btn--primary" data-open-form data-track="sticky_bar_click" tabindex="-1">{e(C["cta"]["primary"])}</a>
  <small>{e(C["sticky"]["note"])}</small>
</div>
<a class="wa-fab" href="{WA}" target="_blank" rel="noopener" aria-label="{e(C["cta"]["whatsapp"])}" data-track="whatsapp_click" data-track-label="fab">{WA_ICON}</a>
<div class="cookie" id="cookie" hidden role="region" aria-label="Cookie notice">
  <p>{e(C["cookie"]["text"])}</p>
  <button type="button" data-consent="no">{e(C["cookie"]["decline"])}</button>
  <button type="button" class="ok" data-consent="yes">{e(C["cookie"]["accept"])}</button>
</div>'''

# ---------------------------------------------------------------- schema
schema = {
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "Organization", "@id": cfg["SITE_URL"] + "#org", "name": "ReviewBuddie", "url": cfg["SITE_URL"],
     "logo": cfg["SITE_URL"] + "favicon.svg", "parentOrganization": {"@type": "Organization", "name": "Havels Group"}},
    {"@type": "SoftwareApplication", "name": "ReviewBuddie", "url": cfg["SITE_URL"],
     "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
     "description": C["meta"]["description"], "publisher": {"@id": cfg["SITE_URL"] + "#org"},
     "areaServed": {"@type": "Country", "name": "India"},
     "featureList": [c["title"] for c in ft["cards"]]},
    {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q["q"], "acceptedAnswer": {"@type": "Answer", "text": q["a"]}} for q in fq["items"]]}
  ]
}

config_json = json.dumps({k: cfg[k] for k in ("WHATSAPP_NUMBER", "FORM_ENDPOINT", "CALC_LEAD_ENDPOINT", "GA4_ID")})

page = f'''<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(C["meta"]["title"])}</title>
<meta name="description" content="{e(C["meta"]["description"])}">
<link rel="canonical" href="{e(cfg["SITE_URL"])}">
<meta name="theme-color" content="#F6F8FA">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ReviewBuddie">
<meta property="og:locale" content="en_IN">
<meta property="og:url" content="{e(cfg["SITE_URL"])}">
<meta property="og:title" content="{e(C["meta"]["title"])}">
<meta property="og:description" content="{e(C["meta"]["description"])}">
<meta property="og:image" content="{e(cfg["SITE_URL"] + C["meta"]["og_image"])}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap">
<script>document.documentElement.className+=' js'</script>
<style>{CSS}</style>
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False)}</script>
<script src="{GSAP}" defer></script>
<script src="{SCROLLTRIGGER}" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{header}
<main id="main">
{hero}
{strip}
{problem}
{pick}
{how}
{features}
{trust}
{samples}
{calc}
{faq}
{final}
</main>
{footer}
{modal}
{persistent}
<script id="rb-config" type="application/json">{config_json}</script>
<script defer>{JS}</script>
</body>
</html>
'''
(ROOT / out_file).write_text(page, encoding="utf-8")
print(f"Built {out_file} ({len(page.encode())//1024} KB, sample reviews {'ON' if show_samples else 'OFF'})")
