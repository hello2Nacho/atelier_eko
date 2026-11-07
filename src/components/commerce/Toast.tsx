import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "../../lib/motion";
import { useBag } from "../../state/bag";

export function Toast() {
  const bag = useBag();
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bag.toast || !el.current) return;
    gsap.fromTo(
      el.current,
      { xPercent: -50, y: 24, opacity: 0 },
      { xPercent: -50, y: 0, opacity: 1, duration: reducedMotion() ? 0.01 : 0.5, ease: "power3.out" },
    );
  }, [bag.toast]);

  return (
    <div role="status" aria-live="polite">
      {bag.toast && (
        <div ref={el} key={bag.toast.id} className="toast" style={{ transform: "translateX(-50%)" }}>
          <span>{bag.toast.text}</span>
          <button
            type="button"
            onClick={(e) => {
              bag.openerRef.current = document.querySelector<HTMLElement>(".bag-btn") ?? e.currentTarget;
              bag.dismissToast();
              bag.setOpen(true);
            }}
          >
            View bag
          </button>
        </div>
      )}
    </div>
  );
}
