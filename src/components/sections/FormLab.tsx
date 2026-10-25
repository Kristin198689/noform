"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { hoodie, type HoodieGeometry } from "@/lib/hoodie";
import { Wordmark } from "@/components/Wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./FormLab.module.css";

type Strings = Pick<
  Messages,
  | "lab.title"
  | "lab.heading"
  | "lab.description"
  | "lab.regular"
  | "lab.oversized"
  | "lab.drag"
  | "lab.volume"
  | "lab.shoulder"
  | "lab.sleeve"
  | "lab.silhouette"
  | "lab.note"
>;

const START = 72;
const PARTS = ["outline", "hood", "hoodOpening", "seams", "pocket", "ribs", "strings"] as const;
type Part = (typeof PARTS)[number];

const pad3 = (n: number) => String(Math.round(n)).padStart(3, "0");

export function FormLab({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);
  const [value, setValue] = useState(START);
  const main = useRef<Partial<Record<Part, SVGPathElement | null>>>({});
  const ghost = useRef<SVGPathElement>(null);
  const shoulderMark = useRef<HTMLSpanElement>(null);
  const sleeveMark = useRef<HTMLSpanElement>(null);
  const shoulderLabel = useRef<HTMLSpanElement>(null);
  const sleeveLabel = useRef<HTMLSpanElement>(null);
  const width = useRef<HTMLSpanElement>(null);
  const tickL = useRef<HTMLSpanElement>(null);
  const tickR = useRef<HTMLSpanElement>(null);
  const scaleMark = useRef<HTMLSpanElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLSpanElement>(null);
  const proxy = useRef({ v: START / 100, g: START / 100 });
  const reduced = useRef(false);

  const draw = useCallback(() => {
    const geo: HoodieGeometry = hoodie(proxy.current.v);
    for (const part of PARTS) main.current[part]?.setAttribute("d", geo[part]);
    ghost.current?.setAttribute("d", hoodie(proxy.current.g).outline);
    const { shoulder, sleeve, hemLeft, hemRight } = geo.anchors;
    // Composite-only: markers move with transforms in figure pixels (viewBox is square, 1000 units).
    const k = (figure.current?.offsetWidth ?? 1000) / 1000;
    const place = (el: HTMLElement | null, [x, y]: [number, number]) => {
      if (el) el.style.transform = `translate3d(${(x * k).toFixed(1)}px, ${(y * k).toFixed(1)}px, 0)`;
    };
    // Shoulder is read on the left side of the garment, sleeve volume on the right.
    const leftShoulder: [number, number] = [1000 - shoulder[0], shoulder[1]];
    place(shoulderMark.current, leftShoulder);
    place(sleeveMark.current, sleeve);
    place(shoulderLabel.current, [leftShoulder[0] - 34, leftShoulder[1] - 46]);
    place(sleeveLabel.current, [sleeve[0] + 24, sleeve[1] - 10]);
    if (width.current) {
      width.current.style.transform = `translateX(${(hemLeft[0] * k).toFixed(1)}px) scaleX(${((hemRight[0] - hemLeft[0]) / 1000).toFixed(4)})`;
    }
    place(tickL.current, [hemLeft[0], 905]);
    place(tickR.current, [hemRight[0], 905]);
    const trackH = track.current?.offsetHeight ?? 0;
    if (scaleMark.current) scaleMark.current.style.transform = `translateY(${(-proxy.current.v * trackH).toFixed(1)}px)`;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    draw();
    const ro = new ResizeObserver(() => draw());
    if (figure.current) ro.observe(figure.current);
    return () => ro.disconnect();
  }, [draw]);

  // Smooth follow; a faint previous contour lags behind (off for reduced motion).
  useEffect(() => {
    const target = value / 100;
    if (reduced.current) {
      proxy.current.v = target;
      proxy.current.g = target;
      draw();
      return;
    }
    const a = gsap.to(proxy.current, { v: target, duration: 0.45, ease: "power3.out", onUpdate: draw });
    const b = gsap.to(proxy.current, { g: target, duration: 1.2, ease: "power2.out", onUpdate: draw });
    return () => {
      a.kill();
      b.kill();
    };
  }, [value, draw]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: "[data-figure]", start: "top 75%", once: true } });
        tl.fromTo("[data-lab-draw]", { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.05 })
          .fromTo("[data-lab-mark]", { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.08 }, 1.1)
          .fromTo("[data-lab-guide]", { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out", stagger: 0.05 }, 0.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  const initial = hoodie(START / 100);

  return (
    <section id="lab" data-section ref={root} className={styles.lab} aria-labelledby="lab-title">
      <div className={styles.bar}>
        <p className="micro">07 / {t["lab.title"]}</p>
        <span className={styles.barRule} data-lab-guide aria-hidden="true" />
      </div>

      <div className={styles.layout}>
        <div className={styles.intro}>
          <h2 id="lab-title" className={`display ${styles.heading}`}>
            {(t["lab.heading"].match(/[^.]+\.?/g) ?? [t["lab.heading"]]).map((line) => (
              <span key={line} className={styles.headingLine}>
                {line.trim()}
              </span>
            ))}
          </h2>
          <p className={styles.description}>{t["lab.description"]}</p>
          <p className={`micro ${styles.studyCodes}`} aria-hidden="true">
            <span>SILHOUETTE STUDY / 001</span>
            <span>VARIABLE VOLUME</span>
            <span>INDEPENDENT EXPRESSION</span>
            <span className={styles.plus}>+</span>
          </p>
          <svg className={styles.construction} viewBox="0 0 300 300" aria-hidden="true" focusable="false">
            <circle cx="120" cy="120" r="100" />
            <circle cx="120" cy="250" r="50" />
            <path d="M20 120 L220 120 M120 20 L120 290 M20 120 L120 20 L220 120" />
            <path className={styles.constructionStrong} d="M180 20 L180 150 Q180 250 280 250" />
            <circle className={styles.node} cx="180" cy="20" r="3" />
            <circle className={styles.node} cx="280" cy="250" r="3" />
            <circle className={styles.node} cx="20" cy="120" r="3" />
          </svg>
          <p className={`deco ${styles.proportion}`} aria-hidden="true">
            PROPORTION
            <br />
            CREATES
            <br />
            FREEDOM
          </p>
        </div>

        <div className={styles.figureCol}>
          <div ref={figure} className={styles.figure} data-figure>
            <span className={styles.axis} aria-hidden="true" />
            <span className={styles.guideH} style={{ top: "26.2%" }} data-lab-guide aria-hidden="true" />
            <span className={styles.guideH} style={{ top: "81.8%" }} data-lab-guide aria-hidden="true" />
            {[
              [8, 10],
              [92, 10],
              [8, 90],
              [92, 90],
            ].map(([x, y]) => (
              <span key={`${x}-${y}`} className="cross" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
            ))}

            <svg className={styles.svg} viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
              <path ref={ghost} className={styles.ghost} d={initial.outline} />
              {PARTS.map((part) => (
                <path
                  key={part}
                  ref={(el) => {
                    main.current[part] = el;
                  }}
                  data-lab-draw
                  className={part === "outline" ? styles.outline : styles.detail}
                  d={initial[part]}
                  pathLength={1}
                />
              ))}
            </svg>

            <span ref={shoulderMark} className={styles.ring} data-lab-mark aria-hidden="true" />
            <span ref={sleeveMark} className={styles.ring} data-lab-mark aria-hidden="true" />
            <span className={styles.ring} style={{ left: "50%", top: "86.4%" }} data-lab-mark aria-hidden="true" />

            <span ref={shoulderLabel} className={`micro ${styles.tag}`} data-lab-mark>
              {t["lab.shoulder"]}
            </span>
            <span ref={sleeveLabel} className={`micro ${styles.tag}`} data-lab-mark>
              {t["lab.sleeve"]}
            </span>
            <span ref={width} className={styles.width} data-lab-mark aria-hidden="true" />
            <span ref={tickL} className={styles.tick} data-lab-mark aria-hidden="true" />
            <span ref={tickR} className={styles.tick} data-lab-mark aria-hidden="true" />
            <span className={`micro ${styles.widthLabel}`} data-lab-mark>
              {t["lab.silhouette"]}
            </span>
          </div>

          <div className={styles.scale} aria-hidden="true">
            {["100", "075", "050", "025", "000"].map((n) => (
              <span key={n} className="deco">
                {n} —
              </span>
            ))}
            <span ref={track} className={styles.scaleTrack}>
              <span ref={scaleMark} className={styles.scaleMark} />
            </span>
          </div>
          <p className={`deco ${styles.view}`} aria-hidden="true">
            FRONT VIEW
            <br />
            UNISEX
            <br />
            OVERSIZED FORM
          </p>
        </div>
      </div>

      <div className={styles.control}>
        <label htmlFor="lab-volume" className={`micro ${styles.readout}`}>
          {t["lab.volume"]} / <output htmlFor="lab-volume">{pad3(value)}</output>
        </label>
        <div className={styles.rangeRow}>
          <span className="micro" aria-hidden="true">{t["lab.regular"]}</span>
          <input
            id="lab-volume"
            className={styles.range}
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            aria-valuetext={`${t["lab.volume"]} ${value} / 100`}
            aria-describedby="lab-note"
            onChange={(e) => setValue(Number(e.currentTarget.value))}
            style={{ "--fill": `${value}%` } as React.CSSProperties}
          />
          <span className="micro" aria-hidden="true">{t["lab.oversized"]}</span>
        </div>
        <p className={`micro ${styles.drag}`} aria-hidden="true">
          {t["lab.drag"]}
        </p>
      </div>

      <div className={styles.foot}>
        <Wordmark className={styles.footMark} label="NØFORM" />
        <p id="lab-note" className={`micro ${styles.note}`}>
          {t["lab.note"]}
        </p>
      </div>
    </section>
  );
}
