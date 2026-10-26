"use client";

import { useRef } from "react";
import { Img } from "@/components/Img";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { cue } from "@/lib/sound";
import type { Messages } from "@/i18n/messages";
import { VisorFloat } from "./VisorFloat";
import styles from "./Visor.module.css";

type Strings = Pick<
  Messages,
  | "visor.section"
  | "visor.title"
  | "visor.badge"
  | "visor.shield"
  | "visor.temples"
  | "visor.curve"
  | "visor.statement"
  | "visor.micro"
  | "visor.material"
  | "alt.visor"
>;

// Coordinates in the photo's own pixel space (1536 × 1024): lens edges and the top of the curve.
const POINTERS = [
  { key: "visor.shield", dot: [408, 283], path: "M408 283 L322 226 L232 226", label: [222, 226], align: "end" },
  { key: "visor.temples", dot: [1119, 283], path: "M1119 283 L1215 299 L1300 299", label: [1314, 299], align: "start" },
  { key: "visor.curve", dot: [965, 172], path: "M965 172 L1105 130 L1218 130", label: [1232, 130], align: "start" },
] as const;
// Phones show the portrait full-height, cropped to the centre of the visor: the leaders stay on the lens,
// the temples are outside the frame there.
const POINTERS_NARROW = [
  { key: "visor.shield", dot: [640, 300], path: "M640 300 L612 404", label: [600, 432], align: "start" },
  { key: "visor.curve", dot: [900, 170], path: "M900 170 L872 146", label: [882, 146], align: "end" },
] as const;

const V_LINES = [430, 768, 1105];
const H_LINES = [77, 385, 695, 930];

export function Visor({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Only a slight approach of the portrait — a few percent.
        gsap.fromTo(
          "[data-canvas]",
          { scale: 1 },
          { scale: 1.04, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.6 } },
        );
        // only the pointer set that is on screen (phones show the narrow one)
        const set = `.${window.matchMedia("(max-width: 767px), (max-aspect-ratio: 1/1)").matches ? styles.narrow : styles.wide}`;
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 55%", once: true } });
        tl.from("[data-grid-v]", { scaleY: 0, duration: 1, ease: "power3.out", stagger: 0.08 })
          .from("[data-grid-h]", { scaleX: 0, duration: 1, ease: "power3.out", stagger: 0.08 }, 0.1)
          .from(`${set} [data-pointer-line]`, { strokeDashoffset: 1, duration: 0.7, ease: "power2.out", stagger: 0.28 }, 0.5)
          .add(() => cue("pulse"), 0.5)
          .add(() => cue("pulse"), 0.78)
          .add(() => cue("pulse"), 1.06)
          .from(`${set} [data-pointer-dot]`, { scale: 0, transformOrigin: "50% 50%", duration: 0.35, stagger: 0.28 }, 0.5)
          .from(`${set} [data-pointer-label]`, { opacity: 0, duration: 0.5, stagger: 0.28 }, 0.8)
          .from("[data-fade]", { opacity: 0, y: 10, duration: 0.8, ease: "power3.out", stagger: 0.08 }, 0.6);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="visor" data-section ref={root} className={styles.visor} aria-labelledby="visor-title">
      <div className={styles.stage} data-theme="photo">
        <div className={styles.canvas} data-canvas>
          <Img id="visor-front" alt={t["alt.visor"]} sizes="(max-width: 767px) 330vw, 100vw" className={styles.photo} />

          <div className={styles.grid} aria-hidden="true">
            {V_LINES.map((x) => (
              <span key={`v${x}`} className={styles.v} style={{ left: `${(x / 1536) * 100}%` }} data-grid-v />
            ))}
            {H_LINES.map((y) => (
              <span key={`h${y}`} className={styles.h} style={{ top: `${(y / 1024) * 100}%` }} data-grid-h />
            ))}
            {V_LINES.flatMap((x) =>
              H_LINES.map((y) => (
                <span key={`c${x}-${y}`} className="cross" style={{ left: `${(x / 1536) * 100}%`, top: `${(y / 1024) * 100}%` }} />
              )),
            )}
          </div>

          {[
            { set: POINTERS, cls: styles.wide },
            { set: POINTERS_NARROW, cls: styles.narrow },
          ].map(({ set, cls }, n) => (
            <div key={n} className={cls}>
              <svg className={styles.pointers} viewBox="0 0 1536 1024" aria-hidden="true" focusable="false">
                {set.map((p) => (
                  <g key={p.key}>
                    <path data-pointer-line d={p.path} pathLength={1} strokeDasharray="1" />
                    <circle data-pointer-dot cx={p.dot[0]} cy={p.dot[1]} r="5" />
                  </g>
                ))}
              </svg>
              <ul className={styles.labels}>
                {set.map((p) => (
                  <li
                    key={p.key}
                    className={`micro ${styles.label}`}
                    data-align={p.align}
                    data-pointer-label
                    style={{ left: `${(p.label[0] / 1536) * 100}%`, top: `${(p.label[1] / 1024) * 100}%` }}
                  >
                    {t[p.key]}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.titleBlock}>
            <span className={`capsule ${styles.badge}`} data-fade>
              {t["visor.badge"]}
            </span>
            <h2 id="visor-title" className={styles.title} data-split="chars">
              {t["visor.title"]}
            </h2>
            <p className={`micro ${styles.material}`} data-fade>
              {t["visor.material"]}
            </p>
          </div>

          <p className={`deco ${styles.vertical}`} aria-hidden="true">
            NØFORM / OBJECT STUDY 001
          </p>
        </div>

        <p className={`micro ${styles.section}`}>{t["visor.section"]}</p>
        <div className={styles.statement} data-fade>
            <p className={`micro ${styles.statementHead}`}>{t["visor.statement"]}</p>
            <span className={styles.statementRule} aria-hidden="true" />
            <p className={`micro ${styles.statementMicro}`}>{t["visor.micro"]}</p>
          </div>

        <div className={styles.bottom} aria-hidden="true">
          <span className="micro">CAMPAIGN 001 / FRONT VIEW</span>
          <span className={styles.bottomRule} />
          <span className={`micro ${styles.bottomMark}`}>NØFORM</span>
          <span className={styles.bottomRule} />
        </div>
      </div>
      <VisorFloat label={t["visor.title"]} />
    </section>
  );
}
