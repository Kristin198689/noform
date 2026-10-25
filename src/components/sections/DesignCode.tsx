"use client";

import { useRef } from "react";
import { Img } from "@/components/Img";
import { VisorOutline } from "@/components/VisorOutline";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { hoodie } from "@/lib/hoodie";
import { WORDMARK_PATH } from "@/lib/wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./DesignCode.module.css";

type Strings = Pick<
  Messages,
  | "code.title"
  | "code.volume"
  | "code.curve"
  | "code.proportion"
  | "code.p1"
  | "code.p2"
  | "code.statement"
  | "lab.shoulder"
  | "lab.volume"
  | "lab.silhouette"
  | "alt.overhead"
>;

const STUDY = hoodie(0.72);

/** "01 / VOLUME" → pink number, white name */
function Numbered({ text }: { text: string }) {
  const [num, ...rest] = text.split(" / ");
  return (
    <>
      <span className="pink">{num}</span> / {rest.join(" / ")}
    </>
  );
}

export function DesignCode({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 62%", once: true } });
        tl.fromTo("[data-guide-h]", { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "power3.out", stagger: 0.06 })
          .fromTo("[data-guide-v]", { scaleY: 0 }, { scaleY: 1, duration: 0.9, ease: "power3.out", stagger: 0.05 }, 0.1)
          .fromTo(
            "[data-mark]",
            { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 },
            { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" },
            0.2,
          )
          .to("[data-mark]", { fillOpacity: 1, duration: 0.8, ease: "power2.out" }, 1.4)
          .from("[data-code]", { opacity: 0, duration: 0.5, stagger: 0.04 }, 0.6);

        gsap.utils.toArray<HTMLElement>("[data-study]").forEach((study) => {
          gsap.fromTo(
            study.querySelectorAll("[data-draw]"),
            { strokeDasharray: 1, strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.4,
              ease: "power2.inOut",
              stagger: 0.06,
              scrollTrigger: { trigger: study, start: "top 78%", once: true },
            },
          );
          gsap.from(study.querySelectorAll("[data-study-label]"), {
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.6,
            scrollTrigger: { trigger: study, start: "top 78%", once: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="code" data-section ref={root} className={styles.code} aria-labelledby="code-title">
      <div className={styles.bar}>
        <h2 id="code-title" className="micro">
          <span className="pink">05</span> / {t["code.title"]}
        </h2>
        <span className={styles.barRule} data-guide-h aria-hidden="true" />
      </div>

      {/* Wordmark construction — codes are decorative, not product measurements */}
      <div className={styles.markWrap} aria-hidden="true">
        <span className={styles.gCap} data-guide-h />
        <span className={styles.gBase} data-guide-h />
        <span className={styles.gMid} data-guide-h />
        {[7, 23.4, 39.2, 53.8, 69.6, 86].map((x) => (
          <span key={x} className={styles.gTick} style={{ left: `${x}%` }} data-guide-v />
        ))}
        <span className="cross" style={{ left: 0, top: 0 }} />
        <span className="cross" style={{ left: "100%", top: 0 }} />
        <span className="cross" style={{ left: 0, top: "100%" }} />
        <span className="cross" style={{ left: "100%", top: "100%" }} />
        <span className={`deco ${styles.cCap}`} data-code>CAP HEIGHT</span>
        <span className={`deco ${styles.cBase}`} data-code>BASELINE</span>
        <span className={`deco ${styles.cR1}`} data-code>R / A</span>
        <span className={`deco ${styles.cR2}`} data-code>R / B</span>
        <span className={`deco ${styles.cR3}`} data-code>R / C</span>
        <span className={`deco ${styles.cAngle}`} data-code>Ø / AXIS</span>
        <span className={`deco ${styles.cUnit}`} data-code>UNIT / 07</span>
        <svg className={styles.mark} viewBox="40 222 4697 756" focusable="false">
          <path
            data-mark
            d={WORDMARK_PATH}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
          />
          <g className={styles.markGuides}>
            <circle cx="1228" cy="600" r="372" />
            <circle cx="2586" cy="600" r="372" />
            <line x1="980" y1="963" x2="1480" y2="236" />
          </g>
        </svg>
      </div>

      <div className={styles.studies}>
        <article className={styles.study} data-study>
          <header className={styles.studyHead}>
            <h3 className="micro">
              <Numbered text={t["code.volume"]} />
            </h3>
            <p className="deco" aria-hidden="true">FORM STUDY / 001</p>
          </header>
          <div className={styles.figure}>
            <svg viewBox="80 40 840 860" className={styles.hoodie} aria-hidden="true" focusable="false">
              {[STUDY.outline, STUDY.hood, STUDY.hoodOpening, STUDY.seams, STUDY.pocket, STUDY.ribs, STUDY.strings].map((d, i) => (
                <path key={i} data-draw d={d} pathLength={1} />
              ))}
              <line className={styles.dim} x1="96" y1="262" x2="96" y2={STUDY.anchors.hemBottom} />
              <circle className={styles.pt} cx={STUDY.anchors.shoulder[0]} cy={STUDY.anchors.shoulder[1]} r="6" />
              <circle className={styles.pt} cx={STUDY.anchors.sleeve[0]} cy={STUDY.anchors.sleeve[1]} r="6" />
            </svg>
            <ul className={styles.studyLabels}>
              <li className="micro" data-study-label style={{ left: "77%", top: "24%" }}>{t["lab.shoulder"]}</li>
              <li className="micro" data-study-label style={{ left: "77%", top: "46%" }}>{t["lab.volume"]}</li>
              <li className="micro" data-study-label style={{ left: "77%", top: "84%" }}>{t["lab.silhouette"]}</li>
            </ul>
          </div>
        </article>

        <article className={styles.study} data-study>
          <header className={styles.studyHead}>
            <h3 className="micro">
              <Numbered text={t["code.curve"]} />
            </h3>
            <p className="deco" aria-hidden="true">INDEPENDENT SYSTEM</p>
          </header>
          <div className={styles.figure}>
            <svg viewBox="0 -60 1000 400" className={styles.arc} aria-hidden="true" focusable="false">
              <path data-draw d="M180 30 Q500 -60 820 30" pathLength={1} strokeDasharray="1" />
              <line x1="500" y1="-30" x2="500" y2="300" />
              <line x1="120" y1="320" x2="880" y2="320" />
            </svg>
            <VisorOutline className={styles.visor} />
            <span className={`deco ${styles.arcCode}`} aria-hidden="true" data-study-label>ARC / CONTINUOUS</span>
            <span className={`deco ${styles.spanCode}`} aria-hidden="true" data-study-label>SPAN / 01</span>
          </div>
        </article>

        <article className={styles.study} data-study>
          <header className={styles.studyHead}>
            <h3 className="micro">
              <Numbered text={t["code.proportion"]} />
            </h3>
            <p className="deco" aria-hidden="true">CONTINUOUS LINE</p>
          </header>
          <div className={styles.figure}>
            <svg viewBox="0 222 860 756" className={styles.letter} aria-hidden="true" focusable="false">
              <defs>
                <clipPath id="code-n-clip">
                  <rect x="0" y="0" width="800" height="1200" />
                </clipPath>
              </defs>
              <path data-draw d={WORDMARK_PATH} clipPath="url(#code-n-clip)" pathLength={1} />
              <circle className={styles.construct} cx="190" cy="823" r="140" />
              <circle className={styles.construct} cx="640" cy="390" r="140" />
              <line className={styles.construct} x1="60" y1="236" x2="60" y2="963" />
              <line className={styles.construct} x1="40" y1="985" x2="790" y2="985" />
              <circle className={styles.pt} cx="640" cy="250" r="9" />
              <circle className={styles.pt} cx="190" cy="963" r="9" />
            </svg>
            <span className={`deco ${styles.nCode}`} aria-hidden="true" data-study-label>R / D</span>
          </div>
        </article>
      </div>

      <div className={styles.bottom}>
        <div className={styles.copyCols}>
          <p className="reading">
            <span className={styles.dash} aria-hidden="true" />
            {t["code.p1"]}
          </p>
          <p className="reading">
            <span className={styles.dash} aria-hidden="true" />
            {t["code.p2"]}
          </p>
        </div>
        <figure className={styles.thumb}>
          <span className="cross" style={{ left: 0, top: 0 }} aria-hidden="true" />
          <span className="cross" style={{ left: "100%", top: 0 }} aria-hidden="true" />
          <span className="cross" style={{ left: 0, top: "100%" }} aria-hidden="true" />
          <span className="cross" style={{ left: "100%", top: "100%" }} aria-hidden="true" />
          <Img id="look-03" alt={t["alt.overhead"]} sizes="(max-width: 767px) 60vw, 240px" className={styles.thumbImg} />
          <figcaption className="micro" aria-hidden="true">
            CAMPAIGN / FRAME <span className="pink">005</span>
          </figcaption>
        </figure>
        <p className={styles.statement}>
          {t["code.statement"]}
          <span className={styles.statementRule} aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
