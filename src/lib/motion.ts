import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, Flip);

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

let lenis: Lenis | null = null;
export function initSmoothScroll() {
  if (reducedMotion() || lenis) return lenis;
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
export const getLenis = () => lenis;
export const lockScroll = (locked: boolean) => {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
};
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
}

/** Gentle "no" shake for validation. */
export function shake(el: Element | null) {
  if (!el || reducedMotion()) return;
  gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-6, 6, -5, 5, -2, 0] }, duration: 0.38, ease: "none", overwrite: true });
}

export { gsap, ScrollTrigger, Flip };
