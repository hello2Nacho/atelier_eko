import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../../lib/motion";
import { looks } from "../../content/looks";
import { site } from "../../content/site";

/** Giant type with the model standing through it (front/back copies, orbit recipe B). */
export function MadeInLagos() {
  const root = useRef<HTMLElement>(null);
  const model = looks[3];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".lagos-fig",
          { yPercent: 14 },
          { yPercent: -4, ease: "none", scrollTrigger: { trigger: ".lagos-type", start: "top bottom", end: "bottom top", scrub: 0.8 } },
        );
        gsap.from(".lagos-word .line-mask > span", {
          yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.1,
          scrollTrigger: { trigger: ".lagos-type", start: "top 70%" },
        });
        gsap.from(".value", {
          y: 24, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: ".values", start: "top 85%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="lagos" className="section lagos" aria-labelledby="lagos-title">
      <div className="container">
        <span className="mono eyebrow">{site.lagos.eyebrow}</span>
        <div className="lagos-type">
          <div className="lagos-fig back" aria-hidden>
            <img src={model.front} alt="" width={800} height={1600} loading="lazy" />
          </div>
          <h2 id="lagos-title" className="display lagos-word">
            <span className="line-mask"><span>{site.lagos.title[0]}</span></span>
            <span className="line-mask"><span><em>{site.lagos.title[1]}</em></span></span>
          </h2>
          <div className="lagos-fig front" aria-hidden>
            <img src={model.front} alt="" width={800} height={1600} loading="lazy" />
          </div>
        </div>
        <div className="lagos-body">
          <p>{site.lagos.body}</p>
          <div className="values">
            {site.lagos.values.map((v) => (
              <div key={v.title} className="value">
                <h3>
                  <span className="check" aria-hidden>
                    <svg width="10" height="10" viewBox="0 0 12 12"><path d="M2.5 6.2l2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
                  </span>
                  {v.title}
                </h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
