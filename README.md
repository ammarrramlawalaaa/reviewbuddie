# ReviewBuddie landing page

Static, dependency-free landing page for reviewbuddie.com. Mobile-first, with a separate desktop layout for every section.

```
index.html            page markup and copy
assets/styles.css     all styling (mobile first; desktop rules under @media (min-width:1000px))
assets/app.js         hero demo player, section demos (loops, builders, calculator), 3D box scroll story, counters, nav
assets/shots/         real product screens (WebP) used by the hero and feature sections
assets/logo-*.png     brand wordmarks (dark for light backgrounds, light for dark backgrounds)
og-image.png          social share image
```

Open `index.html` in a browser; no build step.

## Page structure

1. **Hero** – headline, the "video" (a coded demo that walks a real customer screen through scan → rate → AI draft → claim while live notifications land on a real Claim Center screen), CTA, trust line. On desktop four product chips float beside the headline; on phones they are hidden so nothing sits behind the text.
2. **Marketplace marquee + stats**
3. **How it works** – scroll-driven 3D box: flaps open, the QR insert (a real QR for reviewbuddie.com) rises, a phone scans it, result chips appear.
4. **Feature sections**, each in its own format so nothing repeats:
   - 01 Core flow – one panel screen plays each step (paste link → product fills in, reward cards fan out and one flips into a branded claim card, product + reward click together and a QR insert prints, link copied into WhatsApp / email / Instagram) while the step list beside it lights up in sync; click a step to jump to it
   - 02 Smart Funnel – spotlight carousel of the five real customer screens: the active phone sits centre stage, taps its main button, then dims and slides aside as the next one moves in; prev/next arrows, step pills, pause/play, swipe on phones
   - 03 Dashboard & analytics – live widgets (counters, animated drop-off funnel with a flagged step, setup checklist ticking) beside the real analytics screen
   - 04 Claims & customers – three coded loops: claim cards selected and delivered with one amber duplicate left behind, anonymous buyers turning into named contacts, a ticket resolved before it becomes a 1-star review
   - 05 Pages – two interactive builders: Brand Hub section toggles with a live phone preview, and an ad page with coupon unlock, countdown and offer switch
   - 06 Team – a living task board (statuses change, one task goes overdue and the bell pings) synced with an SOP checklist
   - 07 Growth & partners – referral card and a partner commission calculator (20 / 25 / 30% tiers)
   - 08 Compliance – same reward for a 5★ and a 2★ review, four rule cards, the low-rating support screen, free tools
5. **Testimonials, pricing, FAQ, final CTA, footer**

Design rules: blue is the only decorative accent; green = done, coral = warning, amber = flagged, violet = AI. No background patterns, one idea per section.

## Before launch

- `assets/app.js` → `CONFIG`: set `SIGNUP_URL`, `LOGIN_URL`, `DEMO_URL`.
- Real hero video (optional): set `data-video="media/hero.mp4"` on `#stage` in `index.html`; the coded demo is skipped automatically.
- Replace screens: drop new files into `assets/shots/` with the same names (desktop screens 1600×1000, phone screens 540×1169).
- The QR code is an inline SVG `<symbol id="qr">` at the top of `index.html` (encodes https://reviewbuddie.com). Regenerate it if the link changes.
- Analytics: every CTA pushes `{event:"cta_click", id}` to `window.dataLayer`; the interactive demos push `hub_toggle` and `ad_demo_unlock`.

## Notes

- Fonts: Plus Jakarta Sans (text) and Sora (display) from Google Fonts. Self-host both for production.
- Reduced motion: all animations stop, the box story becomes a static stacked list and every demo shows its finished state.
- Total image weight ≈ 1.5 MB, all lazy-loaded except the first hero screen.
