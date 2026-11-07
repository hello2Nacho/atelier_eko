import { useEffect, useRef, useState } from "react";
import { gsap, lockScroll, reducedMotion } from "../../lib/motion";
import { usd } from "../../content/looks";
import { site } from "../../content/site";
import { useBag } from "../../state/bag";

/** Keep Tab inside `root` while it is open. */
function useFocusTrap(root: React.RefObject<HTMLElement>, active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const el = root.current;
    const sel = 'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])';
    el?.querySelector<HTMLElement>(sel)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onEscape();
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(sel));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, root, onEscape]);
}

export function BagDrawer() {
  const bag = useBag();
  const [mounted, setMounted] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const drawer = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const modal = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bag.open) return;
    setMounted(true);
    bag.dismissToast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.open]);

  useEffect(() => {
    if (!mounted) return;
    const d = reducedMotion() ? 0 : 0.5;
    lockScroll(bag.open);
    if (bag.open) {
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: d * 0.8 });
      gsap.fromTo(drawer.current, { xPercent: 100 }, { xPercent: 0, duration: d, ease: "power3.out" });
    } else {
      gsap.to(backdrop.current, { opacity: 0, duration: d * 0.6 });
      gsap.to(drawer.current, {
        xPercent: 100, duration: d * 0.7, ease: "power3.in",
        onComplete: () => {
          setMounted(false);
          bag.openerRef.current?.focus();
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.open, mounted]);

  const close = () => bag.setOpen(false);
  useFocusTrap(drawer, bag.open && !checkout, close);
  useFocusTrap(modal, checkout, () => setCheckout(false));

  if (!mounted) return null;
  const total = bag.subtotal;

  return (
    <>
      <div ref={backdrop} className="drawer-backdrop" onClick={close} aria-hidden />
      <div ref={drawer} className="drawer" role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="drawer-head">
          <h2 id="bag-title" className="display" style={{ fontSize: 28, margin: 0 }}>
            Your bag <span className="mono" style={{ fontSize: 11, color: "var(--ink-soft)", letterSpacing: "0.1em" }}>({bag.count})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close bag">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="drawer-body">
          {bag.lines.length === 0 ? (
            <div style={{ padding: "64px 0", textAlign: "center", color: "var(--ink-soft)" }}>
              <p className="display" style={{ fontSize: 26, color: "var(--ink)", margin: "0 0 8px" }}>Your bag is empty.</p>
              <p style={{ margin: "0 0 24px" }}>Pick a look from the lineup.</p>
              <button type="button" className="btn-ghost" onClick={close}>Back to the looks</button>
            </div>
          ) : (
            bag.lines.map((line) => (
              <div key={line.key} className="bag-line">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <div>
                    {line.kind === "look" && <span className="badge" style={{ marginBottom: 6 }}>Bundle · −15%</span>}
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{line.kind === "look" ? line.title : line.parts[0].name}</div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                    {line.original > line.price && <div className="strike">{usd(line.original * line.qty)}</div>}
                    {usd(line.price * line.qty)}
                  </div>
                </div>
                <div className="bag-parts">
                  {line.parts.map((p) => (
                    <div key={p.itemId} className="bag-part">
                      <img src={p.thumb} alt="" width={52} height={52} />
                      <div>
                        <div style={{ fontWeight: line.kind === "look" ? 500 : 400 }}>{line.kind === "look" ? p.name : p.colour}</div>
                        <div style={{ color: "var(--ink-soft)", fontSize: 12.5 }}>
                          {line.kind === "look" && `${p.colour} · `}Size {p.size}
                        </div>
                      </div>
                      {line.kind === "look" && <span className="mono" style={{ color: "var(--ink-soft)" }}>{usd(p.price)}</span>}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="qty" role="group" aria-label={`Quantity for ${line.title}`}>
                    <button type="button" onClick={() => bag.setQty(line.key, line.qty - 1)} aria-label="Decrease quantity">−</button>
                    <span aria-live="polite">{line.qty}</span>
                    <button type="button" onClick={() => bag.setQty(line.key, line.qty + 1)} aria-label="Increase quantity">+</button>
                  </div>
                  <button type="button" className="link-btn" onClick={() => bag.remove(line.key)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {bag.lines.length > 0 && (
          <div className="drawer-foot">
            <div className="row"><span>Subtotal</span><span className="mono" style={{ fontSize: 13 }}>{usd(total + bag.savings)}</span></div>
            {bag.savings > 0 && (
              <div className="row save"><span>Bundle savings</span><span className="mono" style={{ fontSize: 13 }}>−{usd(bag.savings)}</span></div>
            )}
            <div className="row" style={{ color: "var(--ink-soft)" }}><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="row total"><span>Total</span><span>{usd(total)}</span></div>
            <button type="button" className="btn-primary" style={{ marginTop: 8 }} onClick={() => setCheckout(true)}>
              Checkout <span className="arrow" aria-hidden>→</span>
            </button>
          </div>
        )}
      </div>

      {checkout && (
        <div className="modal-backdrop" onClick={() => setCheckout(false)}>
          <div ref={modal} className="modal" role="alertdialog" aria-modal="true" aria-labelledby="co-title" aria-describedby="co-body" onClick={(e) => e.stopPropagation()}>
            <span className="mono" style={{ color: "var(--ink-soft)" }}>Atelier Eko · SS27</span>
            <h2 id="co-title" className="display" style={{ fontSize: 30, margin: "14px 0 10px", lineHeight: 1.05 }}>{site.checkoutMessage.title}</h2>
            <p id="co-body" style={{ color: "var(--ink-soft)", margin: "0 0 24px" }}>{site.checkoutMessage.body}</p>
            <button type="button" className="btn-primary" style={{ width: "100%" }} onClick={() => setCheckout(false)}>Keep browsing</button>
          </div>
        </div>
      )}
    </>
  );
}
