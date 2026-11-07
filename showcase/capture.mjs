// Deterministic capture of the live site for the showcase videos.
// Playwright's fake clock advances page time exactly 1/30 s per frame, so GSAP, Lenis and
// (via syncAnims) CSS animations all play at true speed and every frame is unique.
// A scripted "visitor" hovers the lineup, turns a model, adds a look, then scrolls the page;
// desktop and mobile follow the same timeline so both devices show the same section at once.
//
// Usage: node showcase/capture.mjs <out-dir> [--mobile]   (dev server on :5173)
import { chromium } from "playwright-core";
import fs from "node:fs";

const OUT = process.argv[2];
const MOBILE = process.argv.includes("--mobile");
const URL = "http://localhost:5173/";
const VP = MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const FPS = 30;
export const DUR = 27;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({
  viewport: VP,
  deviceScaleFactor: 2,
  ...(MOBILE ? { isMobile: true, hasTouch: true } : {}),
});
const page = await ctx.newPage();

// Warm the HTTP cache (fonts, all model + product images) with a normal visit
await page.goto(URL, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const H0 = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < H0; y += 500) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(80); }
await page.waitForTimeout(1500); // back views preload on idle

// Clean take under the fake clock
await page.clock.install();
await page.goto(URL, { waitUntil: "load" });
await page.addStyleTag({ content: "html{scrollbar-width:none} ::-webkit-scrollbar{display:none}" });
await page.evaluate(() => document.fonts.ready);

// Overlay: a macOS arrow (desktop, outside the stage, where the site's own cursor takes over)
// or a touch ripple (mobile). Driven by the faked clock, so it is deterministic too.
await page.addScriptTag({
  content: `(() => {
    const mobile = ${MOBILE};
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;left:0;top:0;z-index:99999;pointer-events:none;will-change:transform";
    el.innerHTML = mobile
      ? '<div style="width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(18,18,18,.16);border:2px solid rgba(255,255,255,.95);box-shadow:0 2px 10px rgba(0,0,0,.18)"></div>'
      : '<svg width="22" height="30" viewBox="0 0 22 30" style="display:block;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.35))"><path d="M2 2v22l5.6-5.2 3.6 8.4 3.6-1.6-3.5-8.2H19z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(el);
    let x = -100, y = -100, down = false, fade = 0, lastUp = -1e9;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, true);
    addEventListener("mousedown", () => { down = true; }, true);
    addEventListener("mouseup", () => { down = false; lastUp = performance.now(); }, true);
    window.__cursorTick = () => {
      el.style.transform = "translate(" + x + "px," + y + "px)";
      if (mobile) {
        const a = down ? 1 : Math.max(0, 1 - (performance.now() - lastUp) / 260);
        const s = down ? 1 : 1 + (1 - a) * 0.4;
        el.firstChild.style.opacity = a;
        el.firstChild.style.transform = "scale(" + s + ")";
      } else {
        const hit = document.elementFromPoint(x, y);
        el.style.opacity = hit && hit.closest(".stage") ? 0 : 1;
      }
    };
    // CSS animations/transitions run on real time; pin them to the fake clock instead
    const starts = new WeakMap();
    window.__syncAnims = () => {
      const now = performance.now();
      for (const a of document.getAnimations()) {
        if (a.constructor.name === "Animation") continue; // Web Animations from GSAP etc. are already JS-timed
        if (!starts.has(a)) { starts.set(a, now); a.pause(); }
        a.currentTime = now - starts.get(a);
      }
    };
  })();`,
});

// ---------- geometry helpers (resolved live, so they follow the dolly, scale and scroll) ----------
const rect = (sel) => page.evaluate((sel) => {
  const r = document.querySelector(sel)?.getBoundingClientRect();
  return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
}, sel);
const modelPt = async (i, fy = 0.5) => {
  const r = await rect(`.model[data-model="${i}"] .model-hit`);
  return { x: r.x + r.w / 2, y: r.y + r.h * fy };
};
const centerOf = async (sel) => { const r = await rect(sel); return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };
const buttonByText = (scope, text) => page.evaluate(([scope, text]) => {
  const b = [...document.querySelectorAll(`${scope} button`)].find((b) => b.textContent.trim().startsWith(text));
  const r = b.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}, [scope, text]);

// ---------- scroll stops (same sections on both devices) ----------
// Resolved when each move starts: the Footwear filter click shrinks the product grid,
// so stops further down can't be measured up front.
const stop = (name) => () => page.evaluate((name) => {
  const top = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
  const vh = innerHeight;
  if (name === "lookbook") return top("#lookbook") + 40;
  if (name === "lookbook2") return top("#lookbook") + document.getElementById("lookbook").offsetHeight * 0.48;
  if (name === "pieces") return top("#pieces") + 40;
  if (name === "lagos") return top(".lagos-type") + document.querySelector(".lagos-type").offsetHeight / 2 - vh / 2;
  return document.documentElement.scrollHeight - vh;
}, name);
// Scroll keyframes: hero until 13.5s, five stops with holds, fast return to top 25.6–26.4 (rendered as a dissolve).
// A function `y` is resolved at the start of the move that ends on it; the following hold reuses it.
const SK = [
  { t: 0, y: 0 }, { t: 13.5, y: 0 },
  { t: 14.9, y: stop("lookbook") }, { t: 16.1, same: true },
  { t: 17.3, y: stop("lookbook2") }, { t: 18.4, same: true },
  { t: 19.6, y: stop("pieces") }, { t: 21.6, same: true },
  { t: 22.9, y: stop("lagos") }, { t: 24.0, same: true },
  { t: 25.1, y: stop("end") }, { t: 25.6, same: true },
  { t: 26.4, y: 0 }, { t: DUR, y: 0 },
];
const resolved = [];
async function yAt(t) {
  for (let i = 1; i < SK.length; i++) {
    const a = SK[i - 1], b = SK[i];
    if (t <= b.t) {
      for (const k of [i - 1, i]) {
        if (resolved[k] !== undefined) continue;
        const key = SK[k];
        resolved[k] = key.same ? resolved[k - 1] : typeof key.y === "function" ? await key.y() : key.y;
      }
      return resolved[i - 1] + (resolved[i] - resolved[i - 1]) * ease((t - a.t) / (b.t - a.t || 1));
    }
  }
  return 0;
}

// ---------- pointer script ----------
// move: glide to a target (resolved when the move starts); click: press + release;
// drag: press, glide, release (mobile swipes).
const S = MOBILE
  ? (() => {
      const cx = VP.width / 2, cy = VP.height * 0.48;
      const swipe = (t, dir) => ({ t, d: 0.36, drag: true, from: { x: cx + dir * 120, y: cy }, to: { x: cx - dir * 130, y: cy + 6 } });
      return [
        swipe(1.8, 1),
        swipe(3.1, 1),
        { t: 4.4, d: 0.01, to: () => modelPt(4, 0.45) }, { t: 4.6, click: true },
        { t: 5.9, click: true },
        { t: 7.0, d: 0.01, to: () => centerOf(".sheet-summary") }, { t: 7.2, click: true },
        { t: 9.2, d: 0.01, to: () => buttonByText(".sheet", "Add full look") }, { t: 9.4, click: true },
        { t: 11.2, d: 0.01, to: { x: cx, y: 70 } }, { t: 11.3, click: true },
        swipe(12.3, -1),
        { t: 20.2, d: 0.01, to: () => buttonByText(".filters", "Footwear") }, { t: 20.4, click: true },
      ];
    })()
  : [
      { t: 0, d: 0.01, to: async () => ({ x: (await modelPt(2)).x, y: 905 }) }, // enter from below Look 03
      { t: 1.2, d: 0.8, to: () => modelPt(2, 0.42) },
      { t: 2.3, d: 0.9, to: () => modelPt(0, 0.42) },
      ...[1, 2, 3, 4, 5].map((i, k) => ({ t: 3.5 + k * 0.58, d: 0.32, to: () => modelPt(i, 0.42) })),
      { t: 6.6, d: 0.7, to: () => modelPt(3, 0.42) },
      { t: 7.6, d: 0.6, to: () => centerOf(".hotspot") },
      { t: 9.0, d: 0.4, to: () => modelPt(3, 0.5) }, { t: 9.6, click: true },
      { t: 10.7, click: true },
      // leave the stage downwards first, so the glide to the panel doesn't refocus other models
      { t: 11.2, d: 0.45, to: async () => ({ x: (await modelPt(3)).x + 10, y: (await centerOf(".stage-controls")).y + 6 }) },
      { t: 11.7, d: 0.6, to: () => buttonByText(".panel", "Add full look") }, { t: 12.4, click: true },
      { t: 13.2, d: 1.2, to: { x: 1250, y: 760 } },
      { t: 19.7, d: 0.6, to: () => buttonByText(".filters", "Footwear") }, { t: 20.4, click: true },
      { t: 21.0, d: 1.0, to: { x: 1300, y: 780 } },
    ];

let pos = MOBILE ? { x: -100, y: -100 } : { x: 860, y: 905 };
let seg = null; // active move: { t, d, from, to, drag }
let si = 0;
await page.mouse.move(pos.x, pos.y);

const N = Math.round(DUR * FPS);
for (let f = 0; f < N; f++) {
  const t = f / FPS;
  // start any actions scheduled up to now
  while (si < S.length && S[si].t <= t + 1e-6) {
    const a = S[si++];
    if (a.click) {
      await page.mouse.down();
      await page.mouse.up();
      continue;
    }
    const to = typeof a.to === "function" ? await a.to() : a.to;
    const from = a.from ?? { ...pos };
    if (a.drag) {
      pos = { ...from };
      await page.mouse.move(pos.x, pos.y);
      await page.mouse.down();
    }
    seg = { ...a, from, to };
  }
  if (seg) {
    const k = ease(clamp01((t - seg.t) / seg.d));
    pos = { x: seg.from.x + (seg.to.x - seg.from.x) * k, y: seg.from.y + (seg.to.y - seg.from.y) * k };
    await page.mouse.move(pos.x, pos.y);
    if (k >= 1) {
      if (seg.drag) await page.mouse.up();
      seg = null;
    }
  }
  if (t >= 13.4) await page.evaluate((y) => window.scrollTo(0, y), await yAt(t));
  await page.clock.runFor(1000 / FPS);
  await page.evaluate(() => { window.__syncAnims(); window.__cursorTick(); });
  await page.waitForTimeout(12); // let image decodes land
  await page.screenshot({ path: `${OUT}/${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
  if (f % 90 === 0) console.log(`${MOBILE ? "mobile" : "desktop"} ${t.toFixed(1)}s`);
}
await browser.close();
fs.writeFileSync(`${OUT}/../timeline-${MOBILE ? "mobile" : "desktop"}.json`, JSON.stringify({ keys: SK.map((k, i) => ({ t: k.t, y: resolved[i] })) }, null, 2));
console.log("captured", N, "frames to", OUT);
