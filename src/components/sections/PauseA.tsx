"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import type { Messages } from "@/i18n/messages";
import styles from "./PauseA.module.css";

type Strings = Pick<Messages, "pauseA.title" | "pauseA.caption" | "hero.independent">;

export function PauseA({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);
  const words = t["pauseA.title"].split(" ");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-word]");
        const mid = (items.length - 1) / 2;
        // Words begin slightly gathered and open up into their final spacing, then hold.
        gsap.fromTo(
          items,
          { x: (i: number) => (mid - i) * 28, opacity: 0.35 },
          {
            x: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "center 55%", scrub: 0.6 },
          },
        );
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="reset" data-section className={styles.pause} ref={root} aria-labelledby="reset-title">
      <div className={styles.grid} aria-hidden="true" />
      <p className={`micro ${styles.code}`} aria-hidden="true">TRANSITION / 01</p>
      <p className={`micro ${styles.independent}`}>{t["hero.independent"]}</p>
      <h2 id="reset-title" className={`display ${styles.title}`}>
        {words.map((w, i) => (
          <span key={`${w}-${i}`} data-word className={styles.word}>
            {w}
          </span>
        ))}
      </h2>
      <span className={styles.plus} aria-hidden="true">+</span>
      <a href="#lookbook" className={`micro ${styles.caption}`}>
        {t["pauseA.caption"]} <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
