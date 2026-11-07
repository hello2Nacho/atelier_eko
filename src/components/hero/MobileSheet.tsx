import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { gsap, lockScroll, reducedMotion } from "../../lib/motion";
import { RollPrice } from "./Roll";

interface Props {
  summary: { label: string; pieces: number; price: number };
  onAddLook: () => void;
  /** changes when something (a hotspot) asks the sheet to open */
  openSignal?: unknown;
  children: ReactNode;
}

export function MobileSheet({ summary, onAddLook, openSignal, children }: Props) {
  const sheet = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; base: number; t0: number; moved: boolean } | null>(null);

  const closedY = () => {
    const el = sheet.current!;
    const peek = parseFloat(getComputedStyle(el).getPropertyValue("--sheet-peek")) || 84;
    return el.offsetHeight - peek;
  };

  const animate = (isOpen: boolean) =>
    gsap.to(sheet.current, { y: isOpen ? 0 : closedY(), duration: reducedMotion() ? 0 : 0.5, ease: "power3.out", overwrite: true });

  useLayoutEffect(() => {
    // gsap owns the transform from here on
    gsap.set(sheet.current, { y: closedY() });
    const onResize = () => gsap.set(sheet.current, { y: open ? 0 : closedY() });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    animate(open);
    lockScroll(open);
    content.current?.toggleAttribute("inert", !open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (openSignal) setOpen(true);
  }, [openSignal]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { y0: e.clientY, base: Number(gsap.getProperty(sheet.current, "y")), t0: performance.now(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y0;
    if (Math.abs(dy) > 4) d.moved = true;
    gsap.set(sheet.current, { y: Math.max(0, Math.min(closedY(), d.base + dy)) });
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return setOpen((o) => !o);
    const dy = e.clientY - d.y0;
    const v = dy / Math.max(1, performance.now() - d.t0);
    const next = Math.abs(v) > 0.5 ? v < 0 : Number(gsap.getProperty(sheet.current, "y")) < closedY() / 2;
    if (next === open) animate(open);
    else setOpen(next);
  };

  return (
    <>
      <div className={`sheet-backdrop${open ? " is-open" : ""}`} onClick={() => setOpen(false)} aria-hidden />
      <div ref={sheet} className="sheet" role="region" aria-label="In this look">
        <div className="sheet-bar" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
          <span className="sheet-handle" aria-hidden />
          <button
            type="button"
            className="sheet-summary"
            style={{ textAlign: "left", minHeight: 44 }}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="mono">{open ? "Tap to close" : "In this look"}</span>
            <strong>{summary.label}</strong> · {summary.pieces} pieces · <RollPrice value={summary.price} />
          </button>
          <button type="button" className="btn-primary" style={{ minHeight: 44, padding: "0 18px", fontSize: 13.5 }} onClick={onAddLook}>
            Add look
          </button>
        </div>
        <div ref={content} style={{ flex: 1, minHeight: 0, display: "flex" }}>
          {children}
        </div>
      </div>
    </>
  );
}
