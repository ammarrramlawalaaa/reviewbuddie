# ReviewBuddie landing page

Static, dependency-free landing page for reviewbuddie.com. Mobile-first, with a separate desktop layout for every section.

```
index.html            page markup and copy
assets/styles.css     all styling (mobile first; desktop rules under @media (min-width:1000px))
assets/app.js         hero demo player, feature-group hotspot engine, 3D box scroll story, counters, nav
assets/shots/         real product screens (WebP) used by the hero and feature sections
assets/logo-*.png     brand wordmarks (dark for light backgrounds, light for dark backgrounds)
og-image.png          social share image
```

Open `index.html` in a browser; no build step.

## Page structure

1. **Hero** – headline with floating product chips around it, the "video" (a coded demo that walks a real customer screen through scan → rate → AI draft → claim while live notifications land on a real Claim Center screen), CTA, trust line.
2. **Marketplace marquee + stats**
3. **How it works** – scroll-driven 3D box: flaps open, the QR insert rises, a phone scans it, result chips appear.
4. **Feature groups** (one section per CSV group, each with real screens and animated hotspots):
   01 Core flow · 02 Smart Funnel (customer) · 03 Dashboard & analytics · 04 Claims & customers · 05 Pages · 06 Team · 07 Growth & partners · 08 Compliance (+ free tools)
5. **Testimonials, pricing, FAQ, final CTA, footer**

On desktop a feature group shows the real screen in a browser frame with a moving cursor and hotspot callouts. On phones the same screenshot is zoomed and the "camera" pans to each hotspot, with the callout as a caption. Groups auto-advance; clicking a feature stops auto-play.

## Before launch

- `assets/app.js` → `CONFIG`: set `SIGNUP_URL`, `LOGIN_URL`, `DEMO_URL`.
- Real hero video (optional): set `data-video="media/hero.mp4"` on `#stage` in `index.html`; the coded demo is skipped automatically.
- Replace screens: drop new files into `assets/shots/` with the same names (desktop screens 1600×1000, phone screens 540×1169). Hotspot positions live in each `<figure data-spots>` as `[x%, y%, "label", warn?]`.
- Analytics: every CTA pushes `{event:"cta_click", id}` to `window.dataLayer`; feature tab clicks push `feature_tab`.

## Notes

- Fonts: Plus Jakarta Sans (text) and Sora (display) from Google Fonts. Self-host both for production.
- Reduced motion: all animations stop, the box story becomes a static stacked list and hotspots show at once.
- Total image weight ≈ 1.5 MB, all lazy-loaded except the first hero screen.
