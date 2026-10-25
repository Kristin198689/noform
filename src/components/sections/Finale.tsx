"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { studioUrl } from "@/lib/site";
import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/wordmark";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import styles from "./Finale.module.css";

type Strings = Pick<
  Messages,
  "end.heading" | "end.subtitle" | "end.concept" | "end.credit" | "end.fiction" | "ui.top" | "legal.imprint" | "legal.privacy"
>;

export function Finale({ t, locale }: { t: Strings; locale: Locale }) {
  const root = useRef<HTMLElement>(null);
  const pinkRun = useRef<(() => void) | null>(null);

  useGSAP(
    () => {
      // A short pink run along the contour: on hover with a mouse, once on touch screens.
      let run: gsap.core.Tween | null = null;
      pinkRun.current = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (run?.isActive()) return;
        run = gsap.fromTo(
          "[data-run]",
          { strokeDashoffset: 0.14, opacity: 1 },
          { strokeDashoffset: -0.86, duration: 1.8, ease: "power1.inOut", onComplete: () => void gsap.set("[data-run]", { opacity: 0 }) },
        );
      };

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
        // Guides converge towards the wordmark, then the contour draws once.
        tl.fromTo("[data-converge-l]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.out" })
          .fromTo("[data-converge-r]", { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: "power3.out" }, 0)
          .fromTo("[data-col]", { scaleY: 0 }, { scaleY: 1, duration: 1, ease: "power3.out", stagger: 0.06 }, 0.1)
          .fromTo("[data-outline]", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" }, 0.3)
          .from("[data-fade]", { opacity: 0, y: 10, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.5);
        if (window.matchMedia("(hover: none)").matches) tl.call(() => pinkRun.current?.(), [], 2.4);
      });
      return () => {
        mm.revert();
        pinkRun.current = null;
      };
    },
    { scope: root },
  );

  return (
    <section id="end" data-section ref={root} className={styles.finale} aria-labelledby="end-title">
      <div className={styles.cols} aria-hidden="true">
        {[6.4, 30, 50, 70, 93.6].map((x) => (
          <span key={x} style={{ left: `${x}%` }} data-col />
        ))}
      </div>

      <p className={`micro ${styles.top}`}>08 / END OF STUDY</p>

      <div className={styles.headline}>
        <h2 id="end-title" className={styles.heading} data-fade>
          {t["end.heading"]}
        </h2>
        <p className={`micro ${styles.subtitle}`} data-fade>
          {t["end.subtitle"]}
        </p>
      </div>

      <div className={styles.markBlock}>
        <div className={`micro ${styles.markCodes}`} aria-hidden="true">
          <span>END OF STUDY / 008</span>
          <span>FORM / COMPLETE</span>
          <span>BERLIN CONCEPT / 2026</span>
        </div>
        <span className={styles.lineTop} aria-hidden="true">
          <span data-converge-l />
          <span data-converge-r />
        </span>
        <span className="cross" style={{ left: "var(--gutter)", top: "calc(2.2em + 0px)" }} aria-hidden="true" />
        <svg
          className={styles.mark}
          viewBox={WORDMARK_VIEWBOX}
          role="img"
          aria-label="NØFORM"
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") pinkRun.current?.();
          }}
        >
          <path
            data-outline
            d={WORDMARK_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="1"
          />
          <path
            data-run
            className={styles.run}
            d={WORDMARK_PATH}
            fill="none"
            strokeWidth="2.2"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray="0.14 0.86"
          />
        </svg>
        <span className={styles.lineBottom} aria-hidden="true">
          <span data-converge-l />
          <span data-converge-r />
        </span>
      </div>

      <div className={styles.foot}>
        <div className={styles.footCol}>
          <p className={`micro ${styles.concept}`}>{t["end.concept"]}</p>
          <p className="micro">{t["end.fiction"]}</p>
        </div>

        <div className={`${styles.footCol} ${styles.credit}`}>
          <p className="micro">{t["end.credit"]}</p>
          {/* TODO(before public launch): link the verified studio URL; never a placeholder href. */}
          {studioUrl ? (
            <a className={styles.studio} href={studioUrl} rel="author">
              VOLODINA WEB STUDIO <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <p className={styles.studio}>VOLODINA WEB STUDIO</p>
          )}
        </div>

        <div className={`${styles.footCol} ${styles.right}`}>
          <a className={styles.backTop} href="#hero">
            {t["ui.top"]} <span aria-hidden="true">↑</span>
          </a>
          <p className={`micro ${styles.legal}`}>
            <a href={`/${locale}/impressum`}>{t["legal.imprint"]}</a>
            <span aria-hidden="true"> / </span>
            <a href={`/${locale}/datenschutz`}>{t["legal.privacy"]}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
