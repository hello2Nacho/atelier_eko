import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, reducedMotion, shake } from "../../lib/motion";
import { bundlePrice, lookTotal, looks, pad2, usd, type Item } from "../../content/looks";
import { RollDigits, RollPrice } from "./Roll";
import { SizeChips } from "./SizeChips";

export interface PanelProps {
  index: number;
  sizes: Record<string, string>;
  onSize: (item: Item, slot: number, size: string) => void;
  bundleSizes: string[];
  onBundleSize: (slot: number, size: string) => void;
  activeItem: string | null;
  setActiveItem: (id: string | null) => void;
  onTurn: () => void;
  onAddItem: (item: Item) => void;
  onAddLook: () => void;
  /** bumps when a hotspot asks to reveal a card */
  reveal: { id: string; n: number } | null;
  idPrefix?: string;
  compact?: boolean;
}

export function Panel(props: PanelProps) {
  const { index, sizes, onSize, bundleSizes, onBundleSize, activeItem, setActiveItem, onTurn, onAddLook, reveal, idPrefix = "" } = props;
  const [shown, setShown] = useState(index);
  const listRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  // outgoing cards, then swap content
  useEffect(() => {
    if (index === shown) return;
    const cards = listRef.current?.querySelectorAll(".card");
    tl.current?.kill();
    if (!cards?.length || reducedMotion()) {
      setShown(index);
      return;
    }
    tl.current = gsap.timeline({ onComplete: () => setShown(index) })
      .to(cards, { y: -8, opacity: 0, duration: 0.22, ease: "power2.in", stagger: 0.06, overwrite: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // incoming cards
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setErrors({});
    const cards = listRef.current?.querySelectorAll(".card");
    if (!cards) return;
    if (reducedMotion()) {
      gsap.fromTo(cards, { opacity: 0 }, { opacity: 1, duration: 0.2, overwrite: true });
      return;
    }
    gsap.fromTo(cards, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", stagger: 0.06, overwrite: true });
  }, [shown]);

  // hotspot → scroll card into view, focus its first chip
  useEffect(() => {
    if (!reveal) return;
    const card = listRef.current?.querySelector<HTMLElement>(`[data-item="${reveal.id}"]`);
    if (!card) return;
    card.scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    card.querySelector<HTMLButtonElement>("[data-chip]")?.focus({ preventScroll: true });
  }, [reveal]);

  const look = looks[shown];
  const total = lookTotal(looks[index]);
  const bundle = bundlePrice(looks[index]);

  const add = (item: Item, card: HTMLElement | null) => {
    if (!sizes[item.id]) {
      setErrors((e) => ({ ...e, [item.id]: true }));
      shake(card);
      card?.querySelector<HTMLButtonElement>("[data-chip]")?.focus();
      return;
    }
    setErrors((e) => ({ ...e, [item.id]: false }));
    props.onAddItem(item);
    setDone((d) => ({ ...d, [item.id]: true }));
    window.setTimeout(() => setDone((d) => ({ ...d, [item.id]: false })), 1200);
  };

  return (
    <aside className="panel" aria-label="In this look">
      <div className="panel-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="mono">In this look</span>
          <button type="button" className="turn-pill" onClick={onTurn} aria-label={`Turn ${looks[index].label}`}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Turn
          </button>
        </div>
        <span className="counter" aria-label={`Look ${index + 1} of ${looks.length}`}>
          <RollDigits value={pad2(index + 1)} /> / {pad2(looks.length)}
        </span>
      </div>

      <div className="items" ref={listRef}>
        {look.items.map((item, slot) => (
          <div
            key={item.id}
            className={`card${activeItem === item.id ? " is-active" : ""}`}
            data-item={item.id}
            onPointerEnter={() => setActiveItem(item.id)}
            onPointerLeave={() => setActiveItem(null)}
          >
            <div className="card-thumb">
              <img src={item.thumb} alt={`${item.name} in ${item.colour}`} width={320} height={320} loading="lazy" decoding="async" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="card-cat mono">
                <span className="pin" aria-hidden />
                {item.category}
              </div>
              <div className="card-name">{item.name}</div>
            </div>
            <button
              type="button"
              className={`add-btn${done[item.id] ? " is-done" : ""}`}
              aria-label={`Add ${item.name}${sizes[item.id] ? `, size ${sizes[item.id]}` : ""} to bag`}
              onClick={(e) => add(item, e.currentTarget.closest(".card"))}
            >
              {done[item.id] ? (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              )}
            </button>
            <div className="card-meta" style={{ gridColumn: "2 / 4" }}>
              <span>{item.colour}</span>
              <span aria-hidden>·</span>
              <span className="card-price">{usd(item.price)}</span>
            </div>
            <SizeChips item={item} value={sizes[item.id]} onChange={(s) => onSize(item, slot, s)} error={errors[item.id]} idPrefix={idPrefix} />
          </div>
        ))}
      </div>

      <div className="bundle">
        <div className="bundle-row">
          <div className="bundle-title">Complete the look</div>
          <span className="badge">Save 15%</span>
        </div>
        <div className="bundle-row" style={{ marginTop: 4 }}>
          <div className="bundle-sub">All 3 pieces · sizes below</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="strike">
              <span className="sr-only">was </span>
              <RollPrice value={total} />
            </span>
            <span className="bundle-price">
              <span className="sr-only">now </span>
              <RollPrice value={bundle} />
            </span>
          </div>
        </div>
        <div className="bundle-sizes">
          {looks[index].items.map((item, slot) => (
            <label key={item.id} className="mono">
              {item.category === "FOOTWEAR" ? "Shoe" : item.category === "TOP" ? "Top" : "Waist"}
              <select value={bundleSizes[slot]} onChange={(e) => onBundleSize(slot, e.target.value)} aria-label={`${item.name} size for full look`}>
                {item.sizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={onAddLook}>
          <span>Add full look to bag</span>
          <span className="arrow" aria-hidden>→</span>
        </button>
      </div>
    </aside>
  );
}
