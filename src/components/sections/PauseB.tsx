"use client";

import { useRef } from "react";
import { VisorOutline } from "@/components/VisorOutline";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import type { Messages } from "@/i18n/messages";
import styles from "./PauseB.module.css";

export function PauseB({ t }: { t: Pick<Messages, "pauseB.title"> }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // The line travels from one temple to the other, then holds.
        gsap.fromTo(
          "[data-draw]",
          { strokeDasharray: 1, strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: root.current, start: "top 80%", end: "center 50%", scrub: 0.5 },
          },
        );
        gsap.from("[data-fade]", {
          opacity: 0,
          y: 10,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 60%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="perspective" data-section ref={root} className={styles.pause} aria-labelledby="perspective-title">
      <div className={styles.guides} aria-hidden="true">
        <span style={{ left: "25%" }} />
        <span style={{ left: "50%" }} />
        <span style={{ left: "75%" }} />
      </div>
      <span className="cross" style={{ left: "25%", top: "30%" }} aria-hidden="true" />
      <span className="cross" style={{ left: "75%", top: "30%" }} aria-hidden="true" />

      <p className={`micro ${styles.code}`} aria-hidden="true">OBJECT STUDY / 001</p>
      <p className={`micro ${styles.front}`} aria-hidden="true">FRONT VIEW</p>

      <div className={styles.visorWrap}>
        <VisorOutline className={styles.visor} />
        <span className={styles.dot} aria-hidden="true" />
        <p className={`micro ${styles.curve}`} aria-hidden="true">CONTINUOUS CURVE</p>
      </div>

      <h2 id="perspective-title" className={`display ${styles.title}`} data-fade>
        {t["pauseB.title"]}
      </h2>
    </section>
  );
}
