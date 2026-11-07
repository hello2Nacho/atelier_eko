import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion, scrollToId } from "../lib/motion";
import { site } from "../content/site";
import { useBag } from "../state/bag";

export function TopBar() {
  const bag = useBag();
  const [solid, setSolid] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!bag.bump || reducedMotion()) return;
    gsap.fromTo(countRef.current, { scale: 1.5 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  }, [bag.bump]);

  return (
    <header className={`topbar${solid ? " is-solid" : ""}`}>
      <a href="#try" className="wordmark" style={{ color: "inherit", textDecoration: "none" }} aria-label="Atelier Eko, home">
        ATELIER EKO
      </a>
      <nav className="topnav" aria-label="Main">
        {site.nav.map((n) => (
          <a
            key={n.label}
            href={n.href}
            onClick={(e) => {
              e.preventDefault();
              scrollToId(n.href.slice(1));
            }}
          >
            {n.label}
          </a>
        ))}
      </nav>
      <button
        type="button"
        className="bag-btn"
        aria-label={`Open bag, ${bag.count} ${bag.count === 1 ? "item" : "items"}`}
        onClick={(e) => {
          bag.openerRef.current = e.currentTarget;
          bag.setOpen(true);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M4 7h12l-1 10H5L4 7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span className="topnav-hide">Bag</span>
        <span ref={countRef} className={`bag-count${bag.count ? " has-items" : ""}`}>{bag.count}</span>
      </button>
    </header>
  );
}
