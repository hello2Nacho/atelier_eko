import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "../../lib/motion";
import { lookA11yLabel, looks, usd } from "../../content/looks";

export interface StageHandle {
  turn: (i: number) => void;
}

interface Props {
  focus: number;
  onCommit: (i: number) => void;
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  onHotspot: (itemId: string) => void;
  mobile: boolean;
  cursorEnabled: boolean;
}

/** Visual states by distance from the focused model (DESIGN.md §2). */
const STATES = [
  { scale: 1.08, opacity: 1, blur: 0, shadow: 0.55, sx: 1.15 },
  { scale: 0.94, opacity: 0.45, blur: 6, shadow: 0.3, sx: 1 },
  { scale: 0.9, opacity: 0.28, blur: 8, shadow: 0.2, sx: 1 },
  { scale: 0.88, opacity: 0.18, blur: 10, shadow: 0.15, sx: 1 },
];
const MOBILE_STATES = [
  { scale: 1, opacity: 1, blur: 0, shadow: 0.55, sx: 1.1 },
  { scale: 0.86, opacity: 0.4, blur: 6, shadow: 0.2, sx: 1 },
  { scale: 0.8, opacity: 0, blur: 8, shadow: 0, sx: 1 },
];
const HYSTERESIS = 0.68; // cursor must travel 18% past the slot border
const SETTLE_MS = 90;
const N = looks.length;
const clamp = (i: number) => Math.max(0, Math.min(N - 1, i));

export const Stage = forwardRef<StageHandle, Props>(function Stage(
  { focus, onCommit, activeItem, setActiveItem, onHotspot, mobile, cursorEnabled },
  ref,
) {
  const stageRef = useRef<HTMLDivElement>(null);
  const lineupRef = useRef<HTMLDivElement>(null);
  const modelRefs = useRef<HTMLDivElement[]>([]);
  const figRefs = useRef<HTMLDivElement[]>([]);
  const imgRefs = useRef<HTMLDivElement[]>([]);
  const shadowRefs = useRef<HTMLDivElement[]>([]);
  const btnRefs = useRef<HTMLButtonElement[]>([]);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);

  const visual = useRef(focus);
  const [vis, setVis] = useState(focus); // drives hotspots + roving tabindex
  const [sides, setSides] = useState<("front" | "back")[]>(() => looks.map(() => "front"));
  const [backsReady, setBacksReady] = useState(false);
  const [box, setBox] = useState({ mh: 400, slot: 160, pad: 0, w: 1000 });
  const settleTimer = useRef<number>();
  const turning = useRef<boolean[]>(looks.map(() => false));
  const dolly = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  const drag = useRef<{ x0: number; y0: number; t0: number; dx: number; active: boolean; swiped: boolean } | null>(null);
  const suppressClick = useRef(false);

  /* ---------- layout ---------- */
  useLayoutEffect(() => {
    const el = stageRef.current!;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (mobile) {
        const mh = Math.min(h * 0.97, w * 1.75);
        setBox({ mh, slot: w * 0.46, pad: 0, w });
      } else {
        const pad = Math.max(8, w * 0.02);
        const slot = (w - pad * 2) / N;
        const mh = Math.min(h * 0.92, slot * 3);
        setBox({ mh, slot, pad, w });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mobile]);

  /* ---------- apply visual focus ---------- */
  const apply = useCallback(
    (v: number, instant = false) => {
      const reduced = reducedMotion();
      const dur = instant ? 0 : reduced ? 0.2 : 0.6;
      modelRefs.current.forEach((el, i) => {
        if (!el) return;
        const d = Math.abs(i - v);
        const s = mobile ? MOBILE_STATES[Math.min(d, 2)] : STATES[Math.min(d, 3)];
        el.style.zIndex = String(10 - d);
        gsap.to(el, {
          scale: s.scale,
          opacity: s.opacity,
          x: mobile ? (i - v) * box.slot : 0,
          duration: dur,
          ease: "power3.out",
          overwrite: "auto",
        });
        gsap.to(imgRefs.current[i], { filter: `blur(${s.blur}px)`, duration: dur, ease: "power3.out", overwrite: "auto" });
        gsap.to(shadowRefs.current[i], { opacity: s.shadow, scaleX: s.sx, duration: dur, ease: "power3.out", overwrite: "auto" });
        // only the three nearest get their own compositing layer
        imgRefs.current[i]?.style.setProperty("will-change", d <= 1 ? "filter" : "auto");
      });
    },
    [mobile, box.slot],
  );

  const setVisual = useCallback(
    (v: number, commit: "now" | "settle") => {
      v = clamp(v);
      const changed = v !== visual.current;
      visual.current = v;
      if (changed) {
        apply(v);
        setVis(v);
      }
      window.clearTimeout(settleTimer.current);
      if (commit === "now") onCommit(v);
      else settleTimer.current = window.setTimeout(() => onCommit(visual.current), SETTLE_MS);
    },
    [apply, onCommit],
  );

  // external focus changes (arrows, panel, lookbook links)
  useEffect(() => {
    if (focus !== visual.current) {
      visual.current = focus;
      setVis(focus);
      apply(focus);
    }
  }, [focus, apply]);

  // re-apply on layout/mode change, instantly
  useLayoutEffect(() => {
    apply(visual.current, true);
  }, [apply]);

  // preload back views once the page is idle
  useEffect(() => {
    const ric = (window as any).requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1200));
    ric(() => setBacksReady(true));
  }, []);

  /* ---------- camera dolly + cursor (fine pointers, desktop only) ---------- */
  useEffect(() => {
    if (mobile || reducedMotion()) {
      gsap.set(lineupRef.current, { x: 0, y: 0 });
      return;
    }
    const tick = () => {
      const d = dolly.current;
      d.x += (d.tx - d.x) * 0.06;
      d.y += (d.ty - d.y) * 0.06;
      gsap.set(lineupRef.current, { x: d.x, y: d.y });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [mobile]);

  const cursorMove = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);
  useEffect(() => {
    if (!cursorEnabled || !cursorRef.current) return;
    cursorMove.current = {
      x: gsap.quickTo(cursorRef.current, "x", { duration: 0.18, ease: "power3.out" }),
      y: gsap.quickTo(cursorRef.current, "y", { duration: 0.18, ease: "power3.out" }),
    };
  }, [cursorEnabled]);

  const setCursorMode = (mode: "dot" | "view" | "spot" | "hidden") => {
    const c = cursorRef.current;
    if (!c) return;
    c.classList.toggle("is-view", mode === "view");
    c.classList.toggle("is-spot", mode === "spot");
    c.classList.toggle("is-hidden", mode === "hidden");
  };

  const slotFromX = (clientX: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return (clientX - r.left - box.pad - dolly.current.x) / box.slot - 0.5;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || mobile) return onTouchMove(e);
    const r = stageRef.current!.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    dolly.current.tx = -(nx - 0.5) * 36;
    dolly.current.ty = -(ny - 0.5) * 10;

    const p = slotFromX(e.clientX);
    if (Math.abs(p - visual.current) > HYSTERESIS) setVisual(Math.round(p), "settle");

    if (cursorEnabled) {
      cursorMove.current?.x(e.clientX);
      cursorMove.current?.y(e.clientY);
      const t = e.target as HTMLElement;
      if (t.closest(".hotspot")) setCursorMode("spot");
      else if (t.closest(`[data-model="${visual.current}"]`)) {
        setCursorMode("view");
        if (cursorLabelRef.current) cursorLabelRef.current.textContent = sides[visual.current] === "front" ? "View" : "Front";
      } else setCursorMode("dot");
    }
  };

  const onPointerLeave = () => {
    dolly.current.tx = 0;
    dolly.current.ty = 0;
    setCursorMode("hidden");
  };

  /* ---------- turn ---------- */
  const turn = useCallback((i: number) => {
    const fig = figRefs.current[i];
    if (!fig || turning.current[i]) return;
    turning.current[i] = true;
    const flip = () => setSides((s) => s.map((v, n) => (n === i ? (v === "front" ? "back" : "front") : v)));
    const done = () => void (turning.current[i] = false);
    if (reducedMotion()) {
      gsap.timeline({ onComplete: done })
        .to(fig, { opacity: 0, duration: 0.12 })
        .add(flip)
        .to(fig, { opacity: 1, duration: 0.18 });
      return;
    }
    gsap.timeline({ onComplete: done })
      .to(fig, { scaleX: 0.06, scaleY: 1.015, duration: 0.16, ease: "power2.in" })
      .add(flip)
      .to(fig, { scaleX: 1, duration: 0.24, ease: "back.out(1.6)" })
      .fromTo(fig, { scaleY: 0.975 }, { scaleY: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" }, "<");
  }, []);
  useImperativeHandle(ref, () => ({ turn }), [turn]);

  /* ---------- click / tap / swipe ---------- */
  const go = (i: number) => {
    setVisual(i, "now");
    btnRefs.current[clamp(i)]?.focus({ preventScroll: true });
  };

  const onModelClick = (i: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (suppressClick.current) return;
    if (i === visual.current) turn(i);
    else go(i);
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (suppressClick.current || mobile) return;
    const i = clamp(Math.round(slotFromX(e.clientX)));
    if (i !== visual.current) go(i);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    suppressClick.current = false;
    if (e.pointerType !== "touch" && !mobile) return;
    drag.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), dx: 0, active: false, swiped: false };
  };

  function onTouchMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !mobile) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.active && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) d.active = true;
    if (d.active) {
      d.dx = dx;
      const edge = (visual.current === 0 && dx > 0) || (visual.current === N - 1 && dx < 0);
      gsap.set(lineupRef.current, { x: edge ? dx * 0.25 : dx * 0.85 });
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (e.pointerType !== "touch" && !mobile) return;
    const dx = e.clientX - d.x0;
    if (!d.active) return;
    const v = Math.abs(dx) / Math.max(1, performance.now() - d.t0);
    suppressClick.current = true;
    const next = Math.abs(dx) > 40 || v > 0.4 ? visual.current - Math.sign(dx) : visual.current;
    gsap.to(lineupRef.current, { x: 0, duration: reducedMotion() ? 0 : 0.5, ease: "power3.out" });
    setVisual(next, "now");
  };

  /* ---------- keyboard (roving tabindex) ---------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    let next: number | null = null;
    if (k === "ArrowRight") next = visual.current + 1;
    else if (k === "ArrowLeft") next = visual.current - 1;
    else if (k === "Home") next = 0;
    else if (k === "End") next = N - 1;
    else if (/^[1-6]$/.test(k)) next = Number(k) - 1;
    if (next === null) return;
    e.preventDefault();
    go(next);
  };

  const sizes = `${Math.round(box.mh / 2)}px`;

  return (
    <div
      ref={stageRef}
      className={`stage${cursorEnabled ? " has-cursor" : ""}`}
      role="group"
      aria-roledescription="lineup"
      aria-label="SS27 lineup, 6 looks. Use left and right arrows to change look, Enter to turn the model."
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onClick={onStageClick}
      onKeyDown={onKeyDown}
    >
      <div className="floor" aria-hidden />
      <div ref={lineupRef} className="lineup">
        {looks.map((look, i) => {
          const near = !mobile || Math.abs(i - focus) <= 1;
          const side = sides[i];
          const isFocus = i === vis;
          return (
            <div
              key={look.id}
              ref={(el) => void (el && (modelRefs.current[i] = el))}
              className="model"
              data-model={i}
              style={{
                ["--mh" as string]: `${box.mh}px`,
                left: mobile ? "50%" : box.pad + box.slot * (i + 0.5),
              }}
            >
              <div ref={(el) => void (el && (shadowRefs.current[i] = el))} className="model-shadow-contact" aria-hidden />
              <button
                ref={(el) => void (el && (btnRefs.current[i] = el))}
                type="button"
                className="model-hit"
                tabIndex={isFocus ? 0 : -1}
                aria-current={isFocus ? "true" : undefined}
                aria-label={`${lookA11yLabel(look)}. ${side === "front" ? "Front" : "Back"} view.${isFocus ? " Press Enter to turn." : ""}`}
                onClick={onModelClick(i)}
              />
              <div ref={(el) => void (el && (figRefs.current[i] = el))} className="model-figure">
                <img
                  className="model-shadow-cast"
                  src={side === "front" ? look.frontSm : backsReady ? look.backSm : look.frontSm}
                  alt=""
                  aria-hidden
                  loading={near ? "eager" : "lazy"}
                  draggable={false}
                />
                <div ref={(el) => void (el && (imgRefs.current[i] = el))} className="model-img">
                  <img
                    className="model-photo"
                    src={look.front}
                    srcSet={`${look.frontSm} 400w, ${look.front} 800w`}
                    sizes={sizes}
                    alt=""
                    width={800}
                    height={1600}
                    loading={near ? "eager" : "lazy"}
                    {...{ fetchpriority: i === focus ? "high" : near ? "auto" : "low" }}
                    decoding={i === focus ? "sync" : "async"}
                    draggable={false}
                    style={{ opacity: side === "front" ? 1 : 0 }}
                  />
                  {backsReady && (
                    <img
                      className="model-photo"
                      src={look.back}
                      srcSet={`${look.backSm} 400w, ${look.back} 800w`}
                      sizes={sizes}
                      alt=""
                      width={800}
                      height={1600}
                      decoding="async"
                      draggable={false}
                      style={{ opacity: side === "back" ? 1 : 0 }}
                    />
                  )}
                </div>
                {isFocus &&
                  side === "front" &&
                  look.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`hotspot${activeItem === item.id ? " is-active" : ""}`}
                      style={{ left: `${item.hotspot.x}%`, top: `${item.hotspot.y}%` }}
                      aria-label={`${item.category.toLowerCase()}: ${item.name}, ${item.colour}, ${usd(item.price)}. Show in panel.`}
                      onPointerEnter={() => setActiveItem(item.id)}
                      onPointerLeave={() => setActiveItem(null)}
                      onFocus={() => setActiveItem(item.id)}
                      onBlur={() => setActiveItem(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onHotspot(item.id);
                      }}
                    >
                      <span className="dot" />
                      <span className="tip" aria-hidden>
                        {item.category === "FOOTWEAR" ? "Footwear" : item.category === "TOP" ? "Top" : "Bottom"} · {item.name}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      {cursorEnabled && (
        <div ref={cursorRef} className="cursor is-hidden" aria-hidden>
          <span className="cursor-ring" />
          <span ref={cursorLabelRef} className="cursor-label">View</span>
        </div>
      )}
    </div>
  );
});
