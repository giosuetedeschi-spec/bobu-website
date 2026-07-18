"use client";

import React, { useState } from "react";
import { basePath } from "@/lib/basePath";
import { FORCE_DESKTOP_KEY } from "@/hooks/useIsMobile";
import styles from "./MobileCard.module.css";

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/giosuetedeschi-spec",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
        <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.34-1.75-1.34-1.75-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://it.linkedin.com/in/giosu%C3%A8-tedeschi-b287b9225",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "https://x.com/Pizzibarbaro",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden>
        <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.29L17.61 20.65z" />
      </svg>
    ),
  },
];

const LINKS = [
  { label: "Portfolio", sub: "Selected work", href: "/portfolio", accent: "blue" },
  { label: "CV", sub: "Experience & skills", href: "/cv", accent: "purple" },
  { label: "Progetti", sub: "Games & demos", href: "/progetti", accent: "green" },
  { label: "Store", sub: "E-commerce", href: "/ecommerce", accent: "amber" },
];

const withBase = (path: string) => `${basePath}${path}`;

export default function MobileCard() {
  const [flipped, setFlipped] = useState(false);

  const forceDesktop = () => {
    try {
      window.localStorage.setItem(FORCE_DESKTOP_KEY, "1");
    } catch {
      /* private mode / storage disabled — reload alone still helps once set fails silently */
    }
    window.location.reload();
  };

  return (
    <main className={styles.root}>
      <div className={styles.card}>
        {/* Flip card: tap the avatar/name area to reveal a short intro */}
        <button
          type="button"
          className={styles.flip}
          data-flipped={flipped}
          onClick={() => setFlipped((f) => !f)}
          aria-label={flipped ? "Show profile" : "Show intro"}
        >
          <div className={styles.flipInner}>
            <div className={styles.flipFront}>
              <div className={styles.avatar}>B</div>
              <h1 className={styles.name}>BobuOS</h1>
              <p className={styles.role}>Developer &amp; Creative Coder</p>
              <span className={styles.flipHint}>tap</span>
            </div>
            <div className={styles.flipBack}>
              <p className={styles.blurb}>
                Ciao, sono Giosu&egrave; &ldquo;Bobu&rdquo; Tedeschi &mdash; a developer &amp;
                creative technologist from Torino. I build games, tools and playful web things.
              </p>
              <span className={styles.flipHint}>tap to flip back</span>
            </div>
          </div>
        </button>

        <nav className={styles.socials} aria-label="Social links">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label={s.label}
              title={s.label}
            >
              {s.icon}
            </a>
          ))}
        </nav>

        <div className={styles.links}>
          {LINKS.map((l) => (
            <a key={l.label} href={withBase(l.href)} className={styles.link} data-accent={l.accent}>
              <span className={styles.linkLabel}>{l.label}</span>
              <span className={styles.linkSub}>{l.sub}</span>
              <span className={styles.linkArrow} aria-hidden>
                &rarr;
              </span>
            </a>
          ))}
        </div>

        <a href={withBase("/cv.pdf")} className={styles.download} download>
          Download CV (PDF)
        </a>

        <button type="button" className={styles.escape} onClick={forceDesktop}>
          Open full desktop experience
        </button>
      </div>
    </main>
  );
}
