import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../../lib/motion";

interface Props {
  id?: string;
  lines: string[];
  /** the phrase (at the end of a line) set in italic cool accent */
  emphasis?: string;
  className?: string;
  as?: "h2" | "h3";
}

/** Display headline with manual line breaks, revealed line by line. */
export function Headline({ id, lines, emphasis, className = "display h2", as: Tag = "h2" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current!.querySelectorAll(".line-mask > span"), {
          yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.08,
          scrollTrigger: { trigger: ref.current, start: "top 82%" },
        });
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} id={id} className={className}>
      {lines.map((line) => {
        const hit = emphasis && line.endsWith(emphasis);
        return (
          <span key={line} className="line-mask">
            <span>
              {hit ? (
                <>
                  {line.slice(0, -emphasis!.length)}
                  <em>{emphasis}</em>
                </>
              ) : (
                line
              )}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
