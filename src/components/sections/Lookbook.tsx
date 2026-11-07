import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../../lib/motion";
import { looks, pad2 } from "../../content/looks";
import { site } from "../../content/site";
import { Headline } from "./Headline";

export function Lookbook({ onTry }: { onTry: (i: number) => void }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".lb-tile").forEach((tile) => {
          gsap.fromTo(
            tile.querySelector(".lb-bg"),
            { clipPath: "inset(18% 8% 0% 8% round 20px)" },
            { clipPath: "inset(0% 0% 0% 0% round 20px)", ease: "none", scrollTrigger: { trigger: tile, start: "top 90%", end: "top 35%", scrub: 0.8 } },
          );
          gsap.fromTo(
            tile.querySelector(".lb-model"),
            { yPercent: 10, opacity: 0 },
            { yPercent: 0, opacity: 1, ease: "power3.out", duration: 1.1, scrollTrigger: { trigger: tile, start: "top 80%" } },
          );
          gsap.to(tile.querySelector(".lb-num"), { yPercent: -40, ease: "none", scrollTrigger: { trigger: tile, scrub: true } });
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="lookbook" className="section lookbook" aria-labelledby="lb-title">
      <div className="container">
        <span className="mono eyebrow">{site.lookbook.eyebrow}</span>
        <Headline id="lb-title" lines={site.lookbook.title} emphasis={site.lookbook.emphasis} />
        <div className="lb-grid">
          {looks.map((l, i) => (
            <a
              key={l.id}
              href="#try"
              className="lb-tile"
              onClick={(e) => {
                e.preventDefault();
                onTry(i);
              }}
              aria-label={`${l.label}: ${l.caption}. Try this look.`}
            >
              <div className="lb-frame">
                <div className="lb-bg" />
                <span className="lb-num" aria-hidden>{pad2(l.id)}</span>
                <div className="lb-model">
                  <img src={l.front} alt="" width={800} height={1600} loading="lazy" decoding="async" />
                </div>
              </div>
              <div className="lb-caption">
                <div>
                  <span className="mono">{l.label}</span>
                  <p>{l.caption}</p>
                </div>
                <span className="lb-try">Try the look</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
