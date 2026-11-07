import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, reducedMotion, finePointer } from "../../lib/motion";
import { useMedia } from "../../lib/useMedia";
import { DEFAULT_SIZES, bundlePrice, looks, pad2, type Item } from "../../content/looks";
import { site } from "../../content/site";
import { useBag } from "../../state/bag";
import { Stage, type StageHandle } from "./Stage";
import { Panel } from "./Panel";
import { MobileSheet } from "./MobileSheet";

interface Props {
  focus: number;
  setFocus: (i: number) => void;
}

const defaults = () => looks.map((l) => l.items.map((i) => DEFAULT_SIZES[i.category]));

export function TryTheLook({ focus, setFocus }: Props) {
  const bag = useBag();
  const stage = useRef<StageHandle>(null);
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const isDesktop = useMedia("(min-width: 1024px)");
  const isMobile = useMedia("(max-width: 767px), (max-width: 1023px) and (orientation: portrait)");
  const fine = useMedia("(hover: hover) and (pointer: fine)");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [bundleSizes, setBundleSizes] = useState<string[][]>(defaults);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [reveal, setReveal] = useState<{ id: string; n: number } | null>(null);
  const [announce, setAnnounce] = useState("");

  const look = looks[focus];

  const commit = useCallback(
    (i: number) => {
      setFocus(i);
      setActiveItem(null);
    },
    [setFocus],
  );

  useEffect(() => {
    const l = looks[focus];
    setAnnounce(`${l.label}: ${l.items.map((i) => `${i.name}, ${i.colour}`).join("; ")}.`);
    gsap.to(progress.current, { scaleX: (focus + 1) / looks.length, duration: reducedMotion() ? 0 : 0.6, ease: "power3.out" });
  }, [focus]);

  // headline reveal on load
  useGSAP(
    () => {
      if (reducedMotion()) return;
      gsap.from(".hero-title .line-mask > span", { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08, delay: 0.1 });
      gsap.from(".hero-sub, .stage-controls", { opacity: 0, y: 8, duration: 0.8, ease: "power3.out", delay: 0.35 });
      gsap.from(".lineup", { opacity: 0, duration: 1, ease: "power2.out", delay: 0.15 });
    },
    { scope: root },
  );

  const onSize = (item: Item, slot: number, size: string) => {
    setSizes((s) => ({ ...s, [item.id]: size }));
    setBundleSizes((b) => b.map((row, li) => (li === focus ? row.map((v, n) => (n === slot ? size : v)) : row)));
  };
  const onBundleSize = (slot: number, size: string) =>
    setBundleSizes((b) => b.map((row, li) => (li === focus ? row.map((v, n) => (n === slot ? size : v)) : row)));

  const addItem = (item: Item) => bag.addItem(item, sizes[item.id]);
  const addLook = () => bag.addLook(look, bundleSizes[focus]);
  const go = (i: number) => commit(Math.max(0, Math.min(looks.length - 1, i)));
  const onHotspot = (id: string) => setReveal((r) => ({ id, n: (r?.n ?? 0) + 1 }));

  const panelProps = {
    index: focus,
    sizes,
    onSize,
    bundleSizes: bundleSizes[focus],
    onBundleSize,
    activeItem,
    setActiveItem,
    onTurn: () => stage.current?.turn(focus),
    onAddItem: addItem,
    onAddLook: addLook,
    reveal,
  };

  return (
    <section ref={root} className="hero" id="try" aria-labelledby="try-title">
      <div className="stage-col">
        <header>
          <h1 id="try-title" className="display hero-title">
            <span className="line-mask"><span>{site.hero.title[0]}</span></span>
            <span className="line-mask"><span><em>{site.hero.title[1]}</em></span></span>
          </h1>
          <p className="mono hero-sub">{site.hero.subline}</p>
        </header>

        <Stage
          ref={stage}
          focus={focus}
          onCommit={commit}
          activeItem={activeItem}
          setActiveItem={setActiveItem}
          onHotspot={onHotspot}
          mobile={isMobile}
          cursorEnabled={isDesktop && fine && finePointer() && !reducedMotion()}
        />

        <div className="stage-controls">
          <button type="button" className="icon-btn" onClick={() => go(focus - 1)} disabled={focus === 0} aria-label="Previous look">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="icon-btn" onClick={() => go(focus + 1)} disabled={focus === looks.length - 1} aria-label="Next look">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="progress" aria-hidden>
            <div ref={progress} className="progress-fill" style={{ transform: `scaleX(${(focus + 1) / looks.length})` }} />
          </div>
          <span className="mono stage-label">{look.label}</span>
        </div>
        <p className="sr-only" aria-live="polite">{announce}</p>
      </div>

      {isDesktop ? (
        <Panel {...panelProps} />
      ) : (
        <MobileSheet
          summary={{ label: `Look ${pad2(focus + 1)}`, pieces: look.items.length, price: bundlePrice(look) }}
          onAddLook={addLook}
          openSignal={reveal}
        >
          <Panel {...panelProps} idPrefix="m-" />
        </MobileSheet>
      )}
    </section>
  );
}
