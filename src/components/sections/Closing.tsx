import { useState } from "react";
import { site } from "../../content/site";
import { scrollToId } from "../../lib/motion";
import { Headline } from "./Headline";

export function Newsletter() {
  const [sent, setSent] = useState(false);
  return (
    <section className="section newsletter" aria-labelledby="nl-title">
      <div className="container">
        <span className="mono eyebrow">Newsletter</span>
        <Headline id="nl-title" lines={site.newsletter.title} emphasis="SS28." />
        <p style={{ color: "var(--ink-soft)", margin: "20px 0 0" }}>{site.newsletter.body}</p>
        {sent ? (
          <p className="mono" role="status" style={{ marginTop: 36, color: "var(--cool)" }}>{site.newsletter.thanks}</p>
        ) : (
          <form
            className="email-pill"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true); // concept: nothing is sent anywhere
            }}
          >
            <label htmlFor="nl-email" className="sr-only">Email address</label>
            <input id="nl-email" type="email" required placeholder="Your email" autoComplete="email" />
            <button type="submit" className="btn-primary" style={{ minHeight: 46 }}>{site.newsletter.cta}</button>
          </form>
        )}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="wordmark" style={{ color: "#f3efe8" }}>ATELIER EKO</div>
            <p style={{ fontSize: 13.5, maxWidth: "28ch", marginTop: 16 }}>Lagos streetwear, cut in small runs. SS27 Lookbook.</p>
          </div>
          {site.footer.columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h4>{c.title}</h4>
              <ul>
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#try"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToId(l === "Lookbook" ? "lookbook" : l === "About" ? "lagos" : c.title === "Shop" ? "pieces" : "try");
                      }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-base">
          <span>{site.footer.credit}</span>
          <span>Fictional brand · no real orders</span>
        </div>
      </div>
    </footer>
  );
}
