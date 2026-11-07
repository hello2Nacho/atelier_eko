# Atelier Eko — "Try the Look" · DESIGN.md

> Concept project by HiNacho. Fictional Lagos streetwear brand. No real orders.

## Assumptions
- Audience: style-led 20–35s, Lagos + diaspora; premium (not luxury) price point, USD.
- Primary conversion: **Add full look to bag** (bundle −15%). Secondary: single items.
- Assets: 6 looks × (front + back) model shots, 18 product packshots, all on light grey. No lifestyle photography, so the "Made in Lagos" section is built from type and cutouts, with no stock imagery.
- Reference video: off-white stage, 6 models in a row with long soft floor shadows, neighbours blurred, a right-hand item panel with a black CTA. We match that calm and add the turn, hotspots and commerce layer.
- Look 06 sneakers show an "N"-style side mark that reads as a real brand. Named generically here; swap the image before any public showing.

---

# Creative direction
**Concept line:** Walk the line, pick the look.
**Hero object:** the lineup of six models on a white stage. Everything (panel, prices, lookbook, product grid) orbits whichever model is in focus.
**Mood words:** calm · tailored · sun-warm

## Palette
| Token | Hex | Use |
|---|---|---|
| `--canvas` | `#F7F5F1` | page + stage (warm white, like the reference) |
| `--canvas-alt` | `#EFECE6` | cards, lookbook tiles, stage floor gradient end |
| `--ink` | `#121212` | text, **primary buttons** (black, per brief) |
| `--ink-soft` | `#6B6760` | secondary text, mono labels |
| `--line` | `#DDD8CF` | hairlines, chips |
| `--accent-hot` | `#C4512E` | Lagos terracotta, **action signals only**: hotspot dots, progress line, active chip, bag count, "Save 15%" badge |
| `--accent-cool` | `#4F6B3A` | moss, **emphasis only**: one italic word per headline ("*Look.*"), check icons |
| `--surface-dark` | `#1A1714` | Made in Lagos section, footer |

The primary CTA stays black as the brief specifies. Terracotta never fills a large surface.

## Type
- **Display:** Fraunces (variable, opsz 144, weight 380–450, `SOFT 50`), tracking −0.03em, leading 0.95. Used for "Try the Look.", section heads and the wordmark.
- **Wordmark:** "ATELIER EKO" in Fraunces 500, 15px, tracking 0.32em.
- **UI/body:** Manrope 400/500/600, 13–16px.
- **Mono:** JetBrains Mono 400/500, 10.5–12px, uppercase, tracking 0.12em, for categories, counters ("03 / 06"), the "SS27 Lookbook · 06 looks" subline and prices in the panel.

Scale: hero `clamp(2.75rem, 5.2vw, 5.5rem)` · h2 `clamp(2.25rem, 4.5vw, 4.5rem)` · body 15px · mono 11px.

---

## 1. Layout: hero / "Try the Look" (desktop, 100svh, no scroll needed)
```
┌────────────────────────────────────────────────────────────────────────────┐
│ ATELIER EKO                              Shop  Lookbook  About      Bag (2)│  72px top bar
├──────────────────────────────────────────────────────┬─────────────────────┤
│ Try the *Look.*                                      │ IN THIS LOOK  03/06 │
│ SS27 LOOKBOOK · 06 LOOKS                             │ ┌──┐ TOP            │
│                                                      │ │▓▓│ Zip Hoodie   + │
│     ░    ░    ▓▓   ░    ░    ░                       │ └──┘ Ecru · $125    │
│    ░░   ░░   ▓▓▓▓ ░░   ░░   ░░    ← lineup (≈70%)    │      [S][M][L][XL]  │
│     ░    ░    ▓▓   ░    ░    ░                       │ … BOTTOM, FOOTWEAR  │
│  ══════ soft floor gradient + contact shadows ══════ │ COMPLETE THE LOOK   │
│                                                      │ $̶4̶4̶8̶  $380  SAVE 15% │
│ ←  →   ━━━━━━━━──────────────  Look 03              │ [Add full look to bag →]
└──────────────────────────────────────────────────────┴─────────────────────┘
```
- Grid: `minmax(0,1fr) 400px` at ≥1280; 360px panel at 1024–1279.
- Lineup: 6 equal slots across the stage; model height ≈ 68svh; feet share one floor line (images pre-aligned, see Assets).
- Stage: canvas → canvas-alt radial floor ellipse under the lineup; each model has a blurred elliptical **contact shadow** plus a faint skewed **cast shadow** to the right, as in the reference.
- Bottom-left: round prev/next buttons (44px), 1px progress track with a terracotta fill (`scaleX = (i+1)/6`) and the current look label.
- Panel: white card, 1px hairline left border, scrolls internally if needed (short laptop heights).

## 2. Focus interaction (the signature)
**Selection**
- `pointermove` over the stage → x mapped to the nearest slot centre. A **hysteresis** band (the cursor must pass 18% into the neighbour's slot) plus a **90ms settle debounce** means focus never flickers at slot borders or on fast sweeps; the lineup visual updates live, but the panel only commits after the settle.
- Keys: ← → (wrap off, clamped at 1 and 6), Home/End, 1–6. Prev/next buttons do the same. The stage is a focusable `role="listbox"`; each model is a `role="option"` with `aria-selected`.
- Leaving the stage keeps the last focus (no reset).

**States** (GSAP `quickTo`, `power3.out`, 0.6s)
| | scale | opacity | blur | z |
|---|---|---|---|---|
| focused | 1.08 | 1 | 0 | 10 |
| ±1 | 0.94 | 0.45 | 6px | 5 |
| ±2 | 0.90 | 0.28 | 8px | 3 |
| ±3+ | 0.88 | 0.18 | 10px | 1 |
Focused shadow grows darker and tighter (opacity 0.38 → 0.55, scaleX 1.15).

**Camera dolly:** lineup container `x = -(cursorX − 0.5) · 36px`, `y = -(cursorY − 0.5) · 10px`, lerped at 0.06 per frame. Removed under reduced motion.

**Custom cursor** (fine pointers only): 10px ink dot, lerped. Over the focused model it grows to 64px, `mix-blend: normal`, white fill with ink text "View" (or "Turn" after the first turn). Over hotspots it shrinks to 18px ring. Native cursor hidden only inside the stage.

**Turn:** click/tap the focused model, press Enter/Space, or use the "Turn ↻" pill under the panel counter:
`scaleX 1 → 0.06 (0.16s, power2.in)` · swap src (front ⇄ back, preloaded) · `scaleX 0.06 → 1 (0.22s, back.out(1.6))` with a small `scaleY 0.98 → 1` squash. Hotspots hide during and while showing the back. Reduced motion: 0.2s crossfade.

**Hotspots:** 3 dots per focused model (top, bottom, footwear), 12px terracotta core + pulsing ring (CSS keyframes, scale 1 → 2.4, fade). Hit area 44px. Hover/focus on a dot → its card highlights (bg `canvas-alt`, thumbnail scale 1.04) and vice versa (card hover → dot enlarges + label tooltip "Top · Zip Hoodie"). Clicking a dot scrolls the panel to the card and focuses its size chips.

**Panel update on committed focus change:**
- Outgoing cards: `y −8, opacity 0`, 0.22s, stagger 0.06.
- Incoming: `y 12 → 0, opacity 0 → 1`, 0.45s `power3.out`, stagger 0.06.
- Counter "03 / 06": digit roll (vertical translate of a 0–9 column, 0.5s).
- Prices and bundle total: number roll via tweened value, 0.6s, formatted `$0`.
- Rapid changes kill in-flight tweens (`overwrite: "auto"`), so the panel never stacks or lags.

## 3. Commerce
- **Item add:** size chip required. Pressing "+" with no size → card shakes (x ±6, 3 cycles, 0.35s) and "Select a size" appears in terracotta mono under the chips (`aria-live="polite"`). With a size: "+" morphs into a ✓ for 1.2s, bag count bumps.
- **Add full look:** adds the 3 items as one **bundle line** at −15%, using the chips currently selected in the panel, else defaults **M / 32 / EU 43**. Defaults are pre-selected (outlined) under "Complete the look" so they're visible and editable before adding.
- **Bag drawer** (right, 440px; full-screen sheet on mobile): bundle lines (with their 3 pieces listed) and single items, qty steppers, remove, subtotal, "Bundle savings −$X" in moss, total, black "Checkout" → modal: "Concept project by HiNacho — no real orders. Thanks for walking the line." Focus trapped, Esc closes, focus returns to the opener.
- **Toast:** bottom-centre pill, ink bg, "Look 03 added to your bag" + "View bag" link, 3s, `role="status"`.
- Bag state in React context + `localStorage` (try/catch), so it survives reloads.

## 4. Below the fold (storyboard)
1. **Try the Look (hero)** — pattern: Variant Lineup, adapted. Above.
2. **Lookbook** — Editorial grid (orbit pattern: Proof Gallery as an asymmetric grid). Eyebrow "SS27 Lookbook", headline "Six ways to / wear *the city.*". 6 tall tiles on `canvas-alt` with varied widths (7/5, 4/4/4, 5/7 cols), each a large model cutout breaking the tile's top edge (boundary-break), captions in mono: "LOOK 03 — Ecru zip hoodie, charcoal cargo, bone runner". Clip-path reveal on enter, cutouts drift on parallax. Click → scrolls up and focuses that look in the lineup.
3. **The pieces** — product grid, 4 cols desktop / 2 mobile. Filter pills: All · Tops · Bottoms · Footwear (active = ink fill), GSAP Flip on filter change. Card: packshot on canvas-alt, name, colour, price, quick-add (size popover).
4. **Made in Lagos** — dark surface. Giant Fraunces "Made in / *Lagos.*" with the Look 04 cutout standing *between* the letters (orbit Recipe B: front/back copies). Short text (≤30 words, placeholder) and 3 values: **Cut in Yaba** · **Small runs, no waste** · **Built for heat**, each with a moss check and one placeholder line.
5. **Newsletter** — centred: "First look at / *SS28.*" + one joined pill (input + black button "Join"). Fake submit → inline thanks, no data sent.
6. **Footer** — dark, 4 small columns (Shop, Help, Studio, Social), wordmark, "© 2026 Atelier Eko · Concept project by HiNacho".

Background rhythm: warm white (stage) → white (lookbook) → warm white (pieces) → dark (Lagos) → warm white (newsletter) → dark footer.

## 5. Mobile (≤767px; tablet 768–1023 uses a narrower lineup of 5 visible plus a bottom sheet)
- Stage: one model at a time, ~74svh tall, centred; neighbours peek ±38vw at 0.9 scale, 6px blur, 40% opacity. Horizontal swipe (pointer events, 40px or velocity threshold) snaps to the next look; a scroll-snap fallback stays accessible.
- Heading compresses to one line above the stage; arrows + progress sit under the stage.
- **Bottom sheet:** collapsed 76px bar: "Look 03 · 3 pieces · $380  [Add look]". Drag up or tap → expands to 82svh with the full item list, sizes and bundle. Drag handle, Esc/backdrop to close.
- Tap model = turn; hotspots tappable (44px targets); no custom cursor, no dolly.

## 6. Motion system
GSAP 3 + ScrollTrigger + Flip, `@gsap/react` `useGSAP`, Lenis for page scroll (disabled while the drawer/sheet is open). `gsap.matchMedia()` for full (≥1024), simplified (<1024) and reduced motion. Only transform / opacity / filter / clip-path animate. Blur is applied to each model's `<img>` (GPU layer via `will-change: transform, filter` only on the 3 nearest).
**Reduced motion:** no dolly, no parallax, no turn squash (crossfade instead), no number roll (instant), panel crossfade only, no Lenis.

## 7. Product data (for approval) — `src/content/looks.ts`
Bundle = sum − 15%, rounded to the dollar.

| Look | Category | Name | Colour | Price | Sizes |
|---|---|---|---|---|---|
| **01** | TOP | Heavyweight Boxy Tee | Onyx Black | $58 | XS–XXL |
| | BOTTOM | Barrel Leg Jean | Bleach Wash | $128 | 28–36 |
| | FOOTWEAR | Court Low Sneaker | Smoke / White | $165 | EU 39–46 |
| | | | | **$351 → $298** | |
| **02** | TOP | Lambswool Crew Knit | Burnt Sienna | $135 | XS–XXL |
| | BOTTOM | Pleated Wide Trouser | Graphite | $145 | 28–36 |
| | FOOTWEAR | Ikoyi Penny Loafer | Black Leather | $210 | EU 39–46 |
| | | | | **$490 → $417** | |
| **03** | TOP | Heavyweight Zip Hoodie | Ecru | $125 | XS–XXL |
| | BOTTOM | Wide Cargo Pant | Charcoal | $138 | 28–36 |
| | FOOTWEAR | Chunky Runner | Bone White | $185 | EU 39–46 |
| | | | | **$448 → $381** | |
| **04** | TOP | Brushed Wool Crew | Moss | $130 | XS–XXL |
| | BOTTOM | Pleated Wide Chino | Cocoa | $118 | 28–36 |
| | FOOTWEAR | Suede Court Sneaker | Tan | $175 | EU 39–46 |
| | | | | **$423 → $360** | |
| **05** | TOP | Ìrọ̀lẹ́ Sunset Graphic Tee | Washed Black | $62 | XS–XXL |
| | BOTTOM | Barrel Leg Jean | Light Vintage | $128 | 28–36 |
| | FOOTWEAR | Canvas High-Top | Black / Ecru | $140 | EU 39–46 |
| | | | | **$330 → $281** | |
| **06** | TOP | Fleece Pullover Hoodie | Heather Grey | $115 | XS–XXL |
| | BOTTOM | Straight Leg Jean | Mid Indigo | $122 | 28–36 |
| | FOOTWEAR | Heritage Runner | Grey Suede | $195 | EU 39–46 |
| | | | | **$432 → $367** | |

("Ìrọ̀lẹ́" is Yoruba for "evening", a nod to the sunset print.)
Default sizes: M / 32 / EU 43. Hotspot positions (% of the aligned 800×1600 canvas) are measured per model after the cutouts (roughly top 50/32, bottom 50/62, shoes 45/96) and stored in `looks.ts`.

Screen-reader label per model: "Look 3 of 6: ecru zip hoodie, charcoal cargo pants, bone white chunky runners". Generated from the data, lower-cased.

## 8. Assets
- `public/media/models/look-N-{front|back}.{webp,png}` — 800×1600 transparent, floor line at y=1560, shared scale; `-sm.webp` 400×800 for the lineup at small sizes.
- `public/media/products/look-N-{top|bottom|shoes}.{webp,png}` — 800×800 transparent, centred with 6% padding; `-sm.webp` 320px for panel thumbnails.
- Loading: focused + adjacent models `fetchpriority="high"` / preload; others `loading="lazy"`; back views preloaded on idle. Target LCP < 2.5s (LCP = focused model, ≈60KB WebP).

## 9. Stack
React 18 + Vite + TypeScript + Tailwind v4 + GSAP 3.12 (+ Flip, ScrollTrigger, `@gsap/react`) + Lenis. Fonts via Google Fonts (`display=swap`, preconnect). All copy in `src/content/site.ts`, all product data in `src/content/looks.ts`.

## 10. QA plan
Screenshots at 1440 / 1024 / 768 / 390. Focus logic at both edges (1 and 6), rapid sweeps (no panel flicker, no stacked tweens), keyboard-only pass (Tab order: nav → stage → hotspots → panel → arrows), screen-reader labels, reduced motion, no horizontal overflow, tap targets ≥ 44px. Local + network URLs reported. No git commit/push.
