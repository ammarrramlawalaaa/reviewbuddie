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
 "tri": '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
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

# ---------------------------------------------------------------- animated scenes (stand in for every video until real clips exist)
S = C["scenes"]
QR = ('<svg viewBox="0 0 29 29" shape-rendering="crispEdges" aria-hidden="true"><path fill="#17212E" d="M0 0h7v7H0zm1 1v5h5V1zm1 1h3v3H2zM22 0h7v7h-7zm1 1v5h5V1zm1 1h3v3h-3zM0 22h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM9 0h2v2H9zm3 0h1v3h-1zm3 1h2v1h-2zm3 0h2v2h-2zM9 3h1v2H9zm2 1h3v1h-3zm4 0h1v3h-1zm2 1h3v2h-3zM9 7h2v1H9zm3-1h2v2h-2zm-3 3h3v1H9zM0 9h2v1H0zm3 0h3v2H3zm4 0h1v3H7zm6 0h3v1h-3zm4 1h1v2h-1zm2-1h3v1h-3zm4 0h1v2h-1zm2 0h2v3h-2zM0 11h1v3H0zm9 0h3v2H9zm5 1h2v1h-2zm6 0h2v2h-2zM2 13h3v1H2zm5 0h1v2H7zm5 1h1v3h-1zm3 0h3v1h-3zm4 1h1v3h-1zm3 0h2v1h-2zm4 0h2v2h-2zM0 16h2v2H0zm3 0h3v1H3zm6 0h2v3H9zm5 1h2v2h-2zm4 1h1v1h-1zm3 0h3v1h-3zM2 19h1v1H2zm4 0h3v1H6zm7 0h1v3h-1zm9 1h2v2h-2zm3 0h2v1h-2zM9 21h2v1H9zm6-1h3v2h-3zm4 2h2v3h-2zm4 1h3v1h-3zM9 24h3v2H9zm5 0h2v1h-2zm9 2h2v3h-2zm4-1h2v2h-2zM12 27h3v2h-3zm4-1h2v3h-2zm3 2h3v1h-3z"/></svg>')
STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="{c}" style="{s}"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>'
ROUTER = ('<svg class="router" viewBox="0 0 120 70" aria-hidden="true"><rect x="8" y="34" width="104" height="28" rx="8" fill="currentColor" opacity=".35"/>'
          '<rect x="8" y="34" width="104" height="28" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>'
          '<path d="M30 34V10M90 34V10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
          '<circle class="led" cx="28" cy="48" r="3.5"/><circle class="led" cx="40" cy="48" r="3.5"/><circle class="led" cx="52" cy="48" r="3.5"/></svg>')
WAVE = ('<svg class="wave" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">'
        '<path d="M14 18a8 8 0 0 1 12 0"/><path d="M9 13a15 15 0 0 1 22 0"/><path d="M4 8a22 22 0 0 1 32 0"/></svg>')

def bar(brand=True):
    return f'<div class="bar-top"><span class="bl">{e(S["brand"][0])}</span>{e(S["brand"])}</div>'

def sc_scan():
    return (f'<div class="scr s-scan" data-d="4000"><p class="hint">{e(S["scan_hint"])}</p>'
            f'<div class="view"><div class="ins">{QR}</div><i class="br tl"></i><i class="br tr"></i><i class="br bl2"></i><i class="br brr"></i><i class="sl"></i></div>'
            f'<div class="toast">{icon("check")}{e(S["scan_toast"])}</div></div>')

def sc_warranty():
    f = [("Name", S["customer"], ".4s"), ("WhatsApp", "+91 " + S["whatsapp"], "1.2s"), ("Order ID", S["order"], "2s")]
    fields = "".join(f'<div class="fld"><label>{e(l)}</label><div class="in"><span class="typed" style="--td:{d}">{e(v)}</span></div></div>' for l, v, d in f)
    conf = "<i></i>" * 6
    return (f'<div class="scr" data-d="4900">{bar()}<h4>{e(S["warranty_title"])}</h4>'
            f'<div class="prodrow"><span class="prodimg">{icon("box")}</span><span><b>{e(S["product"])}</b><small>Bought on Amazon</small></span></div>'
            f'{fields}<span class="ui-btn press" style="--pd:2.7s">{e(S["warranty_btn"])}</span>'
            f'<div class="done-ov"><div class="confetti">{conf}</div><span class="ck">{icon("check")}</span><b>{e(S["warranty_done"])}</b><small>{e(S["product"])}</small></div></div>')

def sc_guide():
    ch = "".join(f'<div class="chap" style="--cd:{1.4 + i * 1.2}s"><em>{i + 1}</em>{e(c)}</div>' for i, c in enumerate(S["guide_chapters"]))
    return (f'<div class="scr" data-d="5200">{bar()}<h4>{e(S["guide_title"])}</h4>'
            f'<div class="player">{WAVE}{ROUTER}<span class="playbtn">{icon("tri")}</span><span class="ptime">2:14</span><span class="pbar"><i></i></span></div>{ch}</div>')

def sc_request():
    return (f'<div class="scr s-request" data-d="4700"><div class="chat-head"><span class="bl">{e(S["brand"][0])}</span><span>{e(S["brand"])}<small>Business account</small></span></div>'
            f'<span class="daypill">{e(S["request_day"])}</span><div class="typing"><i></i><i></i><i></i></div>'
            f'<div class="bubble">{e(S["request_msg"])}<small>10:42</small></div>'
            f'<div class="qbtns">{"".join(f"<span>{e(b)}</span>" for b in S["request_btns"])}</div></div>')

def sc_rate():
    stars = "".join(STAR.format(c="f" if i < 4 else "", s=f"--sd:{0.6 + i * 0.3}s") for i in range(5))
    chips = "".join(f'<span class="{"l" if i < 3 else ""}" style="--cd:{2 + i * 0.4}s">{e(c)}</span>' for i, c in enumerate(S["rate_chips"]))
    return (f'<div class="scr" data-d="4300">{bar()}<h4>{e(S["rate_title"])}</h4>'
            f'<div class="prodrow"><span class="prodimg">{icon("box")}</span><span><b>{e(S["product"])}</b><small>Your own rating</small></span></div>'
            f'<div class="stars">{stars}</div><p class="rlabel">What stood out?</p><div class="rchips">{chips}</div>'
            f'<span class="ui-btn press" style="--pd:3.5s">Continue</span></div>')

def sc_draft():
    stars = "".join(STAR.format(c="" if i < 4 else "e", s="") for i in range(5))
    return (f'<div class="scr" data-d="5600">{bar()}<h4>{e(S["draft_title"])}</h4>'
            f'<div class="draft"><span class="ai"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6 5.7 1.9-5.7 1.9L12 17l-1.8-5.6-5.7-1.9 5.7-1.9z"/></svg>AI helper</span>'
            f'<div class="mini-stars">{stars}</div><span class="dtext">{e(S["draft"])}</span></div>'
            f'<p class="dnote">{e(S["draft_note"])}</p><span class="ui-btn press" style="--pd:3.5s">{e(S["draft_btn"])}</span>'
            f'<div class="otoast">{e(S["draft_done"])}</div></div>')

SCENES = {"scan": sc_scan, "warranty": sc_warranty, "guide": sc_guide, "request": sc_request, "rate": sc_rate, "draft": sc_draft}

def phone(names, extra=""):
    return f'<div class="phone" data-player{extra}><div class="screen">{"".join(SCENES[n]() for n in names)}</div></div>'

def print_scene():
    return (f'<div class="printscene" data-anim role="img" aria-label="{e(C["media"]["how1"]["brief"])}">'
            f'<div class="ps-win"><div class="wb"><i></i><i></i><i></i></div>'
            f'<div class="ps-row"><span class="ps-qr">{QR}</span><span><b>{e(S["print_title"])}</b><small>9 × 9 cm · print-ready PDF</small></span></div>'
            f'<span class="ui-btn">{e(S["print_btn"])}</span></div>'
            f'<span class="slot"></span><div class="paper">{QR}Scan to register your warranty</div>'
            f'<div class="box"><span class="bd"></span><span class="fp l"></span><span class="fp r"></span><span class="box-tag">✓ {e(S["print_done"])}</span></div></div>')

def dashboard():
    kp = "".join(f'<div><small>{e(k)}</small><b data-count="{v}">{v}</b></div>' for k, v in S["dash_kpis"])
    hs = [30, 42, 38, 55, 48, 62, 58, 70, 66, 78, 74, 88]
    chart = "".join(f'<i style="--h:{h}%;--i:{i}"></i>' for i, h in enumerate(hs))
    feed = "".join(f'<div style="--i:{i}"><i></i>{e(x)}</div>' for i, x in enumerate(S["dash_feed"]))
    return (f'<div class="dash" data-anim role="img" aria-label="{e(C["media"]["feat_dashboard"]["alt"])}">'
            f'<div class="dash-bar"><i></i><i></i><i></i>&nbsp;app.reviewbuddie.com<span>{e(S["dash_note"])}</span></div>'
            f'<div class="dash-b"><div class="kp">{kp}</div><div class="chart">{chart}</div><div class="feed">{feed}</div></div></div>')

def anim(name, label=""):
    if name == "print":
        return print_scene()
    if name == "dashboard":
        return dashboard()
    return f'<div role="img" aria-label="{e(label)}">{phone(name.split(","))}</div>'

# ---------------------------------------------------------------- media helpers (real files win; otherwise the animation plays)
def video_lazy(m):
    track = f'<track kind="captions" src="{e(m["captions"])}" srclang="en" label="English" default>' if m.get("captions") else ""
    poster = f' poster="{e(m["poster"])}"' if m.get("poster") else ""
    return (f'<video data-lazy data-name="{e(m["name"])}" data-webm="{e(m.get("src_webm",""))}" data-mp4="{e(m.get("src_mp4",""))}"'
            f' muted loop playsinline preload="none"{poster} aria-label="{e(m["brief"])}">{track}</video>')

def image(m):
    fallback = m.get("src_webp") or m.get("src_avif")
    avif = f'<source type="image/avif" srcset="{e(m["src_avif"])}">' if m.get("src_avif") else ""
    return (f'<picture>{avif}<source type="image/webp" srcset="{e(fallback)}">'
            f'<img src="{e(fallback)}" width="{m["width"]}" height="{m["height"]}" alt="{e(m["alt"])}" loading="lazy" decoding="async"></picture>')

def has_src(m):
    return any(m.get(k) for k in ("src_webm", "src_mp4", "src_avif", "src_webp"))

def media(key, anim_override=None):
    m = C["media"][key]
    if has_src(m):
        inner = video_lazy(m) if m["type"] == "video" else image(m)
        if m.get("phone"):
            return f'<div class="phone"><div class="screen"><div class="media" style="height:100%;border-radius:0">{inner}</div></div></div>'
        return f'<div class="media" style="--ratio:{"4 / 3" if key == "feat_dashboard" else "16 / 9"}">{inner}</div>'
    return anim(anim_override or m["anim"], m["brief"])

def hero_visual():
    m = C["media"]["hero"]
    if any(m.get(k) for k in ("src_mb_webm", "src_mb_mp4", "src_dt_webm", "src_dt_mp4")):
        track = f'<track kind="captions" src="{e(m["captions"])}" srclang="en" label="English" default>' if m.get("captions") else ""
        return (f'<style>.hero-media .media{{aspect-ratio:{m["ratio_mb"]}}}@media(min-width:1024px){{.hero-media .media{{aspect-ratio:{m["ratio_dt"]}}}}}</style>'
                f'<div class="media"><video id="hero-video" data-name="hero" autoplay muted loop playsinline preload="metadata"'
                f' data-mb-webm="{e(m["src_mb_webm"])}" data-mb-mp4="{e(m["src_mb_mp4"])}" data-dt-webm="{e(m["src_dt_webm"])}" data-dt-mp4="{e(m["src_dt_mp4"])}"'
                f' data-poster-mb="{e(m["poster_mb"])}" data-poster-dt="{e(m["poster_dt"])}" aria-label="{e(m["brief"])}">{track}</video></div>')
    caps = S["captions"]
    floats = [("shield", S["floats"][0]), ("play", S["floats"][1]), ("chat", S["floats"][2])]
    fl = "".join(f'<div class="fl fl{i + 1}" aria-hidden="true"><i>{icon(ic)}</i>{e(t)}</div>' for i, (ic, t) in enumerate(floats))
    return (f'<div class="stage" data-anim>'
            f'<span class="orbit o1" aria-hidden="true"></span><span class="orbit o2" aria-hidden="true"></span>'
            f'<div class="parcel" aria-hidden="true"><span class="body"></span><span class="flap l"></span><span class="flap r"></span><div class="card-in">{QR}Scan me</div></div>'
            f'<div role="img" aria-label="{e(m["brief"])}">{phone(["scan", "warranty", "guide", "request", "rate", "draft"], " data-cap=\"hero-cap\" data-floats=\"1\"")}</div>'
            f'{fl}<div class="cap" id="hero-cap" aria-hidden="true"><b>1</b><span>{e(caps[0])}</span></div>'
            f'<ol class="sr-only">{"".join(f"<li>{e(c)}</li>" for c in caps)}</ol></div>')

# ---------------------------------------------------------------- reusable bits
def split(text, grad_from=None):
    """Wrap each word for the mask reveal. Words from grad_from onward get the moving gradient."""
    words = text.split(" ")
    g = len(words) + 1
    if grad_from and grad_from in text:
        g = len(text[:text.index(grad_from)].split(" ")) - 1
    return " ".join(f'<span class="w"><span class="{"grad" if i >= g else ""}" style="--wi:{i}">{e(w)}</span></span>' for i, w in enumerate(words))

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

def head(eyebrow, h2, hid, sub=None, center=False):
    s = f'<p class="sub">{e(sub)}</p>' if sub else ""
    return (f'<div class="head{" head--center" if center else ""}"><p class="eyebrow">{e(eyebrow)}</p>'
            f'<h2 id="{hid}" class="split" data-split>{split(h2)}</h2>{s}</div>')

AURORA = '<div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div>'
GRID = '<div class="gridlines" aria-hidden="true"></div>'

# ---------------------------------------------------------------- sections
h, p, pk, hw, ft, tr, sm, ca, fq, fn, fo, fm = (C[k] for k in
    ("hero", "problem", "pick", "how", "features", "trust", "samples", "calc", "faq", "final", "footer", "form"))

nav_d = "".join(f'<a href="{e(l["href"])}">{e(l["label"])}</a>' for l in C["nav"]["links"])
nav_m = "".join(f'<a class="m-link" href="{e(l["href"])}">{e(l["label"])}</a>' for l in C["nav"]["links"])

header = f'''
<div class="progress-top" aria-hidden="true"></div>
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
<section class="hero" aria-labelledby="h1" data-anim>
  {AURORA}{GRID}
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <p class="chip-ey"><i aria-hidden="true"></i>{e(h["eyebrow"])}</p>
      <h1 id="h1" class="split" data-split>{split(h["h1"], "Fix the reason")}</h1>
      <p class="sub">{e(h["sub"])}</p>
      <div class="cta-row" id="hero-cta">
        <div class="hero-actions">{cta_primary("hero_cta_click")}{wa_link("hero")}</div>
        <p class="reassure">{e(C["cta"]["reassure"])}</p>
      </div>
    </div>
    <div class="hero-media">{hero_visual()}</div>
  </div>
</section>'''

strip_items = "".join(f"<li>{e(x)}</li>" for x in C["strip"]["items"])
rev_items = "".join(f"<li>{e(x)}</li>" for x in [n["title"] for n in hw["flow"]])
strip = f'''
<div class="strip" data-anim>
  <p>{e(C["strip"]["label"])} {e(", ".join(C["strip"]["items"]))}</p>
  <div class="marquee" aria-hidden="true"><ul>{strip_items * 4}{strip_items * 4}</ul></div>
  <div class="marquee rev" aria-hidden="true"><ul>{rev_items * 3}{rev_items * 3}</ul></div>
</div>'''

RV = {17, 46, 71}
parcels = "".join(f'<i class="{"rv" if i in RV else ""}" style="--i:{i}"></i>' for i in range(p["delivered"]))
reasons = "".join(f'<div class="reason"><span class="ic">{icon(r["icon"])}</span><h3>{e(r["title"])}</h3><p>{e(r["body"])}</p></div>' for r in p["reasons"])
problem = f'''
<section class="section section--light" aria-labelledby="problem-h">
  <div class="wrap">
    <div class="prob-grid">
      <div data-reveal>
        <div class="parcels" data-anim role="img" aria-label="{p["delivered"]} parcel squares, only {p["reviews"]} of them light up">{parcels}</div>
        <div class="pcount">
          <div><b data-count="{p["delivered"]}" data-dur="1800">{p["delivered"]}</b><span>{e(p["delivered_label"])}</span></div>
          <div class="rv"><b data-count="{p["reviews"]}" data-dur="1800">{p["reviews"]}</b><span>{e(p["reviews_label"])}</span></div>
        </div>
        <p class="pnote">{e(p["counter_note"])}</p>
      </div>
      {head(p["eyebrow"], p["h2"], "problem-h", p["sub"])}
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
    f'<span class="mk" aria-hidden="true">{e(it["label"])}</span>'
    f'<h3>{e(it["title"])}</h3><p>{e(it["body"])}</p><ul>{checklist(it["points"])}</ul>'
    f'{cta_primary("hero_cta_click", "btn btn--primary btn--block", extra=market_attr(it))}</div>'
    for it in pk["items"])
pick = f'''
<section class="section section--dark" aria-labelledby="pick-h" data-anim>
  {AURORA}
  <div class="wrap">
    {head(pk["eyebrow"], pk["h2"], "pick-h", pk["sub"])}
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
    {head(hw["eyebrow"], hw["h2"], "how-h", hw["sub"])}
    <ol class="steps">{steps}<li class="progress" aria-hidden="true">{progress}</li></ol>
    <div class="flow" id="flow" data-anim>
      <h3>{e(hw["flow_title"])}</h3>
      <div class="flow-track"><span class="flow-line" aria-hidden="true"><b></b><i class="dot"></i></span><ol>{flow}</ol></div>
    </div>
    {cta_block("hero_cta_click", "how")}
  </div>
</section>'''

cards = "".join(
    f'<article class="card"><div class="visual">{media(c["media"], c.get("anim"))}</div><h3>{e(c["title"])}</h3><p>{e(c["body"])}</p></article>'
    for c in ft["cards"])
arrows = (f'<div class="arrows"><button type="button" data-prev aria-label="Previous">{icon("left")}</button>'
          f'<button type="button" data-next aria-label="Next">{icon("right")}</button></div>')
features = f'''
<section class="section section--dark" id="features" aria-labelledby="feat-h" data-anim>
  {GRID}
  <div class="wrap">
    {head(ft["eyebrow"], ft["h2"], "feat-h", ft["sub"])}
    <div data-swipe>
      <div class="swipe" tabindex="0" aria-label="Features, swipe sideways">{cards}</div>
      <div class="swipe-ui"><div class="dots"></div><span class="swipe-hint">{e(ft["swipe_hint"])}{icon("right")}</span>{arrows}</div>
    </div>
    {cta_block("hero_cta_click", "features")}
  </div>
</section>'''

fm_ = C["media"]["founder"]
founder_visual = media("founder") if has_src(fm_) else '<div class="mono" aria-hidden="true"><span>Founder photo here</span></div>'
seats = "".join(f'<i style="--i:{i}"></i>' for i in range(cfg["FOUNDING_SPOTS"]))
trust = f'''
<section class="section section--light" aria-labelledby="trust-h">
  <div class="wrap">
    {head(tr["eyebrow"], tr["h2"], "trust-h")}
    <div class="trust" data-reveal>
      <figure class="founder">
        {founder_visual}
        <div style="display:grid;gap:14px">
          <blockquote>“{e(tr["founder_quote"])}”</blockquote>
          <p>{e(tr["founder_body"])}</p>
          <figcaption><b>{e(tr["founder_name"])}</b><span>{e(tr["founder_role"])}</span></figcaption>
          {'<p class="ph-note">Placeholder: add the founder name and photo before launch.</p>' if "[" in tr["founder_name"] else ""}
        </div>
      </figure>
      <div class="promise"><span class="shield" aria-hidden="true"><i></i><i></i><i></i>{icon("shield")}</span><h3>{e(tr["compliance_title"])}</h3><ul>{checklist(tr["compliance_points"])}</ul></div>
      <div class="founding">
        <div class="seats" data-anim aria-hidden="true">{seats}</div>
        <span class="seat-l">{cfg["FOUNDING_SPOTS"]} founding spots</span>
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
    <div class="head">
      <div class="sample-head"><h2 id="samples-h">{e(sm["header"])}</h2><span class="badge-sample">{e(sm["badge"])}</span></div>
      <p class="sub">{e(sm["note"])}</p>
    </div>
    <div data-swipe>
      <div class="swipe" tabindex="0" aria-label="Sample reviews, swipe sideways">{sample_cards}</div>
      <div class="swipe-ui"><div class="dots"></div>{arrows}</div>
    </div>
  </div>
</section>''' if show_samples else ""

people = "".join("<i></i>" for _ in range(100))
calc = f'''
<section class="section section--white" id="calculator" aria-labelledby="calc-h">
  <div class="wrap">
    {head(ca["eyebrow"], ca["h2"], "calc-h", ca["sub"])}
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
        <div class="people" id="people" aria-hidden="true">{people}</div>
        <div class="people-l" aria-hidden="true"><span class="b"><i></i>Left a review</span><span><i></i>Stayed silent</span></div>
      </div>
      <div class="calc-out" aria-live="polite">
        <div class="big" id="c-silent">{p["delivered"] - p["reviews"]}</div>
        <p>{e(ca["result_label"])}</p>
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
    f'<details><summary><span>{e(q["q"])}</span><span class="pl">{icon("plus")}</span></summary><div class="ans"><p>{e(q["a"])}</p></div></details>'
    for q in fq["items"])
faq = f'''
<section class="section section--light" id="faq" aria-labelledby="faq-h">
  <div class="wrap">
    {head(fq["eyebrow"], fq["h2"], "faq-h")}
    <div class="faq" data-reveal>{faq_items}</div>
    {cta_block("hero_cta_click", "faq", reassure=False)}
  </div>
</section>'''

floaties = "".join(f'<span>{icon(n)}</span>' for n in ("qr", "shield", "play", "chat"))
final = f'''
<section class="section section--dark final" id="final" aria-labelledby="final-h" data-anim>
  {AURORA}<div class="floaties" aria-hidden="true">{floaties}</div>
  <div class="wrap">
    <h2 id="final-h" class="split" data-split>{split(fn["h2"], "chance")}</h2>
    <p class="hinglish grad" lang="hi-Latn">{e(fn["hinglish"])}</p>
    <div class="cta-row cta-row--center" data-reveal>{cta_primary("hero_cta_click")}{wa_link("final")}<p class="reassure">{e(C["cta"]["reassure"])}</p></div>
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
<meta name="theme-color" content="#070D1C">
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
