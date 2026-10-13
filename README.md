# ReviewBuddie landing page

Mobile-first, single-page marketing site for reviewbuddie.com.

## Editing copy

All page copy, links and settings live in **`content.json`**. Edit it, then rebuild:

```bash
python3 build.py                  # production -> index.html
python3 build.py --show-samples   # layout preview with sample reviews -> preview.html (git-ignored)
```

`build.py` bakes the copy into plain static HTML (no client-side rendering), so search engines and AI answer engines can read every line.

## Before launch

In `content.json`:

- `config.WHATSAPP_NUMBER`: real number (format `91XXXXXXXXXX`)
- `config.FORM_ENDPOINT` / `CALC_LEAD_ENDPOINT`: where the early-access form and calculator leads POST (JSON)
- `config.GA4_ID`: analytics ID (loads only after cookie consent)
- `trust.founder_name`: replace `[FOUNDER NAME]`
- `config.SHOW_SAMPLE_REVIEWS`: keep `false` until you have real, permissioned seller testimonials

## Media

Every video and image is a labelled placeholder until you fill its paths under `media` in `content.json`. The brief and spec for each one are written inside its placeholder box.

| Key | Use | Spec |
| --- | --- | --- |
| `hero` | Hero loop | Mobile 4:5 + desktop 16:9, 8–10s, ≤1MB, WebM + MP4, poster each |
| `how1`, `how2`, `how3` | How it works (phone frame) | 9:16, 6–8s, ≤600KB |
| `feat_education`, `feat_dashboard` | Feature cards | AVIF + WebP |
| `founder` | Founder photo | 1:1 AVIF + WebP |

Feature cards reuse `how2` and `how3`, so the page stays at 5 video files. Add a `.vtt` captions path for each video.

## Tracking events

Pushed to `window.dataLayer`: `hero_cta_click`, `whatsapp_click`, `sticky_bar_click`, `form_submit`, `marketplace_chip_select`, `video_play`, `calculator_used`, `calculator_lead_submit`, `faq_open`, `sample_reviews_viewed`.

## Performance notes

- Only GSAP + ScrollTrigger (deferred, from cdnjs). For production, self-host both files and the Poppins font (400 and 500 only) on your domain.
- Videos lazy-load at 30% visibility and pause off-screen. With reduced motion, nothing autoplays and the pinned section becomes a normal stacked list.
