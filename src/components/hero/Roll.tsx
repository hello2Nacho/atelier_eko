import { useEffect, useRef } from "react";
import { gsap, reducedMotion } from "../../lib/motion";
import { usd } from "../../content/looks";

const DIGITS = "0123456789".split("");

/** Odometer-style digits: each digit column slides to its value. */
export function RollDigits({ value, className }: { value: string; className?: string }) {
  const cols = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    value.split("").forEach((ch, i) => {
      const d = Number(ch);
      if (Number.isNaN(d) || !cols.current[i]) return;
      gsap.to(cols.current[i], {
        yPercent: -d * 10,
        duration: reducedMotion() ? 0 : 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
    });
  }, [value]);
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="roll">
        {value.split("").map((ch, i) =>
          /\d/.test(ch) ? (
            <span key={i} className="roll-col" ref={(el) => void (el && (cols.current[i] = el))}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
      </span>
    </span>
  );
}

/** Price that counts from its previous value to the new one. */
export function RollPrice({ value, className }: { value: number; className?: string }) {
  const out = useRef<HTMLSpanElement>(null);
  const state = useRef({ v: value });
  useEffect(() => {
    const el = out.current;
    if (!el) return;
    if (reducedMotion()) {
      state.current.v = value;
      el.textContent = usd(value);
      return;
    }
    gsap.to(state.current, {
      v: value,
      duration: 0.6,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => void (el.textContent = usd(state.current.v)),
    });
  }, [value]);
  return (
    <span className={className}>
      <span className="sr-only">{usd(value)}</span>
      <span aria-hidden ref={out}>{usd(value)}</span>
    </span>
  );
}
