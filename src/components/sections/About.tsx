"use client";

import { useRef } from "react";
import { Img } from "@/components/Img";
import { Wordmark } from "@/components/Wordmark";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { WORDMARK_FORM_VIEWBOX, WORDMARK_NO_VIEWBOX } from "@/lib/wordmark";
import type { Messages } from "@/i18n/messages";
import styles from "./About.module.css";

type Strings = Pick<
  Messages,
  "about.title" | "about.eyebrow" | "about.p1" | "about.p2" | "about.p3" | "about.disclaimer" | "hero.tagline" | "alt.low"
>;

/** Renders a phrase with its final full stop in pink, as in the approved layout. */
function PinkStop({ text }: { text: string }) {
  if (!text.endsWith(".")) return <>{text}</>;
  return (
    <>
      {text.slice(0, -1)}
      <span className="pink">.</span>
    </>
  );
}

export function About({ t }: { t: Strings }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Calm reading: thin guides draw in one after another, copy settles.
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        tl.from("[data-hline]", { scaleX: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 })
          .from("[data-vline]", { scaleY: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 0.1)
          .from("[data-pointer]", { opacity: 0, duration: 0.5, stagger: 0.15 }, 0.5)
          .from("[data-reveal]", { opacity: 0, y: 12, duration: 0.8, ease: "power3.out", stagger: 0.07 }, 0.2);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section id="about" data-section ref={root} className={styles.about} aria-labelledby="about-title">
      <div className={styles.bar}>
        <span className="cross" style={{ left: "var(--gutter)", top: "50%" }} aria-hidden="true" />
        <p className="micro">03 / ABOUT NØFORM</p>
        <span className={styles.barRule} data-hline aria-hidden="true" />
      </div>

      <div className={styles.photoCol}>
        <Img id="look-01" alt={t["alt.low"]} sizes="(max-width: 899px) 100vw, 58vw" className={styles.photo} />

        <div className={styles.overlay} aria-hidden="true">
          <span className={styles.gH} style={{ top: "12%" }} data-hline />
          <span className={styles.gV} style={{ left: "10%" }} data-vline />
          <span className={styles.gV} style={{ left: "94%" }} data-vline />
          <span className={styles.gH} style={{ top: "47%", left: "40%", right: 0 }} data-hline />
          <span className="cross" style={{ left: "94%", top: "12%" }} />
          <span className="cross" style={{ left: "10%", top: "92%" }} />

          <div className={`micro ${styles.lookCode}`}>
            <span>LOOK 001 /</span>
            <span>VOLUME STUDY</span>
            <span className={styles.shortRule} />
            <span>CAMPAIGN 2026 /</span>
            <span>FRAME 03</span>
          </div>

          <ul className={`deco ${styles.wordsList}`}>
            <li>PEOPLE</li>
            <li>MOVEMENT</li>
            <li>CLOTHING</li>
            <li>SPACE</li>
            <li>NO FORM</li>
          </ul>

          <div className={styles.pointer} style={{ left: "38%", top: "19%" }} data-pointer>
            <span className={styles.dot} />
            <span className={styles.leader} style={{ width: "clamp(60px, 12vw, 190px)", rotate: "14deg" }} />
            <span className={`micro ${styles.pointerLabel}`}>01 / FORM</span>
          </div>
          <div className={styles.pointer} style={{ left: "30%", top: "66%" }} data-pointer>
            <span className={styles.dot} />
            <span className={styles.leader} style={{ width: "clamp(60px, 13vw, 200px)", rotate: "12deg" }} />
            <span className={`micro ${styles.pointerLabel}`}>02 / TEXTURE</span>
          </div>

          <div className={styles.split}>
            <Wordmark className={styles.splitNo} viewBox={WORDMARK_NO_VIEWBOX} />
            <span className={`capsule ${styles.studio}`}>STUDIO 001</span>
            <Wordmark className={styles.splitForm} viewBox={WORDMARK_FORM_VIEWBOX} />
          </div>

          <p className={`deco ${styles.vertical}`}>UNRESTRICTED SILHOUETTES / INDEPENDENT EXPRESSION</p>
          <p className={`deco ${styles.years}`}>
            <span>20</span>
            <span>—</span>
            <span>26</span>
          </p>
          <p className={`deco ${styles.collectionV}`}>COLLECTION 001</p>
          <p className={`deco ${styles.coords}`}>
            <span>52.5200° N</span>
            <span>13.4050° E</span>
          </p>
          <ul className={`deco ${styles.berlin}`}>
            <li>BERLIN</li>
            <li>INDEPENDENT</li>
            <li>STREETWEAR</li>
            <li>FOR A</li>
            <li>WIDER TOMORROW</li>
          </ul>
        </div>
      </div>

      <div className={styles.textCol}>
        <p className={`micro ${styles.eyebrow}`} data-reveal>
          {t["about.eyebrow"]}
          <span className={styles.eyebrowRule} aria-hidden="true" />
        </p>
        <h2 id="about-title" className={`display ${styles.title}`} data-reveal>
          <PinkStop text={t["about.title"]} />
        </h2>
        <div className={`reading ${styles.copy}`}>
          <p data-reveal>{t["about.p1"]}</p>
          <p data-reveal>{t["about.p2"]}</p>
          <p data-reveal>{t["about.p3"]}</p>
        </div>

        <div className={styles.meta}>
          <span className={styles.metaRule} data-hline aria-hidden="true" />
          <dl className={styles.metaGrid}>
            <div>
              <dt className="micro">BERLIN</dt>
              <dd className="deco">
                52.5200° N<br />
                13.4050° E
              </dd>
            </div>
            <div className={styles.metaMid}>
              <dt className="micro">2026</dt>
              <dd className="micro">COLLECTION 001</dd>
            </div>
            <div>
              <dt className="sr-only">NØFORM</dt>
              <dd className="deco">
                CLOTHING
                <br />
                COMMUNITY
                <br />
                SELF EXPRESSION
                <br />
                BEYOND EXPECTATION
              </dd>
            </div>
          </dl>
          <span className={styles.metaRule} data-hline aria-hidden="true" />
        </div>

        <p className={styles.tagline} data-reveal>
          <PinkStop text={t["hero.tagline"]} />
        </p>

        <div className={styles.foot}>
          <p className="micro">{t["about.disclaimer"]}</p>
          <p className="micro" aria-hidden="true">NØFORM</p>
        </div>
      </div>
    </section>
  );
}
