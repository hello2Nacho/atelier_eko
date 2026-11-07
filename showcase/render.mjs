// Composites the captured frames into the showcase scenes and encodes with ffmpeg.
// Usage:
//   node showcase/render.mjs <ffmpeg> <capture-dir> devices          → output/showcase-devices-1920x1080.mp4
//   node showcase/render.mjs <ffmpeg> <capture-dir> window           → output/showcase-1920x1080.mp4
//   node showcase/render.mjs <ffmpeg> <capture-dir> still <t[,tMac,tPhone]> [name] → output/<name>.png at 3840×2160
//     (t poses the scene; tMac/tPhone pick each screen's capture frame, default t)
// <capture-dir> holds live/ (desktop) and live-mobile/ from showcase/capture.mjs, which share one timeline.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [FFMPEG, CAP, MODE = "devices", STILL_T = "7", STILL_NAME = "mockup-macbook-iphone"] = process.argv.slice(2);
const FPS = 30, LOOP = 27, W = 1920, H = 1080;
const REWIND = [25.6, 26.4]; // the capture's fast return to the top, drawn as a slide-dissolve
const OUT = path.resolve("showcase/output");
const list = (d) => fs.readdirSync(path.join(CAP, d)).filter((f) => f.endsWith(".jpg")).sort();
const MAC = list("live"), PHONE = MODE === "window" ? [] : list("live-mobile");
const at = (d, frames, t) => "file://" + path.join(CAP, d, frames[Math.min(Math.round(t * FPS), frames.length - 1)]);
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

const framesAt = (t) => {
  const [a, b] = REWIND;
  if (t >= a && t < b) {
    const mix = ease((t - a) / (b - a));
    return MODE === "window"
      ? [at("live", MAC, a), at("live", MAC, b), mix]
      : [{ m1: at("live", MAC, a), m2: at("live", MAC, b), p1: at("live-mobile", PHONE, a), p2: at("live-mobile", PHONE, b) }, mix];
  }
  return MODE === "window" ? [at("live", MAC, t), null, 0] : [{ m1: at("live", MAC, t), p1: at("live-mobile", PHONE, t) }, 0];
};

const scene = MODE === "window" ? "scene.html" : "devices.html";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: MODE === "still" ? 2 : 1 });
await page.goto("file://" + path.resolve("showcase", scene) + `?w=${W}&h=${H}&loop=${LOOP}`);
await page.waitForSelector("body[data-ready='1']");
fs.mkdirSync(OUT, { recursive: true });

if (MODE === "still") {
  const [t, tm = t, tp = tm] = STILL_T.split(",").map(Number);
  const frames = { m1: at("live", MAC, tm), p1: at("live-mobile", PHONE, tp) };
  await page.evaluate((a) => window.render(...a), [t, frames, 0]);
  const file = path.join(OUT, `${STILL_NAME}.png`);
  await page.screenshot({ path: file });
  await browser.close();
  console.log(file, (fs.statSync(file).size / 1e6).toFixed(2), "MB");
  process.exit(0);
}

const TMP = path.join(CAP, `.frames-${MODE}`);
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
for (let f = 0; f < LOOP * FPS; f++) {
  const t = f / FPS;
  const args = [t, ...framesAt(t)];
  await page.evaluate((a) => window.render(...a), args);
  await page.screenshot({ path: `${TMP}/${String(f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 95 });
  if (f % 150 === 0) console.log(MODE, `${t.toFixed(0)}s`);
}
await browser.close();
const name = MODE === "window" ? "showcase-1920x1080.mp4" : "showcase-devices-1920x1080.mp4";
const out = path.join(OUT, name);
execFileSync(FFMPEG, ["-v", "error", "-y", "-framerate", String(FPS), "-i", `${TMP}/%04d.jpg`,
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", out]);
fs.rmSync(TMP, { recursive: true, force: true });
console.log(out, (fs.statSync(out).size / 1e6).toFixed(2), "MB");
