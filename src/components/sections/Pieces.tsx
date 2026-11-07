import { useLayoutEffect, useRef, useState } from "react";
import { Flip, ScrollTrigger, gsap, reducedMotion, shake } from "../../lib/motion";
import { allItems, usd, type Category } from "../../content/looks";
import { site } from "../../content/site";
import { useBag } from "../../state/bag";
import { SizeChips } from "../hero/SizeChips";
import { Headline } from "./Headline";

type Filter = (typeof site.pieces.filters)[number];
const MAP: Record<Filter, Category | null> = { All: null, Tops: "TOP", Bottoms: "BOTTOM", Footwear: "FOOTWEAR" };

export function Pieces() {
  const bag = useBag();
  const [filter, setFilter] = useState<Filter>("All");
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const change = (f: Filter) => {
    if (f === filter) return;
    if (!reducedMotion() && grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll(".p-card"));
    setFilter(f);
  };

  useLayoutEffect(() => {
    const st = flipState.current;
    // the grid's height changes with the filter, so every trigger below it must be re-measured
    if (!st) {
      ScrollTrigger.refresh();
      return;
    }
    flipState.current = null;
    Flip.from(st, {
      duration: 0.6, ease: "power3.inOut", absolute: true, scale: true,
      onComplete: () => ScrollTrigger.refresh(),
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.15 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.94, duration: 0.3 }),
    });
  }, [filter]);

  const shown = allItems.filter(({ item }) => !MAP[filter] || item.category === MAP[filter]);

  return (
    <section id="pieces" className="section" aria-labelledby="pieces-title">
      <div className="container">
        <div className="pieces-head">
          <div>
            <span className="mono eyebrow">{site.pieces.eyebrow}</span>
            <Headline id="pieces-title" lines={site.pieces.title} />
          </div>
          <div className="filters" role="group" aria-label="Filter pieces">
            {site.pieces.filters.map((f) => (
              <button key={f} type="button" className="filter" aria-pressed={filter === f} onClick={() => change(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{`${shown.length} pieces shown`}</p>
        <div ref={grid} className="p-grid">
          {shown.map(({ item, look }) => (
            <article key={item.id} className="p-card" data-flip-id={item.id} aria-labelledby={`${item.id}-name`}>
              <div className="p-img">
                <img src={item.image} alt={`${item.name} in ${item.colour}`} width={800} height={800} loading="lazy" decoding="async" />
              </div>
              <div className="p-info">
                <div style={{ minWidth: 0 }}>
                  <div className="mono" style={{ color: "var(--ink-soft)", fontSize: 10.5 }}>{item.category} · {look.label}</div>
                  <div id={`${item.id}-name`} className="name">{item.name}</div>
                  <div className="meta">{item.colour}</div>
                </div>
                <span className="mono" style={{ fontSize: 12.5, letterSpacing: 0 }}>{usd(item.price)}</span>
              </div>
              <div>
                <SizeChips
                  item={item}
                  idPrefix="p-"
                  value={sizes[item.id]}
                  error={errors[item.id]}
                  onChange={(s) => {
                    setSizes((v) => ({ ...v, [item.id]: s }));
                    setErrors((v) => ({ ...v, [item.id]: false }));
                  }}
                />
              </div>
              <button
                type="button"
                className="btn-ghost p-add"
                onClick={(e) => {
                  const size = sizes[item.id];
                  if (!size) {
                    setErrors((v) => ({ ...v, [item.id]: true }));
                    shake(e.currentTarget.closest(".p-card"));
                    return;
                  }
                  bag.addItem(item, size);
                }}
              >
                Add to bag <span aria-hidden>+</span>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
